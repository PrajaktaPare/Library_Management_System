/* ============================================================
   auth.js — admin authentication guard
   included on every admin page before page-specific scripts
   redirects to login if user is not a logged-in admin
   ============================================================ */

// check admin auth immediately on script load
function checkAdminAuth() {
  // read token and user from localStorage
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // redirect if no token, no user, or not admin role
  if (!token || !currentUser || currentUser.role !== "admin") {
    window.location.href = "../index.html";
  }
}

// execute the guard immediately
checkAdminAuth();
