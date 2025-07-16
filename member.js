// js/member.js

let user = null; // 로그인한 사용자 정보

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

  // 로그인된 사용자 정보 보관
  user = {
    uid: firebaseUser.uid,
    nickname: userData.nickname,
  };

  // 초기 렌더링
  fillTimes();
  loadMyList();
});

export function fillTimes() {
  for (let h = 0; h <= 24; h++) {
    const time = h.toString().padStart(2, "0") + ":00";
    document.getElementById("start").appendChild(new Option(time, time));
    document.getElementById("end").appendChild(new Option(time, time));
  }
}

export async function submitSchedule() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!date || !start || !end) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  if (start >= end) {
    alert("시작 시간은 종료 시간보다 빨라야 합니다.");
    return;
  }

  try {
    const db = firebase.firestore();
    await db.collection("schedules").add({
      userId: user.uid,
      nickname: user.nickname,
      date,
      start,
      end,
      status: "pending",
    });

    alert("일정 신청 완료! 관리자의 승인을 기다려주세요.");
    loadMyList();
  } catch (e) {
    console.error("일정 저장 오류:", e);
    alert("일정 신청에 실패했습니다.");
  }
}

export async function loadMyList() {
  const list = document.getElementById("my-list");
  list.innerHTML = "";

  try {
    const db = firebase.firestore();
    const querySnapshot = await db
      .collection("schedules")
      .where("userId", "==", user.uid)
      .where("status", "==", "pending")
      .orderBy("date")
      .get();

    if (querySnapshot.empty) {
      list.innerHTML = "<li>신청 내역이 없습니다.</li>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.date} ${item.start} ~ ${item.end}
        <button class="del-btn" onclick="deletePending('${doc.id}')">삭제</button>
      `;
      list.appendChild(li);
    });
  } catch (e) {
    console.error("일정 로딩 오류:", e);
    alert("일정 불러오기 실패");
  }
}

window.deletePending = async function (docId) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const db = firebase.firestore();
    await db.collection("schedules").doc(docId).delete();
    loadMyList();
  } catch (e) {
    console.error("삭제 오류:", e);
    alert("삭제 실패");
  }
};
