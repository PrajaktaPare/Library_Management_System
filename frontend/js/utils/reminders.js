/* ============================================================
   reminders.js — reminder system that runs independently
   used by: student-notifications.html (keeps reminders running 24/7)
            issues.js (admin page also uses this)
   ============================================================ */

/* --- get issued books --- */
function getIssuedBooks() {
  return JSON.parse(localStorage.getItem("issuedBooks")) || [];
}

/* --- get books --- */
function getBooks() {
  return JSON.parse(localStorage.getItem("books")) || [];
}

/* --- calculate fines for ALL overdue books --- */
function calculateAllFines() {
  let issuedBooks = getIssuedBooks();
  const today = new Date();

  issuedBooks.forEach(issue => {
    if (issue.status !== "active") return;

    const dueDate = new Date(issue.dueDate);
    if (dueDate >= today) return; /* not overdue */

    /* calculate current fine based on 2-minute blocks */
    const diffMinutes = Math.floor((today - dueDate) / (1000 * 60));
    const diff2MinBlocks = Math.floor(diffMinutes / 2);
    issue.fine = diff2MinBlocks * 5;
  });

  localStorage.setItem("issuedBooks", JSON.stringify(issuedBooks));
  return issuedBooks;
}

/* --- send reminders when fine increases (every 2 minutes = every ₹5) --- */
function sendOverdueReminders() {
  /* IMPORTANT: calculate fines FIRST before sending reminders */
  let issuedBooks = calculateAllFines();
  const books = getBooks();
  const today = new Date();

  /* find all active overdue books */
  issuedBooks.forEach(issue => {
    if (issue.status !== "active") return;

    const dueDate = new Date(issue.dueDate);
    if (dueDate >= today) return; /* not overdue */

    const currentFine = issue.fine || 0;
    
    const lastNotifiedFine = issue.lastNotifiedFine || 0;

    /* send NEW reminder when fine increases (e.g., ₹5, ₹10, ₹15, etc.) */
    if (currentFine > lastNotifiedFine && currentFine > 0) {
      const book = books.find(b => b.id === issue.bookId);
      const bookTitle = book ? book.title : "unknown book";

      addNotification(
        issue.userId,
        `⏰ reminder: "${bookTitle}" is overdue. current fine: ₹${currentFine}`
      );

      /* track the fine amount we just notified for */
      issue.lastNotifiedFine = currentFine;
    }
  });

  /* save the lastest notified fine amount */
  localStorage.setItem("issuedBooks", JSON.stringify(issuedBooks));
}

/* --- auto-run reminders every 5 seconds (much faster detection) --- */
sendOverdueReminders(); /* run immediately on load */
