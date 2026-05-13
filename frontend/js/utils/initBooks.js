/* ============================================================
   initBooks.js  —  seeds default books into localStorage
   must be loaded after booksData.js
   bug fixed: function was defined but never called in original
   ============================================================ */

function initBooks() {
  /* debug: check if defaultBooks exists */
  console.log("initBooks() called. defaultBooks is:", defaultBooks);
  
  /* only seed if books key does not exist yet */
  if (!localStorage.getItem("books")) {
    localStorage.setItem("books", JSON.stringify(defaultBooks));
    console.log("✓ default books seeded into localstorage.. count:", defaultBooks.length);
  } else {
    console.log("books already exist in localStorage");
  }
}

/* call immediately so books are ready before any page script runs */
initBooks();
