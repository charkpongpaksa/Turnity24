import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { GraduationCap, Loader2, Lock, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { appConfig } from "@/lib/config/env";
import { useAuth } from "./AuthProvider";
import { getDefaultRouteForRole } from "./auth.utils";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, session } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && session) {
    return <Navigate to={getDefaultRouteForRole(session.user.role)} replace />;
  }

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const nextSession = await login({ username, password });
      navigate(from || getDefaultRouteForRole(nextSession.user.role), { replace: true });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl lg:p-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Turnity</p>
              <h1 className="text-3xl font-semibold">TU Sign-In Gateway</h1>
            </div>
          </div>

          <div className="space-y-4">
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Sign in with your Thammasat account. The frontend sends credentials to your own backend,
              and the backend is the only place that should call the TU authentication API with the
              secret `Application-Key`.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium">Student</p>
                <p className="mt-2 text-sm text-slate-300">
                  TU API returns `type: student` and the app routes to the student workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium">Instructor / Staff</p>
                <p className="mt-2 text-sm text-slate-300">
                  TU API returns `type: employee` and the app routes to the instructor workspace.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
              {appConfig.dataSource === "mock"
                ? "Mock mode is enabled. Use usernames like `student01` or `teacher01` to simulate TU account types."
                : "API mode is enabled. `/auth/login` should validate credentials through your backend, not the browser."}
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-2xl">Login</CardTitle>
            <p className="text-sm text-slate-600">
              Enter your TU username and password to continue.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">TU Username</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    autoComplete="username"
                    className="pl-10"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="student or employee account"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="pl-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your TU password"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
