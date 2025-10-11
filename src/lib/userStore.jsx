// src/lib/userStore.js
const KEY = "dt_user_profile";

export function loadUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUser(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {}
}
