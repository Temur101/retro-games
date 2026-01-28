import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

type LeaderboardEntry = {
  id: string;
  user_name: string | null;
  score: number;
};

type LeaderboardModalProps = {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function LeaderboardModal({ gameId, isOpen, onClose }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("game_scores")
        .select("id, user_name, score")
        .eq("game_id", gameId)
        .order("score", { ascending: false })
        .limit(10);
      if (!cancelled) {
        if (error) {
          console.error("Failed to load leaderboard", error);
          setEntries([]);
        } else {
          setEntries(data ?? []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-50">
            Лидерборд
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Закрыть
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-slate-400">
            Загружаем результаты…
          </div>
        ) : entries.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">
            Пока нет результатов для этой игры.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Место</th>
                  <th className="px-3 py-2">Игрок</th>
                  <th className="px-3 py-2 text-right">Счёт</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={index === 0 ? "bg-emerald-500/10" : "odd:bg-slate-900/40"}
                  >
                    <td className="px-3 py-2 text-slate-300">{index + 1}</td>
                    <td className="px-3 py-2 text-slate-100">
                      {entry.user_name || "Без имени"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-50">
                      {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

