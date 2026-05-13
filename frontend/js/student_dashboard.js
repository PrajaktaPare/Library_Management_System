/* ============================================================
   student_dashboard.js — student dashboard with proper book covers,
   equal card alignment, and 4 books per page
   ============================================================ */

// Gradient colors for fallback book covers
const COVER_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
  'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)',
  'linear-gradient(135deg, #0d7377 0%, #14919b 100%)',
  'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
];

function getGradientForBook(id) {
  return COVER_COLORS[(id || 0) % COVER_COLORS.length];
}

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "student") {
  window.location.replace("../index.html");
}

// Common book cover for all books — local SVG
const DEFAULT_COVER = '../assets/images/book-cover.svg';

function getBookCover(book) {
  if (book.book_image) return book.book_image;
  return DEFAULT_COVER;
}

let currentPage = 1;
const booksPerPage = 4; // Only 4 books per page

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

async function loadDashboardStats() {
  try {
    const res = await apiClient.getMyRequests(1, 100);
    const requests = res.data || [];
    const issuedCount = requests.filter(r => r.request_status === "issued").length;
    const pendingCount = requests.filter(r => r.request_status === "pending").length;
    const overdueCount = requests.filter(r => r.request_status === "issued" && r.due_date && new Date(r.due_date) < new Date()).length;
    const totalFines = requests.reduce((sum, r) => sum + (parseFloat(r.fine_amount) || 0), 0);
    const el1 = document.getElementById("booksIssued");
    const el2 = document.getElementById("booksOverdue");
    const el3 = document.getElementById("booksPending");
    const el4 = document.getElementById("totalFines");
    if (el1) el1.textContent = issuedCount;
    if (el2) el2.textContent = overdueCount;
    if (el3) el3.textContent = pendingCount;
    if (el4) el4.textContent = totalFines;
  } catch (error) { console.error("Failed to load stats:", error); }
}

async function loadBooks() {
  const searchText = (document.getElementById("searchInput")?.value || "").trim();
  const category = document.getElementById("categoryFilter")?.value || "";
  const filters = {};
  if (searchText) filters.search = searchText;
  if (category) filters.category = category;
  try {
    const res = await apiClient.getBooks(currentPage, booksPerPage, filters);
    const books = res.data || [];
    const total = res.meta ? res.meta.total : 0;
    renderBooks(books, total);
  } catch (error) {
    console.error("Failed to load books:", error);
    const grid = document.getElementById("booksGrid");
    if (grid) grid.innerHTML = `<p style="color:var(--text-light);text-align:center;padding:40px">Failed to load books.</p>`;
  }
}

function renderBooks(books, total) {
  const booksGrid = document.getElementById("booksGrid");
  if (!booksGrid) return;

  if (books.length === 0) {
    booksGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px">
      <div style="font-size:3rem;margin-bottom:12px">📚</div>
      <p style="color:var(--text-light);font-size:1.1rem;margin:0">No Books Found</p>
    </div>`;
    const pag = document.getElementById("pagination");
    if (pag) pag.innerHTML = "";
    return;
  }

  booksGrid.innerHTML = books.map(book => {
    const available = book.available_copies || 0;
    const coverUrl = getBookCover(book);
    const gradient = getGradientForBook(book.id);
    const initial = (book.title || 'B').charAt(0).toUpperCase();
    return `
    <div class="book-card">
      <div class="book-card-cover" id="cover-${book.id}">
        <img src="${coverUrl}" alt="${book.title}" 
             onload="this.style.display='block'"
             onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${gradient};padding:16px\'><span style=\'font-size:3rem;color:rgba(255,255,255,0.9);font-weight:800\'>${initial}</span><span style=\'color:rgba(255,255,255,0.85);font-size:0.75rem;text-align:center;margin-top:8px;font-weight:600;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\'>${book.title}</span></div>'">
      </div>
      <div class="book-card-body">
        <h3 class="book-card-title" title="${book.title}">${book.title}</h3>
        <p class="book-card-author">by ${book.author}</p>
        <p class="book-card-category">${book.category}${book.sub_category ? ' • ' + book.sub_category : ''}</p>
        <div class="book-card-availability">
          <span class="${available > 0 ? 'available' : 'unavailable'}">${available > 0 ? '✓ ' + available + ' Available' : '✕ Out of Stock'}</span>
        </div>
        ${available <= 0
          ? `<button class="btn book-card-btn" disabled>Out of Stock</button>`
          : `<button class="btn book-card-btn" onclick="requestBook(${book.id})">📩 Request Book</button>`}
      </div>
    </div>`;
  }).join("");

  renderPagination(total);
}

async function requestBook(bookId) {
  try {
    await apiClient.requestBook(bookId);
    showToast("Book requested successfully!", "success");
    loadBooks();
    loadDashboardStats();
  } catch (error) { showToast(error.message || "Failed to request book", "error"); }
}

function filterBooks() {
  currentPage = 1;
  loadBooks();
}

function clearStudentSearch() {
  const inp = document.getElementById("searchInput");
  if (inp) inp.value = "";
  currentPage = 1;
  loadBooks();
}

function clearStudentCategory() {
  const sel = document.getElementById("categoryFilter");
  if (sel) sel.value = "";
  currentPage = 1;
  loadBooks();
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

function changePage(page) { currentPage = page; loadBooks(); }

function renderPagination(totalBooks) {
  const paginationEl = document.getElementById("pagination");
  if (!paginationEl) return;
  const totalPages = Math.ceil(totalBooks / booksPerPage);
  if (totalPages <= 1) { paginationEl.innerHTML = ""; return; }

  let buttons = `<button class="btn btn-sm" ${currentPage === 1 ? "disabled style='opacity:0.5'" : ""} onclick="changePage(${currentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="btn btn-sm ${i === currentPage ? "" : "btn-secondary"}" onclick="changePage(${i})" style="${i === currentPage ? 'font-weight:700' : ''}">${i}</button>`;
  }
  buttons += `<button class="btn btn-sm" ${currentPage === totalPages ? "disabled style='opacity:0.5'" : ""} onclick="changePage(${currentPage + 1})">Next →</button>`;
  paginationEl.innerHTML = buttons;
}

document.addEventListener("DOMContentLoaded", () => { loadUserInfo(); loadDashboardStats(); loadBooks(); });