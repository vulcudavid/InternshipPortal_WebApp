"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  GraduationCap,
  Building2,
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "COMPANY_TUTOR" | "COORDINATOR" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  studentProfile?: {
    id: string;
    specialization: string;
    studyYear: number;
    group: string;
    domain: string;
  } | null;
  companyProfile?: {
    id: string;
    companyName: string;
    cuiCif: string;
    city: string;
    status: string;
  } | null;
}

interface Props {
  onNotify: (msg: string, type: "success" | "error") => void;
}

export function UsersGdprTab({ onNotify }: Props) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtre & Căutare
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modal Anonimizare GDPR
  const [anonymizingUser, setAnonymizingUser] = useState<UserItem | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("Nu s-a putut prelua lista de utilizatori.");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      onNotify(err.message || "Eroare la preluarea utilizatorilor.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Schimbare rol
  const handleChangeRole = async (
    userId: string,
    newRole: "STUDENT" | "COMPANY_TUTOR" | "COORDINATOR" | "ADMIN"
  ) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la schimbarea rolului.");
      }
      onNotify(data.message || "Rolul a fost actualizat cu succes.", "success");
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message || "Eroare de procesare.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle activ / inactiv
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la schimbarea statusului contului.");
      }
      onNotify(data.message || "Statusul a fost actualizat.", "success");
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message || "Eroare de procesare.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirmare Anonimizare GDPR la cerere
  const handleConfirmAnonymize = async () => {
    if (!anonymizingUser) return;
    setActionLoadingId(anonymizingUser.id);

    try {
      const res = await fetch("/api/admin/gdpr/anonymize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: anonymizingUser.id,
          studentId: anonymizingUser.studentProfile?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la anonimizarea GDPR.");
      }

      onNotify(
        data.message || "Datele studentului au fost anonimizate ireversibil conform GDPR.",
        "success"
      );
      setAnonymizingUser(null);
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message || "Eroare la anonimizare.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtrare utilizatori
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesSearch =
        searchQuery === "" ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header Secțiune */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Management Utilizatori & Conformitate GDPR
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control roluri, activare conturi și procesare drept de anonimizare (Art. 17 GDPR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Caută utilizator / email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 sm:w-64"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              {(
                [
                  "ALL",
                  "STUDENT",
                  "COMPANY_TUTOR",
                  "COORDINATOR",
                  "ADMIN",
                ] as const
              ).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    roleFilter === role
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {role === "ALL"
                    ? "Toate"
                    : role === "STUDENT"
                    ? "Studenți"
                    : role === "COMPANY_TUTOR"
                    ? "Firme"
                    : role === "COORDINATOR"
                    ? "Coordonatori"
                    : "Admini"}
                </button>
              ))}
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              title="Reîmprospătează"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabel Utilizatori */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Niciun utilizator găsit
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || roleFilter !== "ALL"
                  ? "Nu există utilizatori care să corespundă criteriilor selectate."
                  : "Nu există încă utilizatori înregistrați în baza de date."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <th className="py-3 px-4">Nume & Email</th>
                  <th className="py-3 px-4">Rol Curent</th>
                  <th className="py-3 px-4">Detalii Profil</th>
                  <th className="py-3 px-4">Status Cont</th>
                  <th className="py-3 px-4">Înregistrat la</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isItemLoading = actionLoadingId === u.id;
                  const isAnon = u.email.includes("@deleted.local") || u.firstName.startsWith("Student_Anonim_");

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {u.firstName} {u.lastName}
                          {isAnon && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Anonimizat
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === "ADMIN" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> ADMIN
                          </span>
                        )}
                        {u.role === "COORDINATOR" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Shield className="w-3 h-3" /> Coordonator
                          </span>
                        )}
                        {u.role === "COMPANY_TUTOR" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Building2 className="w-3 h-3" /> Firmă
                          </span>
                        )}
                        {u.role === "STUDENT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <GraduationCap className="w-3 h-3" /> Student
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {u.studentProfile && (
                          <div>
                            <span className="font-medium">{u.studentProfile.specialization}</span>{" "}
                            <span className="text-slate-400">
                              (An {u.studentProfile.studyYear}, {u.studentProfile.group})
                            </span>
                          </div>
                        )}
                        {u.companyProfile && (
                          <div>
                            <span className="font-medium">{u.companyProfile.companyName}</span>{" "}
                            <span className="text-slate-400">({u.companyProfile.city})</span>
                          </div>
                        )}
                        {!u.studentProfile && !u.companyProfile && (
                          <span className="text-slate-400 italic">Fără profil special</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <UserCheck className="w-3 h-3" /> Activ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <UserX className="w-3 h-3" /> Inactiv
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Selector Schimbare Rol */}
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleChangeRole(
                                u.id,
                                e.target.value as UserItem["role"]
                              )
                            }
                            disabled={isItemLoading}
                            className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="COMPANY_TUTOR">Firmă</option>
                            <option value="COORDINATOR">Coordonator</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>

                          {/* Toggle Activ / Inactiv */}
                          <button
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            disabled={isItemLoading}
                            title={u.isActive ? "Dezactivează contul" : "Activează contul"}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                              u.isActive
                                ? "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-rose-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            {u.isActive ? "Dezactivează" : "Activează"}
                          </button>

                          {/* Buton Anonimizare GDPR pentru Studenți */}
                          {(u.role === "STUDENT" || u.studentProfile) && !isAnon && (
                            <button
                              onClick={() => setAnonymizingUser(u)}
                              disabled={isItemLoading}
                              title="Anonimizare conform Art. 17 GDPR"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Anonimizează GDPR</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Dialog Modal Anonimizare GDPR (Art. 17) ─────────────────────────── */}
      {anonymizingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Anonimizare Date Student conform GDPR (Art. 17)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sunteți pe cale să anonimizați ireversibil datele cu caracter personal pentru studentul{" "}
                  <strong>
                    {anonymizingUser.firstName} {anonymizingUser.lastName}
                  </strong>{" "}
                  ({anonymizingUser.email}).
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white">
                Ce modificări vor avea loc:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                <li>
                  Numele va deveni <code>Student_Anonim_&lt;id&gt;</code>.
                </li>
                <li>
                  Emailul va fi înlocuit cu <code>anonim_&lt;id&gt;@deleted.local</code>.
                </li>
                <li>
                  Numărul de telefon, descrierea, headline-ul și fișierul fizic al CV-ului vor fi{" "}
                  <strong>șterse definitiv de pe server</strong>.
                </li>
                <li>
                  Contul va fi marcat ca inactiv, iar parola ștearsă.
                </li>
                <li className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Plasamentele, orele validate din jurnale și statisticile agregate rămân 100% intacte.
                </li>
              </ul>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Atenție: Această operațiune este strict ireversibilă!
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAnonymizingUser(null)}
                disabled={actionLoadingId === anonymizingUser.id}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={handleConfirmAnonymize}
                disabled={actionLoadingId === anonymizingUser.id}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {actionLoadingId === anonymizingUser.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Confirmă Anonimizarea</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
