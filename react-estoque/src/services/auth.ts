const API_URL = "http://127.0.0.1:5000/api";

const AUTH_KEY = "auth";
const CURRENT_USER_KEY = "currentUser";
const LOGIN_ATTEMPTS_KEY = "loginAttempts";
const LOCK_UNTIL_KEY = "lockUntil";
const USER_DATA_KEY = "userData";

function getLoginAttempts() {
  return Number(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || "0");
}

function setLoginAttempts(value: number) {
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(value));
}

function clearLoginAttempts() {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  localStorage.removeItem(LOCK_UNTIL_KEY);
}

export function getLockInfo() {
  const lockUntil = Number(localStorage.getItem(LOCK_UNTIL_KEY) || "0");
  const now = Date.now();

  if (lockUntil && now < lockUntil) {
    const remainingMs = lockUntil - now;
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    return {
      locked: true,
      remainingSeconds,
    };
  }

  if (lockUntil && now >= lockUntil) {
    clearLoginAttempts();
  }

  return {
    locked: false,
    remainingSeconds: 0,
  };
}

export function validateStrongPassword(password: string) {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!minLength) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  if (!hasUppercase) {
    throw new Error("A senha deve ter pelo menos 1 letra maiúscula.");
  }

  if (!hasLowercase) {
    throw new Error("A senha deve ter pelo menos 1 letra minúscula.");
  }

  if (!hasNumber) {
    throw new Error("A senha deve ter pelo menos 1 número.");
  }

  if (!hasSpecial) {
    throw new Error("A senha deve ter pelo menos 1 caractere especial.");
  }
}

export async function registerUser(username: string, password: string) {
  validateStrongPassword(password);

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: username,
      email: username,
      password,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Erro ao cadastrar usuário.");
  }

  return data;
}

export async function loginUser(username: string, password: string) {
  const lockInfo = getLockInfo();

  if (lockInfo.locked) {
    throw new Error(
      `Login bloqueado. Tente novamente em ${lockInfo.remainingSeconds} segundos.`
    );
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: username,
      password,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    const attempts = getLoginAttempts() + 1;
    setLoginAttempts(attempts);

    if (attempts >= 3) {
      const lockUntil = Date.now() + 60_000;
      localStorage.setItem(LOCK_UNTIL_KEY, String(lockUntil));
      throw new Error(
        "Muitas tentativas inválidas. Login bloqueado por 60 segundos."
      );
    }

    throw new Error(data.message || `Falha no login. Tentativa ${attempts} de 3.`);
  }

  clearLoginAttempts();
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(CURRENT_USER_KEY, data.data?.name || username);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data));

  return data;
}

export function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY) || "";
}

export function getCurrentUserData() {
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
}