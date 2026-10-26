
document.addEventListener("DOMContentLoaded", function () {
    // SHOW / HIDE PASSWORD
    document.querySelectorAll(".toggle-password").forEach(function (button) {
        button.addEventListener("click", function () {
            const targetId = button.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);

            if (!passwordInput) {
                alert("Password field not found.");
                return;
            }

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                button.textContent = "🙈";
            } else {
                passwordInput.type = "password";
                button.textContent = "👁";
            }
        });
    });

    // SIGN UP
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = document.getElementById("signupName").value.trim();
            const email = document.getElementById("signupEmail").value.trim().toLowerCase();
            const password = document.getElementById("signupPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const message = document.getElementById("signupMessage");

            if (password.length < 6) {
                message.textContent = "Password must be at least 6 characters.";
                return;
            }

            if (password !== confirmPassword) {
                message.textContent = "Passwords do not match.";
                return;
            }

            const users = JSON.parse(localStorage.getItem("schoolHubUsers") || "[]");

            if (users.some(function (user) {
                return user.email === email;
            })) {
                message.textContent = "This email is already registered. Please log in.";
                return;
            }

            users.push({
                name: name,
                email: email,
                password: password
            });

            localStorage.setItem("schoolHubUsers", JSON.stringify(users));

            alert("Account created successfully! You can now log in.");
            window.location.href = "login.html";
        });
    }

    // LOGIN
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPassword").value;
            const message = document.getElementById("loginMessage");

            const users = JSON.parse(localStorage.getItem("schoolHubUsers") || "[]");

            const user = users.find(function (item) {
                return item.email === email && item.password === password;
            });

            if (!user) {
                message.textContent = "Incorrect email or password. Please try again.";
                return;
            }

            sessionStorage.setItem("schoolHubCurrentUser", JSON.stringify({
                name: user.name,
                email: user.email
            }));

            window.location.href = "dashboard.html";
        });
    }

    // DASHBOARD
    const announcementList = document.getElementById("announcementList");

    if (announcementList) {
        const currentUser = JSON.parse(
            sessionStorage.getItem("schoolHubCurrentUser") || "null"
        );

        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const welcomeName = document.getElementById("welcomeName");
        if (welcomeName) {
            welcomeName.textContent = "Welcome, " + currentUser.name + "!";
        }

        const announcements = [
            {
                title: "Enrollment Announcement",
                category: "Academic",
                date: "October 20, 2026",
                description: "Students are reminded to check the enrollment schedule and complete all required documents."
            },
            {
                title: "School Clean-Up Drive",
                category: "Activity",
                date: "October 22, 2026",
                description: "All students are encouraged to participate in our school clean-up activity. Please coordinate with your class adviser."
            },
            {
                title: "Examination Schedule",
                category: "Important",
                date: "October 26, 2026",
                description: "Please review your subjects and check with your teachers for the final examination schedule."
            },
            {
                title: "Student Organization Meeting",
                category: "Meeting",
                date: "October 28, 2026",
                description: "Student organization representatives are invited to attend the scheduled meeting after class."
            }
        ];

        function displayAnnouncements(searchText) {
            announcementList.innerHTML = "";

            const filtered = announcements.filter(function (announcement) {
                return (
                    announcement.title.toLowerCase().includes(searchText) ||
                    announcement.category.toLowerCase().includes(searchText) ||
                    announcement.description.toLowerCase().includes(searchText)
                );
            });

            if (filtered.length === 0) {
                announcementList.innerHTML =
                    '<p class="empty-message">No announcements found.</p>';
                return;
            }

            filtered.forEach(function (announcement) {
                const card = document.createElement("article");
                card.className = "announcement-card";

                const category = document.createElement("span");
                category.className = "category";
                category.textContent = announcement.category;

                const title = document.createElement("h2");
                title.textContent = announcement.title;

                const date = document.createElement("p");
                date.className = "announcement-date";
                date.textContent = "📅 " + announcement.date;

                const description = document.createElement("p");
                description.textContent = announcement.description;

                card.append(category, title, date, description);
                announcementList.appendChild(card);
            });
        }

        displayAnnouncements("");

        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                displayAnnouncements(searchInput.value.trim().toLowerCase());
            });
        }
    }

    // LOGOUT
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            sessionStorage.removeItem("schoolHubCurrentUser");
            window.location.href = "login.html";
        });
    }
});
