// js/admin.js

// 기존 함수들 유지...
// 아래 추가

async function loadApprovedUsers() {
  const container = document.getElementById("approved-users");
  if (!container) return;
  container.innerHTML = "";

  const db = firebase.firestore();
  const snapshot = await db
    .collection("users")
    .where("status", "==", "approved")
    .get();

  snapshot.forEach((doc) => {
    const user = doc.data();
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      ✅ <strong>${user.nickname}</strong> (${user.id}, ${user.role})
      <br/>
      <button class="reject" onclick="deleteUser('${doc.id}')">❌ 삭제</button>
    `;
    container.appendChild(div);
  });
}

async function deleteUser(uid) {
  if (!confirm("정말로 이 계정을 삭제하시겠습니까?")) return;
  const db = firebase.firestore();
  await db.collection("users").doc(uid).delete();
  alert("계정 삭제 완료");
  loadApprovedUsers();
}

export function initAdminPage() {
  const userId = sessionStorage.getItem("currentUser");
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  if (!isAdmin) {
    const loginPanel = document.getElementById("admin-login-panel");
    if (loginPanel) loginPanel.style.display = "block";

    const button = loginPanel.querySelector("button");
    if (button) {
      button.onclick = confirmAdmin;
    }

    return;
  }

  if (!userId) {
    sessionStorage.setItem("currentUser", "admin_temp");
  }

  loadSignupList();
  loadScheduleList();
  loadApprovedUsers(); // ✅ 추가됨

  window.approveUser = approveUser;
  window.rejectUser = rejectUser;
  window.approveSchedule = approveSchedule;
  window.rejectSchedule = rejectSchedule;
  window.deleteUser = deleteUser; // ✅ 추가됨
}
