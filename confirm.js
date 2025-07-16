let currentUser = null;
let isAdmin = false;

// 로그인 상태 확인 및 초기 렌더링
firebase.auth().onAuthStateChanged(async (firebaseUser) => {
  if (!firebaseUser) {
    alert("로그인이 필요합니다.");
    location.href = "hastati.html";
    return;
  }

  const db = firebase.firestore();
  const userDoc = await db.collection("users").doc(firebaseUser.uid).get();
  const userData = userDoc.data();

  if (!userData || userData.status !== "approved") {
    alert("승인되지 않은 계정입니다.");
    location.href = "hastati.html";
    return;
  }

  currentUser = {
    uid: firebaseUser.uid,
    nickname: userData.nickname,
    role: userData.role,
  };
  isAdmin = userData.role === "헤나";

  renderSchedule();
  showMyPendingSchedules();
});

// 주간 날짜 계산
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(startDate) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// 내 대기 일정 불러오기
export async function showMyPendingSchedules() {
  const box = document.getElementById("my-pending-box");
  box.innerHTML = "";

  const db = firebase.firestore();
  const snapshot = await db
    .collection("schedules")
    .where("userId", "==", currentUser.uid)
    .where("status", "==", "pending")
    .orderBy("date")
    .get();

  if (snapshot.empty) {
    box.innerHTML = "<p>현재 내가 신청한 일정이 없습니다.</p>";
    return;
  }

  snapshot.forEach((doc) => {
    const s = doc.data();
    const div = document.createElement("div");
    div.className = "pending-entry";
    div.innerHTML = `🕓 <strong>${s.date}</strong> ${s.start} ~ ${s.end}
      <button onclick="deleteSchedule('${doc.id}')">삭제</button>`;
    box.appendChild(div);
  });
}

// 확정 스케줄표 렌더링
export async function renderSchedule() {
  const monday = getMonday(new Date());
  const weekDates = getWeekDates(monday);
  const scheduleMap = {};
  const scheduleKeys = {};

  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, "0") + ":00";
    scheduleMap[hour] = {};
    scheduleKeys[hour] = {};
    weekDates.forEach((date) => {
      scheduleMap[hour][date] = "";
      scheduleKeys[hour][date] = [];
    });
  }

  const db = firebase.firestore();
  const snapshot = await db
    .collection("schedules")
    .where("status", "==", "approved")
    .get();

  snapshot.forEach((doc) => {
    const s = doc.data();
    const scheduleDate = new Date(s.date).toISOString().split("T")[0];
    if (!weekDates.includes(scheduleDate)) return;

    const startHour = parseInt(s.start.split(":")[0]);
    const endHour = parseInt(s.end.split(":")[0]);

    for (let h = startHour; h < endHour; h++) {
      const hourKey = h.toString().padStart(2, "0") + ":00";
      if (scheduleMap[hourKey][scheduleDate]) {
        scheduleMap[hourKey][scheduleDate] += ` / ${s.nickname}`;
      } else {
        scheduleMap[hourKey][scheduleDate] = s.nickname;
      }
      scheduleKeys[hourKey][scheduleDate].push({
        key: doc.id,
        owner: s.userId,
      });
    }
  });

  const tbody = document.getElementById("schedule-body");
  tbody.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, "0") + ":00";
    const row = document.createElement("tr");
    row.innerHTML = `<th>${hour}</th>`;
    weekDates.forEach((date) => {
      const td = document.createElement("td");
      td.textContent = scheduleMap[hour][date] || "";

      const keyObj = scheduleKeys[hour][date][0];
      if (keyObj) {
        const isMine = keyObj.owner === currentUser.uid;
        if (isAdmin || isMine) {
          const btn = document.createElement("button");
          btn.textContent = "삭제";
          btn.className = "remove-btn";
          btn.onclick = () => deleteSchedule(keyObj.key);
          td.appendChild(btn);
        }
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  }
}

// 일정 삭제 (Firestore에서)
export async function deleteSchedule(docId) {
  if (!confirm("이 일정을 삭제하시겠습니까?")) return;
  const db = firebase.firestore();
  await db.collection("schedules").doc(docId).delete();
  alert("일정이 삭제되었습니다.");
  renderSchedule();
  showMyPendingSchedules();
}
