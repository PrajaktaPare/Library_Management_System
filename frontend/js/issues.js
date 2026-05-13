/* ============================================================
   issues.js — admin issued books management with tabs
   Tab 1: Active Issues (issued books only) with Return button
   Tab 2: Returned Books (returned only) — no actions
   ============================================================ */
let issuesCurrentPage = 1;
const ISSUES_PER_PAGE = 10;
let currentIssuesTab = 'active'; // 'active' or 'returned'

function formatDateOnly(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Switch between Active Issues and Returned Books tabs
function switchIssuesTab(tab) {
  currentIssuesTab = tab;
  issuesCurrentPage = 1;

  // Update tab styles
  const tabActive = document.getElementById("tabActive");
  const tabReturned = document.getElementById("tabReturned");

  if (tab === 'active') {
    tabActive.style.color = 'var(--primary)';
    tabActive.style.borderBottom = '2px solid var(--primary)';
    tabReturned.style.color = 'var(--text-light)';
    tabReturned.style.borderBottom = '2px solid transparent';
  } else {
    tabReturned.style.color = 'var(--primary)';
    tabReturned.style.borderBottom = '2px solid var(--primary)';
    tabActive.style.color = 'var(--text-light)';
    tabActive.style.borderBottom = '2px solid transparent';
  }

  // Update table header for returned tab (show Return Date instead of Actions)
  const thead = document.querySelector("#issuesTable thead tr");
  if (thead) {
    if (tab === 'returned') {
      thead.innerHTML = `
        <th>Book Title</th>
        <th>Student</th>
        <th>Issue Date</th>
        <th>Due Date</th>
        <th>Return Date</th>
        <th>Fine (₹)</th>
        <th>Status</th>`;
    } else {
      thead.innerHTML = `
        <th>Book Title</th>
        <th>Student</th>
        <th>Issue Date</th>
        <th>Due Date</th>
        <th>Status</th>
        <th>Fine (₹)</th>
        <th>Actions</th>`;
    }
  }

  renderIssues();
}

async function renderIssues() {
  const tbody = document.getElementById("issuesTableBody");
  if (!tbody) return;

  try {
    const filters = {};
    if (currentIssuesTab === 'active') {
      filters.status = 'issued';
    } else {
      filters.status = 'returned';
    }

    const searchVal = (document.getElementById("issuesSearch")?.value || "").trim();
    if (searchVal) filters.search = searchVal;

    const res = await apiClient.getAllRequests(issuesCurrentPage, filters);
    const allData = res.data || [];

    // Filter by tab
    const issues = allData.filter(r => {
      if (currentIssuesTab === 'active') return r.request_status === 'issued';
      return r.request_status === 'returned';
    });

    if (issues.length === 0) {
      const emptyMsg = currentIssuesTab === 'active' ? '📤 No Active Issues' : '↩ No Returned Books';
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--text-light)">${emptyMsg}</td></tr>`;
      renderIssuesPagination(0);
      return;
    }

    const today = new Date();

    tbody.innerHTML = issues.map(issue => {
      const dueDateObj = issue.due_date ? new Date(issue.due_date) : null;
      const issueDateStr = formatDateOnly(issue.issue_date || issue.issued_at);
      const dueDateStr = formatDateOnly(issue.due_date);
      const isOverdue = issue.request_status === "issued" && dueDateObj && dueDateObj < today;
      const isActive = issue.request_status === "issued";
      const fineAmt = parseFloat(issue.fine_amount) || 0;

      if (currentIssuesTab === 'returned') {
        // Returned tab — show return date, no actions
        const returnDateStr = formatDateOnly(issue.return_date || issue.returned_at);
        return `<tr>
          <td style="font-weight:600">${issue.book_title || issue.title || "—"}</td>
          <td>${issue.student_name || issue.username || "—"}</td>
          <td>${issueDateStr}</td>
          <td>${dueDateStr}</td>
          <td>${returnDateStr}</td>
          <td style="color:${fineAmt > 0 ? '#dc2626' : 'inherit'};font-weight:${fineAmt > 0 ? '700' : '400'}">₹${fineAmt.toFixed(0)}</td>
          <td><span class="badge badge-success">Returned</span></td>
        </tr>`;
      }

      // Active tab — show status dot + Return button
      const flagIcon = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isOverdue ? '#dc2626' : '#16a34a'};margin-right:6px;animation:pulse 2s infinite"></span>`;
      const badgeClass = isOverdue ? "badge-danger" : "badge-warning";
      const statusLabel = isOverdue ? "Overdue" : "Issued";

      return `<tr style="background:rgba(22,163,74,0.03)">
        <td style="font-weight:600">${issue.book_title || issue.title || "—"}</td>
        <td>${issue.student_name || issue.username || "—"}</td>
        <td>${issueDateStr}</td>
        <td>${dueDateStr}</td>
        <td>${flagIcon}<span class="badge ${badgeClass}">${statusLabel}</span></td>
        <td style="color:${fineAmt > 0 ? '#dc2626' : 'inherit'};font-weight:${fineAmt > 0 ? '700' : '400'}">₹${fineAmt.toFixed(0)}</td>
        <td><button class="btn btn-sm" onclick="returnIssue(${issue.id})">↩ Return</button></td>
      </tr>`;
    }).join("");

    renderIssuesPagination(res.meta ? res.meta.total : issues.length);
  } catch (error) {
    console.error("Failed to load issues:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Failed to load issues</td></tr>`;
  }
}

function renderIssuesPagination(total) {
  const el = document.getElementById("issuesPagination");
  if (!el) return;
  const totalPages = Math.ceil(total / ISSUES_PER_PAGE);
  if (totalPages <= 1) { el.innerHTML = ""; return; }
  let btns = `<button class="btn btn-sm" ${issuesCurrentPage === 1 ? "disabled style='opacity:0.5'" : ""} onclick="issuesChangePage(${issuesCurrentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button class="btn btn-sm ${i === issuesCurrentPage ? "" : "btn-secondary"}" onclick="issuesChangePage(${i})" style="${i === issuesCurrentPage ? 'font-weight:700' : ''}">${i}</button>`;
  }
  btns += `<button class="btn btn-sm" ${issuesCurrentPage === totalPages ? "disabled style='opacity:0.5'" : ""} onclick="issuesChangePage(${issuesCurrentPage + 1})">Next →</button>`;
  el.innerHTML = btns;
}

function issuesChangePage(page) { issuesCurrentPage = page; renderIssues(); }

function onIssuesSearch() {
  issuesCurrentPage = 1;
  const val = document.getElementById("issuesSearch")?.value || "";
  const btn = document.getElementById("issuesSearchClear");
  if (btn) btn.style.display = val ? "inline-flex" : "none";
  renderIssues();
}

function clearIssuesSearch() {
  const inp = document.getElementById("issuesSearch");
  if (inp) inp.value = "";
  const btn = document.getElementById("issuesSearchClear");
  if (btn) btn.style.display = "none";
  issuesCurrentPage = 1;
  renderIssues();
}

async function returnIssue(requestId) {
  try {
    await apiClient.returnBook(requestId);
    showToast("Book returned successfully", "success");
    renderIssues();
  } catch (error) { showToast(error.message || "Failed to return book", "error"); }
}

document.addEventListener("DOMContentLoaded", () => { renderIssues(); });