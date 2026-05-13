/* ============================================================
   request_book_student.js — student book request page (API)
   with proper data display and request status
   ============================================================ */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

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
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function populateBookSelect() {
  const bookSelect = document.getElementById("bookSelect");
  if (!bookSelect) return;
  try {
    const res = await apiClient.getBooks(1, 100, { status: "available" });
    const books = (res.data || []).filter(b => b.available_copies > 0);
    bookSelect.innerHTML = `<option value="">Choose a book...</option>` +
      books.map(b => `<option value="${b.id}">${b.title} — ${b.author} (${b.available_copies} available)</option>`).join("");
  } catch (error) { console.error("Failed to load books:", error); }
}

async function updateBookInfo() {
  const bookId = document.getElementById("bookSelect").value;
  const infoDiv = document.getElementById("bookInfo");
  if (!bookId) { infoDiv.style.display = "none"; return; }
  try {
    const res = await apiClient.getBookById(bookId);
    const book = res.data;
    document.getElementById("infoTitle").textContent = book.title;
    document.getElementById("infoAuthor").textContent = book.author;
    document.getElementById("infoCategory").textContent = book.category;
    document.getElementById("infoAvailable").textContent = book.available_copies;
    infoDiv.style.display = "block";
  } catch (error) { console.error("Failed to load book info:", error); }
}

async function submitRequest(e) {
  e.preventDefault();
  const bookId = document.getElementById("bookSelect").value;
  if (!bookId) { showToast("Please select a book", "error"); return; }
  try {
    await apiClient.requestBook(parseInt(bookId));
    showToast("Book request submitted successfully!", "success");
    document.getElementById("requestForm").reset();
    document.getElementById("bookInfo").style.display = "none";
    populateBookSelect();
    renderMyRequests();
  } catch (error) { showToast(error.message || "Failed to submit request", "error"); }
}

async function renderMyRequests() {
  const container = document.getElementById("requestsContainer");
  if (!container) return;
  try {
    const res = await apiClient.getMyRequests(1, 100);
    const requests = (res.data || []).filter(r => r.request_status === "pending" || r.request_status === "approved");
    if (requests.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No Pending Requests</div><p>Request books to expand your reading list</p></div>`;
      return;
    }
    container.innerHTML = requests.map(req => {
      const badgeClass = req.request_status === "pending" ? "badge-warning" : "badge-success";
      const statusLabel = req.request_status.charAt(0).toUpperCase() + req.request_status.slice(1);
      return `<div class="card" style="margin-bottom:var(--spacing-md)"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <p style="font-weight:600;color:var(--text);margin:0">${req.book_title || req.title || "—"}</p>
          <p style="font-size:var(--font-size-sm);color:var(--text-light);margin:4px 0 0">Requested on ${formatDateOnly(req.requested_at || req.created_at)}</p>
          ${req.due_date ? `<p style="font-size:var(--font-size-sm);color:var(--primary);margin:4px 0 0;font-weight:600">Due: ${formatDateOnly(req.due_date)}</p>` : ''}
        </div>
        <span class="badge ${badgeClass}">${statusLabel}</span>
      </div></div></div>`;
    }).join("");
  } catch (error) { console.error("Failed to load requests:", error); }
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

document.addEventListener("DOMContentLoaded", () => { loadUserInfo(); populateBookSelect(); renderMyRequests(); });
