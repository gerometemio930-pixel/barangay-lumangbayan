/* =================================
   SHOW LOGIN
================================= */

function showLogin() {

    document.getElementById("welcomePage").style.display = "none";

    document.getElementById("registerPage").style.display = "none";

    document.getElementById("loginPage").style.display = "flex";

}


/* =================================
   SHOW REGISTER
================================= */

function showRegister(event) {

    event.preventDefault();

    document.getElementById("welcomePage").style.display = "none";

    document.getElementById("loginPage").style.display = "none";

    document.getElementById("registerPage").style.display = "flex";

}


/* =================================
   BACK TO LOGIN
================================= */

function backToLogin(event) {

    event.preventDefault();

    document.getElementById("registerPage").style.display = "none";

    document.getElementById("welcomePage").style.display = "none";

    document.getElementById("loginPage").style.display = "flex";

}


/* =================================
   REGISTER ACCOUNT
================================= */

function registerAccount(event) {

    event.preventDefault();


    const username =
        document.getElementById("registerUsername").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("registerPassword").value;

    const message =
        document.getElementById("registerMessage");


    /* CHECK IF ACCOUNT ALREADY EXISTS */

    const existingAccount =
        localStorage.getItem("barangayAccount");


    if (existingAccount) {

        const account =
            JSON.parse(existingAccount);


        if (account.email === email) {

            message.innerHTML =
                "This email is already registered.";

            message.style.color = "#d32f2f";

            return;
        }

    }


    /* CREATE ACCOUNT */

    const newAccount = {

        username: username,

        email: email,

        password: password

    };


    /* SAVE ACCOUNT */

    localStorage.setItem(
        "barangayAccount",
        JSON.stringify(newAccount)
    );


    /* SUCCESS MESSAGE */

    message.innerHTML =
        "✓ Account created successfully!";

    message.style.color = "#21a765";


    /* CLEAR FORM */

    document.getElementById("registerUsername").value = "";

    document.getElementById("registerEmail").value = "";

    document.getElementById("registerPassword").value = "";

    document.getElementById("terms").checked = false;


    /* GO TO LOGIN AFTER 1 SECOND */

    setTimeout(function() {

        document.getElementById("registerPage").style.display = "none";

        document.getElementById("loginPage").style.display = "flex";


        document.getElementById("loginMessage").innerHTML =
            "Account created. You can now sign in.";

        document.getElementById("loginMessage").style.color =
            "#21a765";


    }, 1000);

}


/* =================================
   LOGIN
================================= */

function login(event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim().toLowerCase();

    const password =
        document.getElementById("password").value;

    const rememberMe =
        document.getElementById("rememberMe").checked;

    const message =
        document.getElementById("loginMessage");


    /* GET REGISTERED ACCOUNT */

    const savedAccount =
        localStorage.getItem("barangayAccount");


    /* NO ACCOUNT YET */

    if (!savedAccount) {

        message.innerHTML =
            "No account found. Please sign up first.";

        message.style.color = "#d32f2f";

        return;
    }


    /* CONVERT SAVED ACCOUNT */

    const account =
        JSON.parse(savedAccount);


    /* CHECK EMAIL AND PASSWORD */

    if (
        email === account.email &&
        password === account.password
    ) {

        message.innerHTML =
            "✓ Sign in successful! Welcome, " +
            account.username + ".";

        message.style.color = "#21a765";


        /* REMEMBER ME */

        if (rememberMe) {

            localStorage.setItem(
                "rememberedEmail",
                email
            );

        } else {

            localStorage.removeItem(
                "rememberedEmail"
            );

        }


        /*
           DITO NATIN ILALAGAY ANG DASHBOARD
           SA NEXT PART NG PROJECT
        */

    } else {

        message.innerHTML =
            "Invalid email or password.";

        message.style.color = "#d32f2f";

    }

}


/* =================================
   FORGOT PASSWORD
================================= */

function forgotPassword(event) {

    event.preventDefault();


    const savedAccount =
        localStorage.getItem("barangayAccount");


    if (!savedAccount) {

        alert(
            "No account found. Please register first."
        );

        return;
    }


    const account =
        JSON.parse(savedAccount);


    alert(
        "Your registered email is: " +
        account.email
    );

}


/* =================================
   REMEMBERED EMAIL
================================= */

window.onload = function() {

    const rememberedEmail =
        localStorage.getItem("rememberedEmail");


    if (rememberedEmail) {

        const emailInput =
            document.getElementById("email");


        if (emailInput) {

            emailInput.value =
                rememberedEmail;

        }


        const rememberCheckbox =
            document.getElementById("rememberMe");


        if (rememberCheckbox) {

            rememberCheckbox.checked =
                true;

        }

    }

};