"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  MapPin,
  Users,
} from "lucide-react";

interface Company {
  id: string;
  companyName: string;
  cuiCif: string;
  city: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  _count: {
    offers: number;
  };
}

interface Offer {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  slotsTotal: number;
  slotsAvailable: number;
  location: string;
  createdAt: string;
  company: {
    id: string;
    companyName: string;
    cuiCif: string;
    city: string;
    status: string;
  };
  placements: Array<{
    id: string;
    status: string;
    studentId: string;
    cancelReason?: string | null;
    student: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>;
  _count: {
    placements: number;
  };
}

interface Props {
  onNotify: (msg: string, type: "success" | "error") => void;
}

export function CompaniesOffersTab({ onNotify }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtre Companii
  const [companyStatusFilter, setCompanyStatusFilter] = useState<string>("ALL");
  const [companySearch, setCompanySearch] = useState<string>("");

  // Filtre Oferte
  const [offerStatusFilter, setOfferStatusFilter] = useState<string>("ALL");
  const [offerSearch, setOfferSearch] = useState<string>("");

  // Dialog Retragere Ofertă
  const [withdrawingOffer, setWithdrawingOffer] = useState<Offer | null>(null);
  const [withdrawReason, setWithdrawReason] = useState<string>("");

  // Încărcare date
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resComp, resOff] = await Promise.all([
        fetch("/api/admin/companies"),
        fetch("/api/admin/offers"),
      ]);

      if (!resComp.ok || !resOff.ok) {
        throw new Error("Nu s-au putut încărca datele pentru companii sau oferte.");
      }

      const compData = await resComp.json();
      const offData = await resOff.json();

      setCompanies(compData.companies || []);
      setOffers(offData.offers || []);
    } catch (err: any) {
      onNotify(err.message || "Eroare la încărcare date.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcul KPI-uri rapide
  const kpis = useMemo(() => {
    const totalCompanies = companies.length;
    const pendingCompanies = companies.filter((c) => c.status === "PENDING").length;
    const activeOffers = offers.filter((o) => o.status === "ACTIVE").length;
    const availableSlots = offers
      .filter((o) => o.status === "ACTIVE")
      .reduce((acc, o) => acc + (o.slotsAvailable || 0), 0);

    return { totalCompanies, pendingCompanies, activeOffers, availableSlots };
  }, [companies, offers]);

  // Actualizare status companie (Aprobă / Respinge)
  const handleUpdateCompanyStatus = async (
    companyId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setActionLoadingId(companyId);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la actualizarea statusului companiei.");
      }

      onNotify(
        status === "APPROVED"
          ? "Compania a fost aprobată cu succes!"
          : "Compania a fost respinsă.",
        "success"
      );
      fetchData();
    } catch (err: any) {
      onNotify(err.message || "Eroare de procesare.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirmare retragere ofertă (Twist P14)
  const handleConfirmWithdrawOffer = async () => {
    if (!withdrawingOffer) return;
    setActionLoadingId(withdrawingOffer.id);

    try {
      const res = await fetch(`/api/admin/offers/${withdrawingOffer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          reason: withdrawReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la retragerea ofertei.");
      }

      onNotify(
        data.message ||
          "Oferta a fost retrasă. Studenții au fost trecuți în statusul NEPLASAT pentru realocare minimală.",
        "success"
      );
      setWithdrawingOffer(null);
      setWithdrawReason("");
      fetchData();
    } catch (err: any) {
      onNotify(err.message || "Eroare de comunicare.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtrare Companii
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesStatus =
        companyStatusFilter === "ALL" || c.status === companyStatusFilter;
      const matchesSearch =
        companySearch === "" ||
        c.companyName.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.cuiCif.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.city.toLowerCase().includes(companySearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [companies, companyStatusFilter, companySearch]);

  // Filtrare Oferte
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchesStatus =
        offerStatusFilter === "ALL" || o.status === offerStatusFilter;
      const matchesSearch =
        offerSearch === "" ||
        o.title.toLowerCase().includes(offerSearch.toLowerCase()) ||
        o.company.companyName.toLowerCase().includes(offerSearch.toLowerCase()) ||
        o.location.toLowerCase().includes(offerSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [offers, offerStatusFilter, offerSearch]);

  return (
    <div className="space-y-8">
      {/* ── Carduri KPI Rapide ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Companii
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {kpis.totalCompanies}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Înregistrate pe platformă
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-t-4 border-t-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              În Așteptare Validare
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {kpis.pendingCompanies}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Necesită aprobare admin
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-t-4 border-t-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Oferte Active
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {kpis.activeOffers}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Vizibile studenților
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-t-4 border-t-indigo-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Locuri Disponibile
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {kpis.availableSlots}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              În ofertele active
            </div>
          </div>
        </div>
      </div>

      {/* ── Secțiunea 1: Validare Companii ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> Companii Partenere
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aprobarea sau respingerea conturilor de companie și a tutorilor asociați.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Caută companie / CUI..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-56"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setCompanyStatusFilter(status)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    companyStatusFilter === status
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {status === "ALL"
                    ? "Toate"
                    : status === "PENDING"
                    ? "În așteptare"
                    : status === "APPROVED"
                    ? "Aprobate"
                    : "Respinse"}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              title="Reîmprospătează"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabel Companii */}
        <div className="overflow-x-auto">
          {filteredCompanies.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nicio companie găsită
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {companySearch || companyStatusFilter !== "ALL"
                  ? "Nu există companii care să corespundă filtrelor selectate."
                  : "Nu există încă nicio companie înregistrată în baza de date."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <th className="py-3 px-4">Companie & CUI</th>
                  <th className="py-3 px-4">Locație</th>
                  <th className="py-3 px-4">Reprezentant / Email</th>
                  <th className="py-3 px-4">Oferte</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredCompanies.map((c) => {
                  const isItemLoading = actionLoadingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {c.cuiCif}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {c.city}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div>
                          {c.user.firstName} {c.user.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.user.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c._count.offers} oferte
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Aprobată
                          </span>
                        )}
                        {c.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> În așteptare
                          </span>
                        )}
                        {c.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" /> Respinsă
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== "APPROVED" && (
                            <button
                              onClick={() => handleUpdateCompanyStatus(c.id, "APPROVED")}
                              disabled={isItemLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                            >
                              {isItemLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>Aprobă</span>
                            </button>
                          )}
                          {c.status !== "REJECTED" && (
                            <button
                              onClick={() => handleUpdateCompanyStatus(c.id, "REJECTED")}
                              disabled={isItemLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Respinge</span>
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

      {/* ── Secțiunea 2: Oferte & Retragere Oferte (Twist P14) ─────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" /> Oferte de Stagiu de Practică
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitorizare oferte active și retragere cu realocare minimală (Twist P14).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Caută ofertă / companie..."
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-56"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              {(["ALL", "ACTIVE", "CLOSED", "DRAFT"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setOfferStatusFilter(status)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    offerStatusFilter === status
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {status === "ALL"
                    ? "Toate"
                    : status === "ACTIVE"
                    ? "Active"
                    : status === "CLOSED"
                    ? "Închise/Retrase"
                    : "Ciornă"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabel Oferte */}
        <div className="overflow-x-auto">
          {filteredOffers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nicio ofertă găsită
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {offerSearch || offerStatusFilter !== "ALL"
                  ? "Nu există oferte care să corespundă criteriilor alese."
                  : "Nu există încă oferte publicate de către companii."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <th className="py-3 px-4">Titlu Ofertă</th>
                  <th className="py-3 px-4">Companie</th>
                  <th className="py-3 px-4">Locuri</th>
                  <th className="py-3 px-4">Studenți Alocați</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredOffers.map((o) => {
                  const activePlacements = o.placements.filter(
                    (p) =>
                      p.status === "CONFIRMED" || p.status === "PENDING_CONFIRMATION"
                  );
                  const isItemLoading = actionLoadingId === o.id;

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {o.title}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {o.location}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {o.company.companyName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {o.slotsAvailable}
                        </span>
                        <span className="text-slate-400"> / {o.slotsTotal}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {activePlacements.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {activePlacements.length} studenți
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Niciun student</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Activă
                          </span>
                        )}
                        {o.status === "CLOSED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Închisă / Retrasă
                          </span>
                        )}
                        {o.status === "DRAFT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Ciornă
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {o.status === "ACTIVE" && (
                          <button
                            onClick={() => setWithdrawingOffer(o)}
                            disabled={isItemLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Retrage Ofertă</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Dialog Modal Retragere Ofertă (Twist P14) ───────────────────────── */}
      {withdrawingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirmare Retragere Ofertă (Twist P14)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sunteți pe cale să retrageți oferta{" "}
                  <strong>{withdrawingOffer.title}</strong> a companiei{" "}
                  <strong>{withdrawingOffer.company.companyName}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Impact automat asupra studenților și coordonatorilor:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300/90">
                <li>
                  Toți studenții alocați pe această ofertă vor fi trecuți automat în statusul{" "}
                  <strong>NEPLASAT</strong>.
                </li>
                <li>
                  Studenții vor primi o notificare de sistem și vor fi marcați pentru{" "}
                  <strong>realocare minimală</strong>.
                </li>
                <li>
                  Coordonatorii academici vor fi notificați imediat pentru a gestiona excepția fără a re-rula tot matching-ul.
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motivul retragerii (opțional, va apărea în audit și notificări):
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Ex: Compania și-a suspendat activitatea de internship în acest semestru..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setWithdrawingOffer(null);
                  setWithdrawReason("");
                }}
                disabled={actionLoadingId === withdrawingOffer.id}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={handleConfirmWithdrawOffer}
                disabled={actionLoadingId === withdrawingOffer.id}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {actionLoadingId === withdrawingOffer.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>Confirmă Retragerea</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
