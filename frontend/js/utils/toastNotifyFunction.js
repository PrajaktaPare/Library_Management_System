/* ============================================================
   toastNotifyFunction.js  —  shared toast notification helper
   used on every page to show success / error messages
   ============================================================ */

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  /* set message text */
  toast.textContent = message;

  /* set background color based on type */
  toast.style.background = type === "success" ? "#27ae60" : type === "info" ? "#3498db" : "#e74c3c";
  toast.style.color       = "white";
  
  /* show toast with animation */
  toast.style.display = "flex";
  toast.style.opacity = "1";
  toast.style.transform = "translateX(0)";

  /* auto-hide after 2.5 seconds */
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(400px)";
    setTimeout(() => {
      toast.style.display = "none";
    }, 300);
  }, 2500);
}
