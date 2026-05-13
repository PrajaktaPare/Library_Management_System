/* ============================================================
   manage_users.js — admin user management with API connection
   handles: list, search, pagination, add user modal
   ============================================================ */

let usersCurrentPage = 1;
const USERS_PER_PAGE = 10;

function renderUsersTable(users, total) {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  const filteredUsers = users.filter(user => user.role !== "admin");

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:32px;color:var(--text-light)">👥 No Users Found</td></tr>`;
    renderUsersPagination(0);
    return;
  }

  tbody.innerHTML = filteredUsers.map(user => `
    <tr>
      <td style="font-weight:600">${user.name || user.username}</td>
      <td>${user.username}</td>
      <td><span class="badge ${user.role === "admin" ? "badge-info" : "badge-success"}">${user.role}</span></td>
      <td>${user.email || "—"}</td>
      <td>${user.phone || "—"}</td>
      <td><span class="badge ${user.is_active !== false ? "badge-success" : "badge-danger"}">${user.is_active !== false ? "Active" : "Inactive"}</span></td>
    </tr>`).join("");

  renderUsersPagination(total);
}

function renderUsersPagination(total) {
  const el = document.getElementById("usersPagination");
  if (!el) return;
  const totalPages = Math.ceil(total / USERS_PER_PAGE);
  if (totalPages <= 1) { el.innerHTML = ""; return; }

  let btns = `<button class="btn btn-sm" ${usersCurrentPage === 1 ? "disabled style='opacity:0.5'" : ""} onclick="usersChangePage(${usersCurrentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button class="btn btn-sm ${i === usersCurrentPage ? "" : "btn-secondary"}" onclick="usersChangePage(${i})" style="${i === usersCurrentPage ? 'font-weight:700' : ''}">${i}</button>`;
  }
  btns += `<button class="btn btn-sm" ${usersCurrentPage === totalPages ? "disabled style='opacity:0.5'" : ""} onclick="usersChangePage(${usersCurrentPage + 1})">Next →</button>`;
  el.innerHTML = btns;
}

function usersChangePage(page) {
  usersCurrentPage = page;
  loadUsers();
}

async function loadUsers() {
  const searchText = (document.getElementById("searchInput")?.value || "").trim();
  const filters = {};
  if (searchText) filters.search = searchText;

  try {
    const res = await apiClient.getAllUsers(usersCurrentPage, filters);
    renderUsersTable(res.data || [], res.meta ? res.meta.total : 0);
  } catch (error) {
    console.error("Failed to load users:", error);
    const tbody = document.getElementById("usersTableBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center">Failed to load users</td></tr>`;
  }
}

function filterUsers() {
  usersCurrentPage = 1;
  const val = document.getElementById("searchInput")?.value || "";
  const btn = document.getElementById("searchClear");
  if (btn) btn.style.display = val ? "inline-flex" : "none";
  loadUsers();
}

function clearUsersSearch() {
  const inp = document.getElementById("searchInput");
  if (inp) inp.value = "";
  const btn = document.getElementById("searchClear");
  if (btn) btn.style.display = "none";
  usersCurrentPage = 1;
  loadUsers();
}

// --- Add User Modal ---
function openAddUserModal() {
  document.getElementById("userForm").reset();
  document.getElementById("modalTitle").textContent = "Add User";
  document.getElementById("userModal").style.display = "flex";
}

function closeUserModal() {
  document.getElementById("userModal").style.display = "none";
  document.getElementById("userForm").reset();
}

async function saveUser(e) {
  e.preventDefault();

  const name = document.getElementById("userNameInput").value.trim();
  const username = document.getElementById("userEmail").value.trim();
  const role = document.getElementById("userRole").value;
  const phone = document.getElementById("userPhone").value.trim();
  const password = document.getElementById("userpass").value.trim();
  const email = document.getElementById("userEmailAddr")?.value.trim() || "";

  if (!name || !username) {
    showToast("Name and Username are required", "error");
    return;
  }

  if (!password || password.length < 8) {
    showToast("Password must be at least 8 characters", "error");
    return;
  }

  try {
    await apiClient.createUser({ name, username, email, phone, password, role });
    showToast("User created successfully!", "success");
    closeUserModal();
    loadUsers();
  } catch (error) {
    showToast(error.message || "Failed to create user", "error");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
});
