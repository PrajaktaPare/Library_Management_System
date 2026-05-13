/* ============================================================
   index.js  —  login page logic
   handles: role tab switching, form validation, login flow
   supports login with username OR email
   ============================================================ */

const API_URL = localStorage.getItem("apiUrl") || "http://localhost:5000/api/v1";

/* --- role tab switching --- */
const roleTabs    = document.querySelectorAll(".role-tab");
const userRoleInput = document.getElementById("userRole");

roleTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    roleTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    userRoleInput.value = tab.getAttribute("data-role");
  });
});

/* --- dom references --- */
const loginForm     = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");

/* --- validate username or email --- */
function validateUsername(username) {
  if (username.length === 0)   return "Username or email is required";
  if (username.length < 3)     return "Must be at least 3 characters";
  return "valid";
}

/* --- validate password --- */
function validatePassword(password) {
  if (password.includes(" "))           return "No spaces allowed";
  if (password.length < 8)              return "Password must be at least 8 characters";
  return "valid";
}

/* --- live validation --- */
usernameInput.addEventListener("input", () => {
  const result = validateUsername(usernameInput.value.trim());
  if (result !== "valid") {
    usernameError.textContent  = result;
    usernameError.style.display = "block";
    usernameInput.style.border  = "2px solid red";
  } else {
    usernameError.textContent  = "";
    usernameError.style.display = "none";
    usernameInput.style.border  = "2px solid green";
  }
});

passwordInput.addEventListener("input", () => {
  const result = validatePassword(passwordInput.value.trim());
  if (result !== "valid") {
    passwordError.textContent  = result;
    passwordError.style.display = "block";
    passwordInput.style.border  = "2px solid red";
  } else {
    passwordError.textContent  = "";
    passwordError.style.display = "none";
    passwordInput.style.border  = "2px solid green";
  }
});

/* --- form submission --- */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const role     = userRoleInput.value;

  usernameError.textContent = "";
  passwordError.textContent = "";

  const usernameResult = validateUsername(username);
  const passwordResult = validatePassword(password);

  if (usernameResult !== "valid") {
    usernameError.textContent  = usernameResult;
    usernameError.style.display = "block";
    return;
  }

  if (passwordResult !== "valid") {
    passwordError.textContent  = passwordResult;
    passwordError.style.display = "block";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach(error => {
          if (error.field === "username") {
            usernameError.textContent = error.message;
            usernameError.style.display = "block";
          } else if (error.field === "password") {
            passwordError.textContent = error.message;
            passwordError.style.display = "block";
          }
        });
      } else {
        showToast(data.message || "Login failed", "error");
      }
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(data.data.user));
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("isLoggedIn", "true");

    showToast("Login successful!", "success");

    setTimeout(() => {
      if (data.data.user.role === "admin") {
        window.location.replace("pages/admin-dashboard.html");
      } else {
        window.location.replace("pages/student-dashboard.html");
      }
    }, 1000);

  } catch (error) {
    console.error("Login error:", error);
    showToast("Connection error. Please try again.", "error");
  }
});
