/* ============================================================
   adminnotifications.js — notification system (API connected)
   ============================================================ */

// render notifications from API for the logged-in user
async function renderNotifications() {
  const container = document.getElementById("notificationsContainer");
  if (!container) return;
  try {
    const res = await apiClient.getNotifications(1);
    const notifications = res.data || [];
    if (notifications.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-title">no notifications</div><p>you'll see important updates here</p></div>`;
      return;
    }
    container.innerHTML = notifications.map(n => `
      <div class="card" style="margin-bottom:var(--spacing-md);${n.is_read ? 'opacity:0.7' : ''}">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="margin:0;font-weight:${n.is_read ? '400' : '600'};color:var(--text)">${n.message}</p>
            <p style="margin:4px 0 0;font-size:var(--font-size-sm);color:var(--text-light)">${new Date(n.created_at).toLocaleString()}</p>
          </div>
          ${!n.is_read ? `<span style="background:var(--primary);color:#fff;border-radius:50%;width:10px;height:10px;display:inline-block;flex-shrink:0;margin-top:4px;"></span>` : ""}
        </div>
      </div>`).join("");
    // auto-mark as read after 3 seconds
    setTimeout(async () => {
      try { await apiClient.markAllNotificationsAsRead(); } catch (e) {}
    }, 3000);
  } catch (error) {
    console.error("Failed to load notifications:", error);
    if (container) container.innerHTML = `<p style="color:var(--text-light)">Failed to load notifications</p>`;
  }
}

// clear all notifications via API
async function clearAllNotifications() {
  try {
    await apiClient.markAllNotificationsAsRead();
    showToast("all notifications marked as read", "success");
    renderNotifications();
  } catch (error) { showToast("Failed to clear notifications", "error"); }
}

document.addEventListener("DOMContentLoaded", () => { renderNotifications(); });
