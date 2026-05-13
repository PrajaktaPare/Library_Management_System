/* ============================================================
   auth_student.js — student authentication guard
   included on every student page before page-specific scripts
   redirects to login if user is not a logged-in student
   ============================================================ */

// check student auth immediately via IIFE
(function checkStudentSession() {
  // read token and user from localStorage
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // redirect if no token, no user, or not student role
  if (!token || !currentUser || currentUser.role !== "student") {
    window.location.href = "../index.html";
  }
})();
