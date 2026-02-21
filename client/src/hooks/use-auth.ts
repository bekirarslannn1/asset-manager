import { useState, useEffect, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar: string | null;
}

let authListeners: Array<() => void> = [];
let currentUser: AuthUser | null = null;
let authLoading = true;

function notifyListeners() {
  authListeners.forEach((fn) => fn());
}

async function checkAuth() {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    currentUser = null;
    authLoading = false;
    notifyListeners();
    return;
  }
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      currentUser = await res.json();
    } else {
      currentUser = null;
      localStorage.removeItem("auth_token");
    }
  } catch {
    currentUser = null;
  }
  authLoading = false;
  notifyListeners();
}

checkAuth();

export function useAuth() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    authListeners.push(listener);
    return () => {
      authListeners = authListeners.filter((l) => l !== listener);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Giriş başarısız");
    localStorage.setItem("auth_token", data.token);
    currentUser = data.user;
    authLoading = false;
    notifyListeners();
    return data.user;
  }, []);

  const register = useCallback(async (fields: { username: string; email: string; password: string; fullName: string; phone?: string }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
    localStorage.setItem("auth_token", data.token);
    currentUser = data.user;
    authLoading = false;
    notifyListeners();
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    currentUser = null;
    notifyListeners();
    queryClient.clear();
  }, []);

  return {
    user: currentUser,
    isLoading: authLoading,
    isLoggedIn: !!currentUser,
    login,
    register,
    logout,
  };
}
