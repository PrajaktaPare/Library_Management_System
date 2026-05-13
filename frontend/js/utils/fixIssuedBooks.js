/* ============================================================
   fixIssuedBooks.js — ensures issuedBooks array exists in localStorage
   prevents errors on pages that read issuedBooks before any are created
   ============================================================ */

// seed an empty issuedBooks array if none exists
if (!localStorage.getItem("issuedBooks")) {
  localStorage.setItem("issuedBooks", JSON.stringify([]));
}
