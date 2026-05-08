"use client";

import { useState, useEffect } from "react";

export interface OwnerGroup {
  chatId: string;
  title: string;
  type: string;
  activated: boolean;
  addedAt: string;
}

export interface Owner {
  telegramId: string;
  username: string;
  firstName: string;
  groups: OwnerGroup[];
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
}

export function getTelegramUser(): TelegramUser | null {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.initDataUnsafe?.user ?? null;
}

export function useOwner() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const tgUser = getTelegramUser();
    setTelegramUser(tgUser);

    const stored = localStorage.getItem("foxguard_owner");

    if (stored) {
      const parsed = JSON.parse(stored) as Owner;
      setOwner(parsed);
      fetch(`/api/owner?telegramId=${parsed.telegramId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setOwner(data);
            localStorage.setItem("foxguard_owner", JSON.stringify(data));
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    // Auto-connect if inside Telegram Mini App
    if (tgUser?.id) {
      connect(String(tgUser.id), tgUser.username ?? "", tgUser.first_name ?? "").finally(() =>
        setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, []);

  async function connect(telegramId: string, username = "", firstName = "") {
    const res = await fetch("/api/owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, username, firstName }),
    });
    const data = await res.json();
    setOwner(data);
    localStorage.setItem("foxguard_owner", JSON.stringify(data));
    return data as Owner;
  }

  async function addGroup(chatId: string, title: string, type: string) {
    if (!owner) return;
    const res = await fetch("/api/owner/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: owner.telegramId, chatId, title, type }),
    });
    const data = await res.json();
    setOwner(data);
    localStorage.setItem("foxguard_owner", JSON.stringify(data));
  }

  async function removeGroup(chatId: string) {
    if (!owner) return;
    await fetch("/api/owner/groups", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: owner.telegramId, chatId }),
    });
    const updated = { ...owner, groups: owner.groups.filter((g) => g.chatId !== chatId) };
    setOwner(updated);
    localStorage.setItem("foxguard_owner", JSON.stringify(updated));
  }

  function logout() {
    localStorage.removeItem("foxguard_owner");
    setOwner(null);
  }

  return { owner, loading, telegramUser, connect, addGroup, removeGroup, logout };
}
