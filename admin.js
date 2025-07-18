async function loadSignupList() {
  const container = document.getElementById("signup-list");
  container.innerHTML = "";

  const db = firebase.firestore();
  const querySnapshot = await db
    .collection("users")
    .where("status", "==", "pending")
    .get();

  querySnapshot.forEach((doc) => {
    const user = doc.data();
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <strong>${user.nickname}</strong> (${user.id}, ${user.role})
      <br/>
      <button class="approve" onclick="approveUser('${doc.id}')">✅ 승인</button>
      <button class="reject" onclick="rejectUser('${doc.id}')">❌ 거절</button>
    `;
    container.appendChild(div);
  });
}

async function loadScheduleList() {
  const container = document.getElementById("schedule-list");
  container.innerHTML = "";

  const db = firebase.firestore();
  const querySnapshot = await db
    .collection("schedules")
    .where("status", "==", "pending")
    .orderBy("date")
    .get();

  querySnapshot.forEach((doc) => {
    const item = doc.data();
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <strong>${item.nickname}</strong> - ${item.date} ${item.start} ~ ${item.end}
      <br/>
      <button class="approve" onclick="approveSchedule('${doc.id}')">✅ 승인</button>
      <button class="reject" onclick="rejectSchedule('${doc.id}')">❌ 거절</button>
    `;
    container.appendChild(div);
  });
}

async function loadApprovedUsers() {
  const container = document.getElementById("approved-users");
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

async function approveUser(uid) {
  const db = firebase.firestore();
  await db.collection("users").doc(uid).update({ status: "approved" });
  alert("회원 승인 완료");
  loadSignupList();
  loadApprovedUsers(); // 리스트도 갱신
}

async function rejectUser(uid) {
  if (!confirm("정말로 거절하시겠습니까?")) return;
  const db = firebase.firestore();
  await db.collection("users").doc(uid).delete();
  alert("회원 삭제 완료");
  loadSignupList();
}

async function approveSchedule(docId) {
  const db = firebase.firestore();
  await db.collection("schedules").doc(docId).update({ status: "approved" });
  alert("일정 승인 완료");
  loadScheduleList();
}

async function rejectSchedule(docId) {
  if (!confirm("이 일정을 거절하시겠습니까?")) return;
  const db = firebase.firestore();
  await db.collection("schedules").doc(docId).delete();
  alert("일정 거절 및 삭제 완료");
  loadScheduleList();
}

async function deleteUser(uid) {
  if (!confirm("정말로 이 계정을 삭제하시겠습니까?")) return;
  const db = firebase.firestore();
  await db.collection("users").doc(uid).delete();
  alert("계정 삭제 완료");
  loadApprovedUsers();
}

function confirmAdmin() {
  const code = document.getElementById("admin-code").value;
  if (code === "0109") {
    sessionStorage.setItem("isAdmin", "true");
    if (!sessionStorage.getItem("currentUser")) {
      sessionStorage.setItem("currentUser", "admin_temp");
    }
    alert("관리자 모드로 전환되었습니다.");
    location.reload();
  } else {
    alert("잘못된 관리자 코드입니다.");
  }
}

export function initAdminPage() {
  const userId = sessionStorage.getItem("currentUser");
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  if (!isAdmin) {
    const loginPanel = document.getElementById("admin-login-panel");
    if (loginPanel) loginPanel.style.display = "block";

    // 버튼 강제 연결 (예비용)
    window.addEventListener("DOMContentLoaded", () => {
      const button = loginPanel.querySelector("button");
      if (button) {
        button.addEventListener("click", confirmAdmin);
      }
    });

    return;
  }

  if (!userId) {
    sessionStorage.setItem("currentUser", "admin_temp");
  }

  loadSignupList();
  loadScheduleList();
  loadApprovedUsers();

  window.approveUser = approveUser;
  window.rejectUser = rejectUser;
  window.approveSchedule = approveSchedule;
  window.rejectSchedule = rejectSchedule;
  window.deleteUser = deleteUser;
  window.confirmAdmin = confirmAdmin; // 혹시 HTML에서도 호출할 수 있도록 등록
}
