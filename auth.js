// auth.js

export function toggleLogin() {
  document.getElementById("auth-modal").style.display = "block";
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
}

export function toggleRegister() {
  document.getElementById("auth-modal").style.display = "block";
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
}

export function closeModal() {
  document.getElementById("auth-modal").style.display = "none";
}

export async function handleLogin() {
  const id = document.getElementById("login-id").value.trim();
  const pw = document.getElementById("login-pw").value.trim();
  const email = `${id}@hastati.dev`;

  try {
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, pw);
    const uid = userCredential.user.uid;

    // Firestore에서 사용자 데이터 가져오기
    const db = firebase.firestore();
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (userData.status !== "approved") {
      alert("승인 대기 중입니다.");
      return;
    }

    // ✅ 로그인 성공: sessionStorage에 저장
    sessionStorage.setItem("currentUser", uid);
    sessionStorage.setItem("nickname", userData.nickname);
    sessionStorage.setItem("role", userData.role);

    alert(`${userData.nickname}님 로그인되었습니다.`);
    location.href = "hastati.html";
  } catch (err) {
    alert("로그인 실패: " + err.message);
  }
}

export async function handleRegister() {
  const id = document.getElementById("reg-id").value.trim();
  const pw = document.getElementById("reg-pw").value.trim();
  const nick = document.getElementById("reg-nick").value.trim();
  const role = document.getElementById("reg-role").value;

  if (!/^[a-zA-Z0-9]{6,}$/.test(id))
    return alert("아이디는 영문+숫자 6자 이상이어야 합니다.");
  if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*\W).{6,}$/.test(pw))
    return alert("비밀번호는 조건을 만족해야 합니다.");
  if (!nick) return alert("닉네임을 입력해주세요.");
  if (!["하스타티", "레가투스", "헤나"].includes(role))
    return alert("소속을 선택해주세요.");

  try {
    const email = `${id}@hastati.dev`; // 이메일 형식 맞추기용
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, pw);
    const uid = userCredential.user.uid;

    // Firestore에 사용자 정보 저장
    const db = firebase.firestore();
    await db.collection("users").doc(uid).set({
      id,
      nickname: nick,
      role,
      status: "pending",
    });

    alert("회원가입 완료! 관리자 승인 후 로그인 가능합니다.");
    closeModal();
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      alert("이미 존재하는 아이디입니다.");
    } else {
      alert("회원가입 중 오류: " + err.message);
    }
  }
}

export function enterAdminMode() {
  const code = prompt("관리자 코드를 입력하세요");
  if (code === "0109") {
    alert("관리자 모드가 활성화되었습니다.");
    sessionStorage.setItem("isAdmin", "true");
  } else {
    alert("관리자 코드가 올바르지 않습니다.");
  }
}

export function logout() {
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("isAdmin");
  alert("로그아웃 되었습니다.");
  location.href = "hastati.html";
}

export function requireLogin(target) {
  const userId = sessionStorage.getItem("currentUser");
  const user = userId
    ? JSON.parse(localStorage.getItem("user_" + userId))
    : null;
  const isAdminSession = sessionStorage.getItem("isAdmin") === "true";

  if (!user && !isAdminSession) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (target === "hastati-admin.html" && !isAdminSession) {
    alert("관리자 모드로만 접근 가능합니다.");
    return;
  }

  location.href = target;
}

export async function updateAuthUI() {
  const uid = sessionStorage.getItem("currentUser");
  const authBox = document.getElementById("auth-actions");
  if (!uid || !authBox) return;

  const db = firebase.firestore();
  const userDoc = await db.collection("users").doc(uid).get();
  const user = userDoc.data();

  if (user) {
    authBox.innerHTML = `
      <span style="color:white;">🌿 ${user.nickname} (${user.role})님</span>
      <button onclick="logout()" style="margin-left: 12px; background: white; color: #2f80ed; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer;">
        로그아웃
      </button>
    `;
  }
}
