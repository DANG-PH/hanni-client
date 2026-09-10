/* Chỉ tải lại khi người dùng yêu cầu, giữ nguyên địa chỉ trang đang mở. */
document
  .getElementById("retry")
  .addEventListener("click", () => window.location.reload());
window.addEventListener("online", () => {
  document.getElementById("connection-status").textContent =
    "Thiết bị đã kết nối mạng. Nhấn thử lại để tiếp tục.";
});
window.addEventListener("offline", () => {
  document.getElementById("connection-status").textContent =
    "Kết nối vừa bị gián đoạn. Hãy kiểm tra Wi-Fi hoặc dữ liệu di động.";
});
