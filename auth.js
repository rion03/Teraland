export function toggleLogin() {
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
  document.getElementById("auth-modal").style.display = "block";
}

export function toggleRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("auth-modal").style.display = "block";
}

export function closeModal() {
  document.getElementById("auth-modal").style.display = "none";
}

export async function handleLogin() {
  const id = document.getElementById("login-id").value.trim();
  const pw = document.getElementById("login-pw").value.trim();

  try {
    const user = await firebase.auth().signInWithEmailAndPassword(`${id}@teraland.com`, pw);
    sessionStorage.setItem("currentUser", user.user.uid);
    alert("로그인 성공!");
    location.reload();
  } catch (e) {
    alert("로그인 실패: " + e.message);
  }
}

export async function handleRegister() {
  const id = document.getElementById("reg-id").value.trim();
  const pw = document.getElementById("reg-pw").value.trim();
  const nick = document.getElementById("reg-nick").value.trim();
  const role = document.getElementById("reg-role").value;

  if (!/^[a-zA-Z0-9]{6,}$/.test(id)) {
    return alert("아이디는 영문+숫자 6자 이상이어야 합니다.");
  }

  if (!/^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{6,}$/.test(pw)) {
    return alert("비밀번호는 영문+숫자+특수문자 포함 6자 이상이어야 합니다.");
  }

  try {
    const user = await firebase.auth().createUserWithEmailAndPassword(`${id}@teraland.com`, pw);
    await firebase.firestore().collection("users").doc(user.user.uid).set({
      id,
      nickname: nick,
      role,
      status: "pending",
    });
    alert("회원가입 완료. 관리자의 승인을 기다려주세요.");
    location.reload();
  } catch (e) {
    alert("회원가입 실패: " + e.message);
  }
}

export function enterAdminMode() {
  alert("관리자 모드로 전환하시려면 관리자 페이지에서 로그인 해주세요.");
  window.location.href = "hastati-admin.html";
}

export function requireLogin(path) {
  const user = firebase.auth().currentUser;
  if (user) {
    location.href = path;
  } else {
    alert("로그인이 필요합니다.");
  }
}

export function logout() {
  firebase.auth().signOut().then(() => {
    sessionStorage.clear();
    alert("로그아웃 되었습니다.");
    location.reload();
  });
}

export function updateAuthUI() {
  firebase.auth().onAuthStateChanged((user) => {
    const authBox = document.getElementById("auth-actions");
    if (user) {
      authBox.innerHTML = `<a href="#" onclick="logout()" style="color: white;">로그아웃</a>`;
      sessionStorage.setItem("currentUser", user.uid);
    }
  });
}
