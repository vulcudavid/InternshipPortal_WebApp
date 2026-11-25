"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/app/actions/notifications";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignorăm erorile de fundal
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Închidere la click în exterior
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const handleMarkOne = (id: string) => {
    startTransition(async () => {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        title="Notificări de sistem"
        aria-label="Notificări"
        className="relative p-2 rounded-xl border border-sky-500/20 bg-sky-950/20 hover:bg-sky-900/30 text-sky-300 hover:text-sky-100 transition duration-200 shadow-[0_0_12px_rgba(14,165,233,0.1)] active:scale-95 cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#070D19]/95 backdrop-blur-2xl border border-sky-400/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-sky-500/20 flex items-center justify-between bg-[#0B1221]/90">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                Notificări In-App
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
                  {unreadCount} noi
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 hover:underline disabled:opacity-50 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marchează toate ca citite</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-sky-500/10">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>Se încarcă notificările...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-slate-300">Nu aveți nicio notificare</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Evenimentele legate de interviuri, convenții și plasamente vor apărea aici.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkOne(n.id)}
                  className={`p-3.5 text-xs transition cursor-pointer flex items-start gap-3 ${
                    n.isRead
                      ? "hover:bg-slate-800/20 text-slate-400"
                      : "bg-sky-500/5 hover:bg-sky-500/10 text-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.isRead ? "bg-transparent" : "bg-sky-400 shadow-[0_0_6px_#38bdf8]"
                    }`}
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold ${n.isRead ? "text-slate-300" : "text-white"}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(n.createdAt).toLocaleDateString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
