"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type User = { name: string } | null;

interface UserContextValue {
  user: User;
  login: (u: User) => void;
  signOut: () => void;
  saveScore: (entry: { game: string; score: number; name: string }) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("av_user") || "null"));
    } catch {
      setUser(null);
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem("av_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  const saveScore = (entry: { game: string; score: number; name: string }) => {
    try {
      const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {
      // localStorage no disponible (modo privado); no hay fallback en este spec.
    }
  };

  return (
    <UserContext.Provider value={{ user, login, signOut, saveScore }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de <UserProvider>");
  return ctx;
}
