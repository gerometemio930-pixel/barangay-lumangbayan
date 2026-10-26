
function updateLiveClock() {
    const clock = document.getElementById("liveClock");

    if (!clock) return;

    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
    const dateFormatter = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    clock.textContent = `${dateFormatter.format(now)} · ${timeFormatter.format(now)} PHT`;
    clock.dateTime = now.toISOString();
}

updateLiveClock();
window.setInterval(updateLiveClock, 1000);

function showLogin() {
    document.getElementById("welcomePage").style.display = "none";
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("forgotPasswordPage").style.display = "none";
    document.getElementById("resetPasswordPage").style.display = "none";
    document.getElementById("loginPage").style.display = "flex";
}

function showRegister(event) {
    event.preventDefault();
    document.getElementById("welcomePage").style.display = "none";
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("forgotPasswordPage").style.display = "none";
    document.getElementById("resetPasswordPage").style.display = "none";
    document.getElementById("registerPage").style.display = "flex";
}

function backToLogin(event) {
    event.preventDefault();
    showLogin();
}

function togglePassword(id, button) {
    const field = document.getElementById(id);

    if (field.type === "password") {
        field.type = "text";
        button.textContent = "🙈";
    } else {
        field.type = "password";
        button.textContent = "👁";
    }
}

async function apiRequest(path, body) {
    let response;
    try {
        response = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    } catch (error) {
        throw new Error("The server is unavailable right now. Please start the app or open the correct page.");
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || "The request could not be completed. Please try again.");
    }
    return result;
}

async function registerAccount(event) {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const role = document.getElementById("registerRole").value;
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    if (password.length < 8) {
        document.getElementById("registerMessage").textContent =
            "Password must be at least 8 characters.";
        return;
    }

    const message = document.getElementById("registerMessage");
    try {
        await apiRequest("/api/register", { username, email, password, role });
        const accounts = JSON.parse(localStorage.getItem("accounts") || "[]")
            .filter(user => String(user.email || "").toLowerCase() !== email);
        accounts.push({ username, email, role });
        localStorage.setItem("accounts", JSON.stringify(accounts));
        message.textContent = "Account created! You can now log in.";
        event.target.reset();
    } catch (error) {
        message.textContent = error.message;
    }
}

async function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    try {
        let user;
        try {
            user = await apiRequest("/api/login", { email, password });
        } catch (error) {
            const legacyAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
            const legacyAccount = legacyAccounts.find(account =>
                String(account.email || "").toLowerCase() === email && account.password === password
            );
            if (!legacyAccount) throw error;

            try {
                await apiRequest("/api/register", {
                    username: legacyAccount.username,
                    email,
                    password
                });
            } catch {
                // An existing backend account will be checked by the login request below.
            }
            user = await apiRequest("/api/login", { email, password });
        }
        sessionStorage.setItem("authSession", JSON.stringify({
            type: user.role,
            username: user.username,
            email: user.email
        }));
        const accounts = JSON.parse(localStorage.getItem("accounts") || "[]")
            .filter(account => String(account.email || "").toLowerCase() !== user.email);
        accounts.push({ username: user.username, email: user.email, role: user.role });
        localStorage.setItem("accounts", JSON.stringify(accounts));
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentEmail");
        localStorage.removeItem("currentRole");
        window.location.href = "dashboard.html";
    } catch (error) {
        document.getElementById("loginMessage").textContent =
            error.message || "Unable to sign in. Please try again.";
    }
}

function getResidentSession() {
    let session;
    try {
        session = JSON.parse(sessionStorage.getItem("authSession") || "null");
    } catch {
        return null;
    }
    if (!session || session.type !== "resident") return null;

    return session.username && session.email
        ? { username: session.username, email: session.email }
        : null;
}

function isAdminSession() {
    let session;
    try {
        session = JSON.parse(sessionStorage.getItem("authSession") || "null");
    } catch {
        return false;
    }
    return Boolean(session && session.type === "admin" && session.email);
}

function forgotPassword(event) {
    event.preventDefault();
    document.getElementById("welcomePage").style.display = "none";
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("resetPasswordPage").style.display = "none";
    document.getElementById("resetEmail").value = document.getElementById("email").value.trim();
    document.getElementById("forgotPasswordPage").style.display = "flex";
}

async function sendPasswordReset(event) {
    event.preventDefault();
    const message = document.getElementById("resetRequestMessage");
    message.textContent = "Sending reset link...";
    try {
        const email = document.getElementById("resetEmail").value.trim().toLowerCase();
        const result = await apiRequest("/api/forgot-password", { email });
        message.textContent = result.message;
    } catch (error) {
        message.textContent = error.message;
    }
}

async function resetPassword(event) {
    event.preventDefault();
    const message = document.getElementById("resetPasswordMessage");
    const password = document.getElementById("newPassword").value;
    const confirmation = document.getElementById("confirmPassword").value;
    if (password !== confirmation) {
        message.textContent = "The passwords do not match.";
        return;
    }

    try {
        await apiRequest("/api/reset-password", {
            token: new URLSearchParams(window.location.search).get("resetToken"),
            password
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        showLogin();
        document.getElementById("loginMessage").textContent = "Password updated. You can now sign in.";
    } catch (error) {
        message.textContent = error.message;
    }
}

const passwordResetToken = new URLSearchParams(window.location.search).get("resetToken");
if (passwordResetToken) {
    document.getElementById("welcomePage").style.display = "none";
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("forgotPasswordPage").style.display = "none";
    document.getElementById("resetPasswordPage").style.display = "flex";
}
