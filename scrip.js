
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
    document.getElementById("loginPage").style.display = "flex";
}

function showRegister(event) {
    event.preventDefault();
    document.getElementById("welcomePage").style.display = "none";
    document.getElementById("loginPage").style.display = "none";
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

function registerAccount(event) {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

    if (accounts.some(user => user.email === email)) {
        document.getElementById("registerMessage").textContent =
            "Email already registered.";
        return;
    }

    if (accounts.some(user => String(user.username || "").toLowerCase() === username.toLowerCase())) {
        document.getElementById("registerMessage").textContent =
            "Username already taken.";
        return;
    }

    accounts.push({ username, email, password, role: "resident" });
    localStorage.setItem("accounts", JSON.stringify(accounts));

    document.getElementById("registerMessage").textContent =
        "Account created! You can now log in.";

    event.target.reset();
}

function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

    const user = accounts.find(account =>
        account.email === email && account.password === password
    );

    if (user) {
        const role = user.role === "admin" ? "admin" : "resident";
        localStorage.setItem("currentUser", user.username);
        localStorage.setItem("currentEmail", user.email);
        localStorage.setItem("currentRole", role);
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("loginMessage").textContent =
            "Invalid email or password. Please register first.";
    }
}

function forgotPassword(event) {
    event.preventDefault();
    alert("Please contact the administrator for password assistance.");
}
