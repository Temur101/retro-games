import { useState } from "react";
import { LeaderboardModal } from "../features/leaderboard/LeaderboardModal";

const GAME_ID = "tetris";

export function TetrisGame() {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tetris</h1>
          <p className="mt-1 text-sm text-slate-400">
            Здесь будет игра Tetris. Пока доступен только лидерборд.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/80"
          >
            Лидерборд
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/50">
          <span className="text-3xl" aria-hidden="true">
            🧱
          </span>
        </div>
        <div>
          <p className="text-sm text-slate-300">
            Tetris game will be here. В следующем шаге сюда можно добавить поле и
            логику игры.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsLeaderboardOpen(true)}
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/80"
        >
          Показать топ-10 игроков
        </button>
      </div>

      <LeaderboardModal
        gameId={GAME_ID}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </section>
  );
}

