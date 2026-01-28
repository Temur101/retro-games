import { Link } from "react-router-dom";

type GameCardProps = {
  title: string;
  description?: string;
  to: string;
  icon?: React.ReactNode;
};

export function GameCard({ title, description, to, icon }: GameCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:bg-slate-900 hover:shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/70 to-lime-400/70 text-2xl text-slate-950">
          {icon ?? "🎮"}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      <span className="mt-auto text-xs font-medium text-emerald-400 opacity-80 group-hover:opacity-100">
        Открыть игру →
      </span>
    </Link>
  );
}

