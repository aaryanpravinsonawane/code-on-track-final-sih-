import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TrainFront, ShieldCheck, Clock, AlertCircle, HelpCircle, Lock } from "lucide-react";
import { authenticate, type LoginCredentials } from "@/lib/trackwise/auth";
import { ROLES } from "@/lib/trackwise/store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = authenticate(credentials);
    if (user) {
      // Store user in session storage (in real app, use secure cookies/JWT)
      sessionStorage.setItem("trackwise_user", JSON.stringify(user));
      navigate({ to: "/" });
    } else {
      setError("Authentication failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-20 rounded-xl bg-primary mb-4">
            <TrainFront className="size-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[0.2em] text-primary mb-2">
            TRACKWISE
          </h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            INTEGRATED RAILWAY OPERATIONS & MAINTENANCE MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-panel border border-border rounded-xl shadow-panel p-6">
          {/* System Status */}
          <div className="flex items-center justify-between mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">SYSTEM ONLINE</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Employee / HRMS ID
              </label>
              <input
                type="text"
                value={credentials.employeeId}
                onChange={(e) => setCredentials({ ...credentials, employeeId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your employee ID"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Station
                </label>
                <select
                  value={credentials.station}
                  onChange={(e) => setCredentials({ ...credentials, station: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="NDG">NDG - Nandgaon Jn</option>
                  <option value="KRP">KRP - Karimpur</option>
                  <option value="STP">STP - Sitalpur</option>
                  <option value="DVR">DVR - Devrai Jn</option>
                  <option value="MRG">MRG - Mirgaon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Division
                </label>
                <select
                  value={credentials.division}
                  onChange={(e) => setCredentials({ ...credentials, division: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="Central Division">Central Division</option>
                  <option value="Western Division">Western Division</option>
                  <option value="Eastern Division">Eastern Division</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Role
              </label>
              <select
                value={credentials.role}
                onChange={(e) => setCredentials({ ...credentials, role: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
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
                onChange={(e) => setCredentials({ ...credentials, rememberDevice: e.target.checked })}
                className="rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="remember" className="text-xs text-muted-foreground">
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
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Authenticating..." : "Login to TRACKWISE"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="size-3" />
              Help / Support
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" />
              SECURE AUTHENTICATION
            </span>
            {" · "}
            Last successful login: Today, 08:32
          </p>
        </div>

        {/* Demo Notice */}
        <div className="mt-4 p-3 bg-warn/10 border border-warn/20 rounded-lg">
          <p className="text-[11px] text-warn-foreground text-center">
            <strong>DEMO / SIMULATION MODE</strong> — This is a prototype. Does not connect to real railway systems.
          </p>
        </div>
      </div>
    </div>
  );
}
