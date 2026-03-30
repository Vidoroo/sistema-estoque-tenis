import bcrypt from "bcryptjs";

type User = {
  username: string;
  passwordHash: string;
};

const USERS_KEY = "users";
const AUTH_KEY = "auth";
const CURRENT_USER_KEY = "currentUser";
const LOGIN_ATTEMPTS_KEY = "loginAttempts";
const LOCK_UNTIL_KEY = "lockUntil";

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

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
  const users = getUsers();

  const exists = users.some(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );

  if (exists) {
    throw new Error("Usuário já cadastrado.");
  }

  validateStrongPassword(password);

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = {
    username,
    passwordHash,
  };

  users.push(newUser);
  saveUsers(users);
}

export async function loginUser(username: string, password: string) {
  const lockInfo = getLockInfo();

  if (lockInfo.locked) {
    throw new Error(
      `Login bloqueado. Tente novamente em ${lockInfo.remainingSeconds} segundos.`
    );
  }

  const users = getUsers();

  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    const attempts = getLoginAttempts() + 1;
    setLoginAttempts(attempts);

    if (attempts >= 3) {
      const lockUntil = Date.now() + 60_000;
      localStorage.setItem(LOCK_UNTIL_KEY, String(lockUntil));
      throw new Error("Muitas tentativas inválidas. Login bloqueado por 60 segundos.");
    }

    throw new Error(`Usuário não encontrado. Tentativa ${attempts} de 3.`);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    const attempts = getLoginAttempts() + 1;
    setLoginAttempts(attempts);

    if (attempts >= 3) {
      const lockUntil = Date.now() + 60_000;
      localStorage.setItem(LOCK_UNTIL_KEY, String(lockUntil));
      throw new Error("Muitas tentativas inválidas. Login bloqueado por 60 segundos.");
    }

    throw new Error(`Senha incorreta. Tentativa ${attempts} de 3.`);
  }

  clearLoginAttempts();
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(CURRENT_USER_KEY, user.username);
}

export function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY) || "";
}