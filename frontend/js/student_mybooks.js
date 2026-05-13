/* ============================================================
   student_mybooks.js — student's issued books with pagination,
   proper data display, and days left calculation
   ============================================================ */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

const MY_BOOKS_PER_PAGE = 4;
let myBooksCurrentPage = 1;
let myBooksCurrentFilter = "issued";

function loadUserInfo() {
  if (!currentUser) return;
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("userAvatar");
  if (nameEl) nameEl.textContent = currentUser.name || currentUser.username;
  if (avatarEl) {
    if (currentUser.profile_image) {
      avatarEl.innerHTML = `<img src="${currentUser.profile_image}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    } else {
      avatarEl.textContent = (currentUser.name || currentUser.username).charAt(0).toUpperCase();
    }
  }
}

function formatDateOnly(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function calculateDaysLeft(dueDate) {
  if (!dueDate) return { text: "—", isOverdue: false };
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = due - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
  if (diffDays === 0) return { text: "Due today", isOverdue: false };
  if (diffDays === 1) return { text: "1 day left", isOverdue: false };
  return { text: `${diffDays} days left`, isOverdue: false };
}

async function renderMyBooks(filterStatus = "issued") {
  myBooksCurrentFilter = filterStatus;
  const tbody = document.getElementById("myBooksTableBody");
  if (!tbody) return;
  try {
    const res = await apiClient.getMyRequests(1, 100);
    const allRequests = res.data || [];
    const myBooks = allRequests.filter(r => r.request_status === filterStatus);

    if (myBooks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--text-light)">📚 No ${filterStatus === "issued" ? "active" : "returned"} books found</td></tr>`;
      renderMyBooksPagination(0);
      return;
    }

    // Paginate
    const totalItems = myBooks.length;
    const startIdx = (myBooksCurrentPage - 1) * MY_BOOKS_PER_PAGE;
    const paged = myBooks.slice(startIdx, startIdx + MY_BOOKS_PER_PAGE);

    tbody.innerHTML = paged.map(issue => {
      const daysInfo = filterStatus === "issued" ? calculateDaysLeft(issue.due_date) : { text: "", isOverdue: false };
      const isOverdue = daysInfo.isOverdue;

      let statusBadge;
      if (filterStatus === "returned") {
        statusBadge = `<span class="badge badge-success">Returned</span>`;
      } else if (isOverdue) {
        statusBadge = `<span class="badge badge-danger">Overdue</span>`;
      } else {
        statusBadge = `<span class="badge badge-warning">Active</span>`;
      }

      let daysLeftDisplay;
      if (filterStatus === "returned") {
        daysLeftDisplay = `Returned on ${formatDateOnly(issue.return_date || issue.returned_at)}`;
      } else {
        daysLeftDisplay = `<span style="color:${isOverdue ? '#dc2626' : '#16a34a'};font-weight:600">${daysInfo.text}</span>`;
      }

      return `<tr>
        <td style="font-weight:600">${issue.book_title || issue.title || "—"}</td>
        <td>${issue.book_author || issue.author || "—"}</td>
        <td>${formatDateOnly(issue.issue_date || issue.issued_at)}</td>
        <td>${formatDateOnly(issue.due_date)}</td>
        <td>${daysLeftDisplay}</td>
        <td>₹${parseFloat(issue.fine_amount || 0).toFixed(0)}</td>
        <td>${statusBadge}</td>
      </tr>`;
    }).join("");

    renderMyBooksPagination(totalItems);
  } catch (error) {
    console.error("Failed to load my books:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Failed to load books</td></tr>`;
  }
}

function renderMyBooksPagination(total) {
  let pag = document.getElementById("myBooksPagination");
  if (!pag) {
    // Create pagination element if it doesn't exist
    const table = document.getElementById("myBooksTable");
    if (table) {
      pag = document.createElement("div");
      pag.id = "myBooksPagination";
      pag.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin-top:16px;justify-content:center";
      table.parentNode.insertBefore(pag, table.nextSibling);
    }
  }
  if (!pag) return;

  const totalPages = Math.ceil(total / MY_BOOKS_PER_PAGE);
  if (totalPages <= 1) { pag.innerHTML = ""; return; }

  let btns = `<button class="btn btn-sm" ${myBooksCurrentPage === 1 ? "disabled style='opacity:0.5'" : ""} onclick="myBooksChangePage(${myBooksCurrentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button class="btn btn-sm ${i === myBooksCurrentPage ? "" : "btn-secondary"}" onclick="myBooksChangePage(${i})" style="${i === myBooksCurrentPage ? 'font-weight:700' : ''}">${i}</button>`;
  }
  btns += `<button class="btn btn-sm" ${myBooksCurrentPage === totalPages ? "disabled style='opacity:0.5'" : ""} onclick="myBooksChangePage(${myBooksCurrentPage + 1})">Next →</button>`;
  pag.innerHTML = btns;
}

function myBooksChangePage(page) {
  myBooksCurrentPage = page;
  renderMyBooks(myBooksCurrentFilter);
}

function filterByStatus(status) {
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
  const filterVal = status === "active" ? "issued" : status;
  const clickedTab = Array.from(document.querySelectorAll(".tab-button"))
    .find(btn => btn.getAttribute("onclick")?.includes(status));
  if (clickedTab) clickedTab.classList.add("active");
  myBooksCurrentPage = 1;
  renderMyBooks(filterVal);
}

function logout() {
  showToast("Logged out successfully", "success");
  setTimeout(async () => {
    try { await apiClient.logout(); } catch (e) {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    window.location.replace("../index.html");
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => { loadUserInfo(); renderMyBooks("issued"); });
