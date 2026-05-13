/* ============================================================
   register.js — student-only registration with email (API connected)
   admin accounts are created via database seed script only
   ============================================================ */
const API_URL = localStorage.getItem("apiUrl") || "http://localhost:5000/api/v1";

const registerForm = document.getElementById("registerForm");
const fullnameInput = document.getElementById("fullname");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const fullnameError = document.getElementById("fullnameError");
const usernameError = document.getElementById("usernameError");
const emailError = document.getElementById("emailError");
const phoneError = document.getElementById("phoneError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

function validateFullname(n) { if (!n) return "Full name is required"; if (n.length < 3) return "Min 3 characters"; return "valid"; }
function validateUsername(u) { if (!u) return "Username is required"; if (u.includes(" ")) return "No spaces"; if (u.length < 3) return "Min 3 characters"; return "valid"; }
function validateEmail(e) { if (!e) return "Email is required"; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Enter a valid email"; return "valid"; }
function validatePhone(p) { if (!p) return "valid"; if (!/^[0-9]{10}$/.test(p)) return "Enter valid 10-digit number"; return "valid"; }
function validatePassword(p) { if (!p) return "Password is required"; if (p.length < 8) return "Min 8 characters"; if (!/[A-Z]/.test(p)) return "Need uppercase"; if (!/[a-z]/.test(p)) return "Need lowercase"; if (!/[0-9]/.test(p)) return "Need number"; if (!/[@$!%*?&]/.test(p)) return "Need special char"; return "valid"; }
function validateConfirm(p, c) { if (!c) return "Confirm password"; if (p !== c) return "Passwords don't match"; return "valid"; }

function showFieldError(el, msg) { if (!el) return; el.textContent = msg !== "valid" ? msg : ""; el.style.display = msg !== "valid" ? "block" : "none"; }

fullnameInput.addEventListener("input", () => showFieldError(fullnameError, validateFullname(fullnameInput.value.trim())));
usernameInput.addEventListener("input", () => showFieldError(usernameError, validateUsername(usernameInput.value.trim())));
emailInput.addEventListener("input", () => showFieldError(emailError, validateEmail(emailInput.value.trim())));
phoneInput.addEventListener("input", () => showFieldError(phoneError, validatePhone(phoneInput.value.trim())));
passwordInput.addEventListener("input", () => showFieldError(passwordError, validatePassword(passwordInput.value.trim())));
confirmPasswordInput.addEventListener("input", () => showFieldError(confirmPasswordError, validateConfirm(passwordInput.value.trim(), confirmPasswordInput.value.trim())));

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = fullnameInput.value.trim();
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (validateFullname(name) !== "valid") { showToast(validateFullname(name), "error"); return; }
  if (validateUsername(username) !== "valid") { showToast(validateUsername(username), "error"); return; }
  if (validateEmail(email) !== "valid") { showToast(validateEmail(email), "error"); return; }
  if (validatePhone(phone) !== "valid") { showToast(validatePhone(phone), "error"); return; }
  if (validatePassword(password) !== "valid") { showToast(validatePassword(password), "error"); return; }
  if (validateConfirm(password, confirmPassword) !== "valid") { showToast(validateConfirm(password, confirmPassword), "error"); return; }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, name, phone, role: "student" })
    });
    const data = await response.json();
    if (!response.ok) { showToast(data.message || "Registration failed", "error"); return; }
    showToast("Registration successful! Check your email for welcome message. Redirecting...", "success");
    setTimeout(() => { window.location.replace("../index.html"); }, 2000);
  } catch (error) { console.error("Registration error:", error); showToast("Connection error. Please try again.", "error"); }
});
