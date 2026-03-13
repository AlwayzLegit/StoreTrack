import { useState } from "react";

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || "stortrack2026";
const AUTH_KEY = "stortrack_auth";

export function useAuth() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const login  = (pw) => { if (pw === APP_PASSWORD) { sessionStorage.setItem(AUTH_KEY, "1"); setAuthed(true); return true; } return false; };
  const logout = () => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); };
  return { authed, login, logout };
}
