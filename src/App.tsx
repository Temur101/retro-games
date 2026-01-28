import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { SnakeGame } from "./pages/SnakeGame";
import { TetrisGame } from "./pages/TetrisGame";
import { supabase } from "./supabaseClient";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

function RequireAuth({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const location = useLocation();
  if (!session) return <Navigate to="/sign-in" replace state={{ from: location }} />;
  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userName = useMemo(() => {
    const u = session?.user;
    const fromMeta = (u?.user_metadata?.name as string | undefined)?.trim();
    return fromMeta || u?.email || "User";
  }, [session]);

  const isAuthPage = location.pathname === "/sign-in" || location.pathname === "/sign-up";

  // Пока Supabase не вернул сессию, не дёргаем редиректы (чтобы избежать мерцаний).
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4">
          <div className="text-sm text-slate-400">Loading…</div>
        </div>
      </div>
    );
  }

  // Если уже вошли — не показываем страницы входа/регистрации.
  if (session && isAuthPage) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Retro Games
          </Link>
          {session ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-200 shadow-sm hover:bg-emerald-500/20 sm:inline-flex"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>{userName}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/sign-in", { replace: true });
                }}
                className="rounded-lg border border-red-500/60 bg-red-600 px-3 py-1.5 text-sm font-medium text-slate-50 shadow-sm hover:bg-red-500"
              >
                Выйти
              </button>
            </div>
          ) : (
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/sign-in"
                className="rounded-lg px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
              >
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Sign up
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/"
            element={
              <RequireAuth session={session}>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/game/snake"
            element={
              <RequireAuth session={session}>
                <SnakeGame />
              </RequireAuth>
            }
          />
          <Route
            path="/game/tetris"
            element={
              <RequireAuth session={session}>
                <TetrisGame />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to={session ? "/" : "/sign-in"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

