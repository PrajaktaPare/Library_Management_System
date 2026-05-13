/* ============================================================
   view_request.js — admin view/approve/reject/issue book requests
   No return button here — returns are handled on Issues page
   After issuing, request gets status 'issued' and disappears from pending view
   ============================================================ */
let vrCurrentPage = 1;
const VR_PER_PAGE = 10;

function formatDateOnly(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function renderRequests() {
  const tbody = document.getElementById("requestsTableBody");
  if (!tbody) return;
  const searchVal = (document.getElementById("vrSearch")?.value || "").trim();
  try {
    const filters = {};
    if (searchVal) filters.search = searchVal;
    const res = await apiClient.getAllRequests(vrCurrentPage, filters);
    let requests = res.data || [];
    const total = res.meta ? res.meta.total : 0;

    // Only show pending and approved requests on this page
    requests = requests.filter(r => r.request_status === "pending" || r.request_status === "approved");

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:32px;color:var(--text-light)">📋 No Pending Requests</td></tr>`;
      renderVRPagination(0);
      return;
    }
    tbody.innerHTML = requests.map(req => {
      const dateStr = formatDateOnly(req.requested_at || req.created_at);
      const badgeClass = req.request_status === "pending" ? "badge-warning" : "badge-success";
      const statusLabel = req.request_status.charAt(0).toUpperCase() + req.request_status.slice(1);
      return `<tr>
          <td style="font-weight:600">${req.student_name || req.username || "—"}</td>
          <td>${req.book_title || req.title || "—"}</td>
          <td>${dateStr}</td>
          <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
          <td>${req.request_status === "pending"
              ? `<button class="btn btn-sm" onclick="approveReq(${req.id})">✓ Approve</button>
                 <button class="btn btn-sm btn-secondary" onclick="rejectReq(${req.id})">✕ Reject</button>`
              : req.request_status === "approved"
              ? `<button class="btn btn-sm" onclick="issueReq(${req.id})">📤 Issue</button>`
              : "—"}</td></tr>`;
    }).join("");
    renderVRPagination(requests.length < total ? total : requests.length);
  } catch (error) {
    console.error("Failed to load requests:", error);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">Failed to load requests</td></tr>`;
  }
}

function renderVRPagination(total) {
  const el = document.getElementById("vrPagination");
  if (!el) return;
  const totalPages = Math.ceil(total / VR_PER_PAGE);
  if (totalPages <= 1) { el.innerHTML = ""; return; }
  let btns = `<button class="btn btn-sm" ${vrCurrentPage === 1 ? "disabled style='opacity:0.5'" : ""} onclick="vrChangePage(${vrCurrentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button class="btn btn-sm ${i === vrCurrentPage ? "" : "btn-secondary"}" onclick="vrChangePage(${i})" style="${i === vrCurrentPage ? 'font-weight:700' : ''}">${i}</button>`;
  }
  btns += `<button class="btn btn-sm" ${vrCurrentPage === totalPages ? "disabled style='opacity:0.5'" : ""} onclick="vrChangePage(${vrCurrentPage + 1})">Next →</button>`;
  el.innerHTML = btns;
}

function vrChangePage(page) { vrCurrentPage = page; renderRequests(); }

async function approveReq(requestId) {
  try {
    // Due date auto-set to 7 days on backend
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await apiClient.approveRequest(requestId, dueDate);
    showToast("Request approved — due in 7 days", "success");
    renderRequests();
  } catch (error) { showToast(error.message || "Failed to approve", "error"); }
}

async function rejectReq(requestId) {
  try {
    await apiClient.rejectRequest(requestId);
    showToast("Request rejected", "info");
    renderRequests();
  } catch (error) { showToast(error.message || "Failed to reject", "error"); }
}

async function issueReq(requestId) {
  try {
    await apiClient.issueBook(requestId);
    showToast("Book issued successfully — student notified via email", "success");
    renderRequests();
  } catch (error) { showToast(error.message || "Failed to issue book", "error"); }
}

function onVRSearch() {
  vrCurrentPage = 1;
  const val = document.getElementById("vrSearch")?.value || "";
  const btn = document.getElementById("vrSearchClear");
  if (btn) btn.style.display = val ? "inline-flex" : "none";
  renderRequests();
}

function clearVRSearch() {
  const inp = document.getElementById("vrSearch");
  if (inp) inp.value = "";
  const btn = document.getElementById("vrSearchClear");
  if (btn) btn.style.display = "none";
  vrCurrentPage = 1;
  renderRequests();
}

document.addEventListener("DOMContentLoaded", () => { renderRequests(); });