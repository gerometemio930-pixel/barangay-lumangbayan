require("dotenv").config();

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");

const app = express();
const root = __dirname;
const storeDirectory = path.join(root, ".private-data");
const storePath = path.join(storeDirectory, "accounts.json");
const port = Number(process.env.PORT || 3000);
const resetTokenLifetime = 30 * 60 * 1000;

app.use(express.json({ limit: "10kb" }));

async function readStore() {
    try {
        const contents = await fs.readFile(storePath, "utf8");
        const store = JSON.parse(contents);
        return {
            accounts: Array.isArray(store.accounts) ? store.accounts : [],
            resetTokens: Array.isArray(store.resetTokens) ? store.resetTokens : []
        };
    } catch (error) {
        if (error.code === "ENOENT") return { accounts: [], resetTokens: [] };
        throw error;
    }
}

async function writeStore(store) {
    await fs.mkdir(storeDirectory, { recursive: true });
    const temporaryPath = `${storePath}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), { mode: 0o600 });
    await fs.rename(temporaryPath, storePath);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) return reject(error);
            resolve({ salt, hash: derivedKey.toString("hex") });
        });
    });
}

async function verifyPassword(password, account) {
    const derived = await hashPassword(password, account.salt);
    const expected = Buffer.from(account.passwordHash, "hex");
    const actual = Buffer.from(derived.hash, "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

async function smtpTransport() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !process.env.SMTP_FROM) {
        throw new Error("Password reset email is not configured. Set the SMTP environment variables and try again.");
    }
    const { createTransport } = await import("nodemailer");
    return createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
}

function validEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post("/api/register", async (request, response, next) => {
    try {
        const username = String(request.body.username || "").trim();
        const email = String(request.body.email || "").trim().toLowerCase();
        const password = request.body.password;
        const role = request.body.role || "resident";
        if (role !== "resident" && role !== "admin") {
            return response.status(400).json({ error: "Choose a valid account type." });
        }
        if (!username || username.length > 80 || !validEmail(email) || typeof password !== "string" || password.length < 8) {
            return response.status(400).json({ error: "Enter a username, valid email, and password of at least 8 characters." });
        }

        const store = await readStore();
        if (store.accounts.some(account => account.email === email)) {
            return response.status(409).json({ error: "Email already registered." });
        }
        if (store.accounts.some(account => account.username.toLowerCase() === username.toLowerCase())) {
            return response.status(409).json({ error: "Username already taken." });
        }

        const credentials = await hashPassword(password);
        store.accounts.push({
            username,
            email,
            role,
            salt: credentials.salt,
            passwordHash: credentials.hash,
            createdAt: new Date().toISOString()
        });
        await writeStore(store);
        response.status(201).json({ message: "Account created." });
    } catch (error) {
        next(error);
    }
});

app.post("/api/login", async (request, response, next) => {
    try {
        const email = String(request.body.email || "").trim().toLowerCase();
        const password = request.body.password;
        const store = await readStore();
        const account = store.accounts.find(item => item.email === email);
        if (!account || typeof password !== "string" || !(await verifyPassword(password, account))) {
            return response.status(401).json({ error: "Invalid email or password." });
        }
        response.json({ username: account.username, email: account.email, role: account.role || "resident" });
    } catch (error) {
        next(error);
    }
});

app.post("/api/forgot-password", async (request, response, next) => {
    try {
        const email = String(request.body.email || "").trim().toLowerCase();
        if (!validEmail(email)) return response.status(400).json({ error: "Enter a valid email address." });

        const mailer = await smtpTransport();
        const store = await readStore();
        store.resetTokens = store.resetTokens.filter(item => item.expiresAt > Date.now());
        const account = store.accounts.find(item => item.email === email);

        if (account) {
            const token = crypto.randomBytes(32).toString("hex");
            const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
            const resetUrl = new URL("/", baseUrl);
            resetUrl.searchParams.set("resetToken", token);
            store.resetTokens.push({
                tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
                email,
                expiresAt: Date.now() + resetTokenLifetime
            });
            await writeStore(store);
            try {
                await mailer.sendMail({
                    from: process.env.SMTP_FROM,
                    to: email,
                    subject: "Reset your Barangay Lumangbayan portal password",
                    text: `Use this link within 30 minutes to reset your password: ${resetUrl.toString()}`,
                    html: `<p>Use the link below within 30 minutes to reset your password.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p>`
                });
            } catch (error) {
                store.resetTokens = store.resetTokens.filter(item => item.email !== email);
                await writeStore(store);
                throw error;
            }
        }

        response.json({ message: "If an account exists for that email, a password reset link has been sent." });
    } catch (error) {
        next(error);
    }
});

app.post("/api/reset-password", async (request, response, next) => {
    try {
        const { token, password } = request.body;
        if (typeof token !== "string" || typeof password !== "string" || password.length < 8) {
            return response.status(400).json({ error: "Use a valid reset link and a password of at least 8 characters." });
        }

        const store = await readStore();
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const tokenIndex = store.resetTokens.findIndex(item =>
            item.tokenHash === tokenHash && item.expiresAt > Date.now()
        );
        if (tokenIndex < 0) {
            return response.status(400).json({ error: "This reset link is invalid or has expired. Request a new one." });
        }

        const reset = store.resetTokens[tokenIndex];
        const account = store.accounts.find(item => item.email === reset.email);
        if (!account) return response.status(400).json({ error: "This reset link is invalid or has expired. Request a new one." });

        const credentials = await hashPassword(password);
        account.salt = credentials.salt;
        account.passwordHash = credentials.hash;
        store.resetTokens = store.resetTokens.filter((_, index) => index !== tokenIndex);
        await writeStore(store);
        response.json({ message: "Password updated." });
    } catch (error) {
        next(error);
    }
});

app.use((request, response, next) => {
    if (request.path.startsWith("/.private-data/")) return response.sendStatus(404);
    next();
});
app.use(express.static(root, { dotfiles: "deny" }));
app.use((error, request, response, next) => {
    console.error(error.message);
    response.status(500).json({ error: error.message.includes("not configured")
        ? error.message
        : "The server could not complete the request. Please try again later." });
});

app.listen(port, () => console.log(`Barangay portal listening on http://localhost:${port}`));