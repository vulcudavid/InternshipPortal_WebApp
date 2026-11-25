"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import {
  loginAction,
  registerAction,
  verifyEmailAction,
  resendVerificationCodeAction,
} from "@/app/actions/auth";
import { 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  Sparkles,
  Lock,
  Terminal,
  Cpu,
  MailCheck,
  RefreshCw,
  ArrowLeft
} from "lucide-react";

export function AuthCard() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "COMPANY_TUTOR" | "COORDINATOR">("STUDENT");

  const [loginState, loginFormAction, isLoginPending] = useActionState(loginAction, null);
  const [registerState, registerFormAction, isRegisterPending] = useActionState(registerAction, null);

  const [quickLoginEmail, setQuickLoginEmail] = useState("");
  const [quickLoginPassword, setQuickLoginPassword] = useState("");

  const handleQuickFill = (email: string, pass: string) => {
    setTab("login");
    setQuickLoginEmail(email);
    setQuickLoginPassword(pass);
  };

  const isDemoLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

  const [manualOtpEmail, setManualOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const activeVerificationEmail =
    manualOtpEmail ||
    (registerState?.requiresVerification ? registerState.email : "") ||
    (loginState?.requiresVerification ? loginState.email : "");

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVerificationEmail || !otpCode.trim()) return;
    setIsVerifyingOtp(true);
    setOtpStatus(null);
    try {
      const res = await verifyEmailAction(activeVerificationEmail, otpCode.trim());
      setOtpStatus(res);
      if (res.success) {
        window.location.reload();
      }
    } catch (err: any) {
      setOtpStatus({ success: false, error: err?.message || "Eroare la verificare." });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!activeVerificationEmail) return;
    setIsResendingOtp(true);
    setOtpStatus(null);
    try {
      const res = await resendVerificationCodeAction(activeVerificationEmail);
      setOtpStatus(res);
    } catch (err: any) {
      setOtpStatus({ success: false, error: err?.message || "Eroare la retrimitere." });
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleCancelVerification = () => {
    setManualOtpEmail("");
    setOtpCode("");
    setOtpStatus(null);
    if (loginState) loginState.requiresVerification = false;
    if (registerState) registerState.requiresVerification = false;
  };

  return (
    <div className="bg-[#0B1221]/88 backdrop-blur-2xl border border-sky-400/25 shadow-2xl rounded-2xl overflow-hidden max-w-xl mx-auto w-full relative">
      {/* Glow Line Top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-80" />

      {/* Decorative HUD corners */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-sky-400/40 pointer-events-none" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-sky-400/40 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-sky-400/40 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-sky-400/40 pointer-events-none" />

      {/* Brand Header */}
      <div className="p-6 pb-4 sm:p-7 sm:pb-5 text-center border-b border-sky-500/15 bg-[#070D19]/70">
        <div className="inline-flex items-center justify-center mb-3">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-[#0B1221]/95 p-2 flex items-center justify-center border border-sky-400/50 shadow-[0_0_25px_rgba(14,165,233,0.4)]">
              <Image
                src="/images/ulbs-shield.svg"
                alt="Sigla Oficială ULBS - Facultatea de Inginerie"
                width={56}
                height={56}
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                priority
              />
            </div>
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Portal Practică Inginerie
        </h2>
        <p className="text-xs text-sky-300/90 mt-1 font-semibold tracking-wide">
          Facultatea de Inginerie • Universitatea „Lucian Blaga” din Sibiu
        </p>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          Cyber-Engineering Authentication Gateway
        </p>
      </div>

      {/* Dacă este activă verificarea adresei de email prin cod OTP */}
      {activeVerificationEmail ? (
        <div className="p-6 sm:p-7 space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-400 mb-1">
              <MailCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Verificare Adresă Email</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Am expediat un cod de verificare din 6 cifre către adresa de student:<br />
              <strong className="text-sky-300 font-mono text-sm">{activeVerificationEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-2 text-center">
                Introduceți Codul OTP din 6 Cifre
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono px-4 py-3 rounded-xl bg-[#070D19]/90 border border-sky-500/40 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 transition shadow-inner"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Codul este valabil timp de 15 minute.
              </p>
            </div>

            {otpStatus?.error && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 rounded-xl text-xs font-medium">
                {otpStatus.error}
              </div>
            )}

            {otpStatus?.message && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-medium">
                {otpStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingOtp || otpCode.trim().length !== 6}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_30px_rgba(14,165,233,0.55)] disabled:opacity-50 text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <MailCheck className="w-4 h-4 text-slate-950" />
              <span>{isVerifyingOtp ? "Se verifică..." : "Activează Contul"}</span>
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCancelVerification}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Înapoi la conectare</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResendingOtp}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResendingOtp ? "animate-spin" : ""}`} />
                <span>Retrimite codul</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Tab Switcher */}
          <div className="flex border-b border-sky-500/20 bg-[#070D19]/40">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            tab === "login"
              ? "text-sky-300 border-b-2 border-sky-400 bg-sky-500/10 shadow-[inset_0_-2px_10px_rgba(14,165,233,0.15)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <LogIn className="w-4 h-4 text-sky-400" />
          Conectare
        </button>
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            tab === "register"
              ? "text-sky-300 border-b-2 border-sky-400 bg-sky-500/10 shadow-[inset_0_-2px_10px_rgba(14,165,233,0.15)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <UserPlus className="w-4 h-4 text-sky-400" />
          Înregistrare Cont Nou
        </button>
      </div>

      <div className="p-6 sm:p-7">
        {/* LOGIN FORM */}
        {tab === "login" && (
          <form action={loginFormAction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-1.5">
                Adresă de Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={quickLoginEmail}
                onChange={(e) => setQuickLoginEmail(e.target.value)}
                placeholder="exemplu@student.ulbsibiu.ro"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070D19]/90 border border-sky-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition shadow-inner text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-1.5">
                Parolă
              </label>
              <input
                type="password"
                name="password"
                required
                value={quickLoginPassword}
                onChange={(e) => setQuickLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070D19]/90 border border-sky-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition shadow-inner text-sm"
              />
            </div>

            {loginState?.error && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 rounded-xl text-xs font-medium shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                {loginState.error}
              </div>
            )}

            {loginState?.message && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {loginState.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoginPending}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_30px_rgba(14,165,233,0.55)] disabled:opacity-50 text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>{isLoginPending ? "Se autentifică..." : "Autentificare în Sistem"}</span>
            </button>

            {/* Quick Demo Logins (Cele 4 Roluri) */}
            {isDemoLoginEnabled && (
              <div className="pt-5 border-t border-sky-500/20 space-y-2.5">
                <p className="text-xs text-sky-300/80 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Acces rapid demo (1-click):</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 1. Student */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill("alexandru.radu@student.ulbsibiu.ro", "demo_hash_student")}
                    className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-950/30 hover:bg-sky-900/40 hover:border-sky-400 text-sky-200 transition flex flex-col items-start gap-1 group text-left shadow-[0_0_10px_rgba(14,165,233,0.08)]"
                  >
                    <GraduationCap className="w-4 h-4 text-sky-400 group-hover:scale-110 transition shrink-0" />
                    <div className="truncate w-full">
                      <span className="block font-bold text-xs text-white">Student</span>
                      <span className="text-[10px] text-sky-400/80 truncate block">Alexandru (CTI)</span>
                    </div>
                  </button>

                  {/* 2. Tutore Firmă */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill("recruitment@continental-sibiu.com", "demo_hash_company")}
                    className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-400 text-cyan-200 transition flex flex-col items-start gap-1 group text-left shadow-[0_0_10px_rgba(6,182,212,0.08)]"
                  >
                    <Building2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition shrink-0" />
                    <div className="truncate w-full">
                      <span className="block font-bold text-xs text-white">Tutore Firmă</span>
                      <span className="text-[10px] text-cyan-400/80 truncate block">Continental</span>
                    </div>
                  </button>

                  {/* 3. Coordonator */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill("coordonator.practica@ulbsibiu.ro", "demo_hash_coordonator")}
                    className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 hover:border-indigo-400 text-indigo-200 transition flex flex-col items-start gap-1 group text-left shadow-[0_0_10px_rgba(99,102,241,0.08)]"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition shrink-0" />
                    <div className="truncate w-full">
                      <span className="block font-bold text-xs text-white">Coordonator</span>
                      <span className="text-[10px] text-indigo-400/80 truncate block">Cadru Didactic</span>
                    </div>
                  </button>

                  {/* 4. Administrator */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill("admin@ulbsibiu.ro", "demo_hash_admin")}
                    className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-400 text-amber-200 transition flex flex-col items-start gap-1 group text-left shadow-[0_0_10px_rgba(245,158,11,0.08)]"
                  >
                    <Terminal className="w-4 h-4 text-amber-400 group-hover:scale-110 transition shrink-0" />
                    <div className="truncate w-full">
                      <span className="block font-bold text-xs text-white">Administrator</span>
                      <span className="text-[10px] text-amber-400/80 truncate block">Admin ULBS</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === "register" && (
          <form action={registerFormAction} className="space-y-4">
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-2">
                Alegeți Tipul de Cont
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("STUDENT")}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    selectedRole === "STUDENT"
                      ? "border-sky-400 bg-sky-500/15 text-sky-200 font-bold shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                      : "border-sky-500/20 bg-[#070D19]/60 text-slate-400 hover:text-slate-200 hover:border-sky-500/30"
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-sky-400" />
                  <span className="text-xs">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("COMPANY_TUTOR")}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    selectedRole === "COMPANY_TUTOR"
                      ? "border-sky-400 bg-sky-500/15 text-sky-200 font-bold shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                      : "border-sky-500/20 bg-[#070D19]/60 text-slate-400 hover:text-slate-200 hover:border-sky-500/30"
                  }`}
                >
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs">Firmă / Tutore</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("COORDINATOR")}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    selectedRole === "COORDINATOR"
                      ? "border-sky-400 bg-sky-500/15 text-sky-200 font-bold shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                      : "border-sky-500/20 bg-[#070D19]/60 text-slate-400 hover:text-slate-200 hover:border-sky-500/30"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs">Coordonator</span>
                </button>
              </div>
              <input type="hidden" name="role" value={selectedRole} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-1.5">
                  Prenume
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="Ion"
                  className="w-full px-3 py-2 rounded-xl bg-[#070D19]/90 border border-sky-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-1.5">
                  Nume de Familie
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Popescu"
                  className="w-full px-3 py-2 rounded-xl bg-[#070D19]/90 border border-sky-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="ion.popescu@example.com"
                className="w-full px-3 py-2 rounded-xl bg-[#070D19]/90 border border-sky-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-300/90 uppercase tracking-wider mb-1.5">
                Parolă (min. 6 caractere)
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-[#070D19]/90 border border-sky-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 text-sm"
              />
            </div>

            {/* Câmpuri specifice STUDENT */}
            {selectedRole === "STUDENT" && (
              <div className="p-3 bg-[#070D19]/60 rounded-xl border border-sky-500/20 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-sky-300/80 mb-1">Specializare</label>
                    <input
                      type="text"
                      name="specialization"
                      defaultValue="Calculatoare"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0B1221] border border-sky-500/30 text-white text-xs focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sky-300/80 mb-1">An de Studiu</label>
                    <select
                      name="studyYear"
                      defaultValue={3}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0B1221] border border-sky-500/30 text-white text-xs focus:outline-none focus:border-sky-400"
                    >
                      <option value={1}>Anul 1</option>
                      <option value={2}>Anul 2</option>
                      <option value={3}>Anul 3</option>
                      <option value={4}>Anul 4</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-300/80 mb-1">Domeniu Inginerie</label>
                  <select
                    name="domain"
                    defaultValue="COMPUTER_SCIENCE_IT"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B1221] border border-sky-500/30 text-white text-xs focus:outline-none focus:border-sky-400"
                  >
                    <option value="COMPUTER_SCIENCE_IT">Calculatoare & Tehnologia Informației</option>
                    <option value="ELECTRONICS_TELECOM">Electronică și Telecomunicații</option>
                    <option value="ROBOTICS_MECHATRONICS">Mecatronică și Robotică</option>
                    <option value="INDUSTRIAL_MANAGEMENT">Inginerie Industrială / Management</option>
                    <option value="GENERAL_ENGINEERING">Inginerie Generală</option>
                  </select>
                </div>
              </div>
            )}

            {/* Câmpuri specifice FIRMĂ */}
            {selectedRole === "COMPANY_TUTOR" && (
              <div className="p-3 bg-[#070D19]/60 rounded-xl border border-sky-500/20 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-sky-300/80 mb-1">Denumire Companie</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="ex: Siemens / Continental / Marquardt"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B1221] border border-sky-500/30 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-sky-300/80 mb-1">CUI / CIF</label>
                    <input
                      type="text"
                      name="cuiCif"
                      required
                      placeholder="RO12345678"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0B1221] border border-sky-500/30 text-white text-xs focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sky-300/80 mb-1">Oraș</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue="Sibiu"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0B1221] border border-sky-500/30 text-white text-xs focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {registerState?.error && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 rounded-xl text-xs font-medium">
                {registerState.error}
              </div>
            )}

            {registerState?.message && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-medium">
                {registerState.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isRegisterPending}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_30px_rgba(14,165,233,0.55)] disabled:opacity-50 text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>{isRegisterPending ? "Se creează contul..." : "Finalizează Înregistrarea"}</span>
            </button>
          </form>
        )}
          </div>
        </>
      )}
    </div>
  );
}
