/* ============================================================
   admin_dashboard.js — admin dashboard with API-connected stats,
   recent issues table, and logout functionality
   ============================================================ */

// logout: clear session and redirect to login
function logout() {
  // show farewell toast
  showToast("logged out successfully", "success");
  setTimeout(async () => {
    try {
      // call backend logout endpoint
      await apiClient.logout();
    } catch (e) { /* ignore logout errors */ }
    // clear local session data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    // redirect to login page
    window.location.replace("../index.html");
  }, 1000);
}

// populate the admin header with current user info
function loadAdminInfo() {
  // read user from localStorage (set during login)
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;
  // set name text
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("userAvatar");
  if (nameEl) nameEl.textContent = currentUser.name || currentUser.username;
  // set avatar initial letter
  if (avatarEl) avatarEl.textContent = (currentUser.name || currentUser.username).charAt(0).toUpperCase();
}

// fetch and render dashboard statistics from API
async function handleStatisticsOnDashboard() {
  try {
    // fetch books count from API
    const booksRes = await apiClient.getBooks(1, 1);
    const totalBooks = booksRes.meta ? booksRes.meta.total : 0;

    // fetch users count (students only) from API
    const usersRes = await apiClient.getAllUsers(1, { role: "student" });
    const totalMembers = usersRes.meta ? usersRes.meta.total : 0;

    // fetch issued requests count from API
    const issuedRes = await apiClient.getAllRequests(1, { status: "issued" });
    const issuedCount = issuedRes.meta ? issuedRes.meta.total : 0;

    // update DOM elements with fetched data
    const totalMembersEl = document.getElementById("totalMembers");
    const totalBooksEl = document.getElementById("totalBooks");
    const issuedBooksEl = document.getElementById("issuedBooks");
    const totalFinesEl = document.getElementById("totalFines");

    if (totalMembersEl) totalMembersEl.textContent = totalMembers;
    if (totalBooksEl) totalBooksEl.textContent = totalBooks;
    if (issuedBooksEl) issuedBooksEl.textContent = issuedCount;
    // fines are calculated server-side, display 0 for now
    if (totalFinesEl) totalFinesEl.textContent = "0";
  } catch (error) {
    // log error but don't crash the page
    console.error("Failed to load dashboard stats:", error);
  }
}

// render recent issued books in the dashboard table
async function renderRecentIssues() {
  const container = document.getElementById("recentIssuesContainer");
  if (!container) return;

  try {
    // fetch requests with 'issued' status from API
    const res = await apiClient.getAllRequests(1, { status: "issued" });
    const requests = res.data || [];

    // show empty state if no issued books
    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">no issues yet</div>
          <p>book issues will appear here</p>
        </div>`;
      return;
    }

    // build the recent issues table from API data
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>book title</th>
            <th>student</th>
            <th>issue date</th>
            <th>due date</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          ${requests.slice(0, 10).map(req => {
            const today = new Date();
            const due = req.due_date ? new Date(req.due_date) : null;
            const isOverdue = due && due < today;
            return `
              <tr>
                <td>${req.book_title || req.title || "—"}</td>
                <td>${req.student_name || req.username || "—"}</td>
                <td>${req.issue_date ? new Date(req.issue_date).toLocaleDateString() : "—"}</td>
                <td>${due ? due.toLocaleDateString() : "—"}</td>
                <td>
                  <span class="badge ${isOverdue ? "badge-danger" : "badge-success"}">
                    ${isOverdue ? "overdue" : "active"}
                  </span>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  } catch (error) {
    // show error state if API call fails
    console.error("Failed to load recent issues:", error);
    container.innerHTML = `<p style="color:var(--text-light)">Failed to load recent issues</p>`;
  }
}

// initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadAdminInfo();
  handleStatisticsOnDashboard();
  renderRecentIssues();
});
