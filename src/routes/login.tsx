import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Clock, AlertCircle, HelpCircle, Lock } from "lucide-react";
import { BrandMark } from "@/components/trackwise/BrandMark";
import { useClock } from "@/hooks/useClock";
import { LoginRailwayScene } from "@/components/trackwise/LoginRailwayScene";
import { authenticate, type LoginCredentials } from "@/lib/trackwise/auth";
import { ROLES, roleLandingPath, useTrackwise } from "@/lib/trackwise/store";
import { workflowApiConfigured, workflowService } from "@/services/api/workflowService";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const clock = useClock();
  const { setUser } = useTrackwise();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    employeeId: "",
    password: "",
    station: "NDG",
    division: "Central Division",
    role: "Station Master",
    rememberDevice: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info("[CODEONTRACK AUTH] Login clicked", { role: credentials.role });
    setIsLoading(true);
    setError("");

    if (workflowApiConfigured) {
      try {
        const token = await workflowService.login(
          credentials.employeeId,
          credentials.password,
          credentials.role,
        );
        localStorage.setItem("trackwise_access_token", token.access_token);
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Backend authentication failed.");
        setIsLoading(false);
        return;
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const user = authenticate(credentials);
    console.info("[CODEONTRACK AUTH] Authentication result", {
      success: Boolean(user),
      role: user?.role,
    });
    if (user) {
      sessionStorage.setItem("trackwise_user", JSON.stringify(user));
      setUser(user);
      const target = roleLandingPath(user.role);
      console.info("[CODEONTRACK AUTH] Session stored; navigating", { target });
      try {
        await navigate({ to: target as "/" });
        console.info("[CODEONTRACK AUTH] Navigation completed", { target });
      } catch (navigationError) {
        console.error("[CODEONTRACK AUTH] Navigation failed", navigationError);
        setError("Login succeeded, but the destination could not be opened.");
        setIsLoading(false);
      }
    } else {
      localStorage.removeItem("trackwise_access_token");
      console.warn("[CODEONTRACK AUTH] Authentication rejected", { role: credentials.role });
      setError("Authentication failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.035_262)] text-slate-100 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(26rem,30rem)] xl:grid-cols-[minmax(0,1.5fr)_32rem]">
      {/* Left: railway scene + brand */}
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <LoginRailwayScene />
        <div className="relative z-10 flex h-full min-h-screen flex-col justify-between p-10 xl:p-14">
          <BrandMark size="lg" />
          <div className="max-w-xl">
            <p className="mb-3 text-[11px] font-bold tracking-[0.3em] text-orange-400">
              RAILWAY OPERATIONS · MAINTENANCE · DECISION SUPPORT
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight text-white xl:text-5xl">
              One command center for every train, track and block.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Live corridor visibility, AI-assisted incident resolution and conflict-free
              maintenance block planning across TMS, TDMS, SMMS and COA.
            </p>
          </div>
          <p className="text-[11px] tracking-[0.18em] text-slate-400">
            SIMULATED DEMONSTRATION DATA · NOT CONNECTED TO REAL RAILWAY SYSTEMS
          </p>
        </div>
      </section>

      {/* Right: dark premium sign-in panel */}
      <section className="flex min-h-screen items-center justify-center bg-[oklch(0.17_0.04_262)] px-5 py-10 lg:border-l lg:border-white/10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>

          <div className="mb-5">
            <p className="text-[11px] font-bold tracking-[0.3em] text-orange-400">SECURE SIGN-IN</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">
              Welcome to CODEONTRACK
            </h1>
            <p className="mt-1 text-sm text-slate-400">Rail Command Center · Operations access</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
            <div className="-mx-6 -mt-6 mb-6 h-1 bg-orange-500" />
            {/* System Status */}
            <div className="flex items-center justify-between mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">SYSTEM ONLINE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="size-3" />
                <span>{clock}</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Employee / HRMS ID
                </label>
                <input
                  type="text"
                  value={credentials.employeeId}
                  onChange={(e) => setCredentials({ ...credentials, employeeId: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40"
                  placeholder="Enter your employee ID"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Station</label>
                  <select
                    value={credentials.station}
                    onChange={(e) => setCredentials({ ...credentials, station: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40"
                  >
                    <option className="bg-slate-900 text-slate-100" value="NDG">
                      NDG - Nandgaon Jn
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="KRP">
                      KRP - Karimpur
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="STP">
                      STP - Sitalpur
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="DVR">
                      DVR - Devrai Jn
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="MRG">
                      MRG - Mirgaon
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Division
                  </label>
                  <select
                    value={credentials.division}
                    onChange={(e) => setCredentials({ ...credentials, division: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40"
                  >
                    <option className="bg-slate-900 text-slate-100" value="Central Division">
                      Central Division
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="Western Division">
                      Western Division
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="Eastern Division">
                      Eastern Division
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Operational Role
                </label>
                <select
                  value={credentials.role}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      role: e.target.value as LoginCredentials["role"],
                    })
                  }
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40"
                >
                  {ROLES.map((role) => (
                    <option className="bg-slate-900 text-slate-100" key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={credentials.rememberDevice}
                  onChange={(e) =>
                    setCredentials({ ...credentials, rememberDevice: e.target.checked })
                  }
                  className="rounded border-white/20 bg-white/5 accent-orange-500 focus:ring-2 focus:ring-orange-400"
                />
                <label htmlFor="remember" className="text-xs text-slate-300">
                  Remember this device
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="size-4 text-destructive" />
                  <span className="text-xs text-destructive">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-orange-500 px-4 py-2.5 text-sm font-bold tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.6)] transition-colors hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Authenticating..." : "Login to CODEONTRACK"}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() =>
                  setSupportMessage(
                    workflowApiConfigured
                      ? "Backend demo authentication is enabled; use the configured backend credentials."
                      : "Offline demo: use any non-empty Employee ID and password.",
                  )
                }
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <HelpCircle className="size-3" />
                Help / Support
              </button>
              <button
                type="button"
                onClick={() =>
                  setSupportMessage("Password recovery is available through the demo support desk.")
                }
                className="text-slate-400 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>
            {supportMessage && (
              <p className="mt-3 text-center text-xs text-slate-400">{supportMessage}</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3" />
                SECURE AUTHENTICATION
              </span>
              {" · "}
              Last successful login: Today, 08:32
            </p>
          </div>

          {/* Demo Notice */}
          <div className="mt-4 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
            <p className="text-center text-[11px] text-orange-200">
              <strong>DEMO / SIMULATION MODE</strong> — This is a prototype. Does not connect to
              real railway systems.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
