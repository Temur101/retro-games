import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { LeaderboardModal } from "../features/leaderboard/LeaderboardModal";

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

function isSamePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(a: Direction, b: Direction) {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

function movePoint(p: Point, dir: Direction): Point {
  switch (dir) {
    case "up":
      return { x: p.x, y: p.y - 1 };
    case "down":
      return { x: p.x, y: p.y + 1 };
    case "left":
      return { x: p.x - 1, y: p.y };
    case "right":
      return { x: p.x + 1, y: p.y };
  }
}

function randomFoodPosition(cols: number, rows: number, snake: Point[]): Point {
  // Простая реализация: пытаемся несколько раз, затем fallback перебором.
  for (let i = 0; i < 200; i++) {
    const p = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    if (!snake.some((s) => isSamePoint(s, p))) return p;
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = { x, y };
      if (!snake.some((s) => isSamePoint(s, p))) return p;
    }
  }
  return { x: 0, y: 0 };
}

const GAME_ID = "snake";

export function SnakeGame() {
  const cellSize = 20;
  const cols = 20;
  const rows = 20;
  const tickMs = 110;

  const canvasSize = useMemo(
    () => ({ width: cols * cellSize, height: rows * cellSize }),
    [cols, rows, cellSize]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const snakeRef = useRef<Point[]>([]);
  const prevSnakeRef = useRef<Point[] | null>(null);
  const lastTickAtRef = useRef<number>(0);
  const directionRef = useRef<Direction>("right");
  const nextDirectionRef = useRef<Direction>("right");
  const foodRef = useRef<Point>({ x: 0, y: 0 });
  const gameOverRef = useRef<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        loadBestScore(data.user.id);
      }
    });
  }, []);

  async function loadBestScore(userId: string) {
    const { data, error } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", userId)
      .eq("game_id", GAME_ID)
      .maybeSingle();
    if (!error && data) setBestScore(data.score);
  }

  async function saveBestScore(newScore: number) {
    if (!user || newScore <= 0) return;
    const { data: existing, error } = await supabase
      .from("game_scores")
      .select("id, score")
      .eq("user_id", user.id)
      .eq("game_id", GAME_ID)
      .maybeSingle();

    if (!error && existing && existing.score >= newScore) {
      return;
    }

    const displayName =
      (user.user_metadata?.name as string | undefined)?.trim() || user.email || "User";

    await supabase.from("game_scores").upsert(
      {
        id: existing?.id,
        user_id: user.id,
        user_name: displayName,
        game_id: GAME_ID,
        score: newScore,
      },
      { onConflict: "id" }
    );
    setBestScore((prev) => (prev == null ? newScore : Math.max(prev, newScore)));
  }

  function resetGame() {
    const startSnake: Point[] = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    snakeRef.current = startSnake;
    prevSnakeRef.current = startSnake;
    directionRef.current = "right";
    nextDirectionRef.current = "right";
    foodRef.current = randomFoodPosition(cols, rows, startSnake);
    gameOverRef.current = false;
    lastTickAtRef.current = performance.now();
    setIsGameOver(false);
    setScore(0);
  }

  function stopLoop() {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startLoop() {
    stopLoop();
    intervalRef.current = window.setInterval(() => {
      tick();
    }, tickMs);
  }

  function stopRenderLoop() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function startRenderLoop() {
    stopRenderLoop();
    const frame = (now: number) => {
      draw(now);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }

  function endGame() {
    if (!gameOverRef.current) {
      void saveBestScore(scoreRef.current);
    }
    gameOverRef.current = true;
    setIsGameOver(true);
    stopLoop();
  }

  function tick() {
    if (gameOverRef.current) return;

    const snake = snakeRef.current;
    const nextDir = nextDirectionRef.current;

    // Применяем "следующее" направление только если оно не противоположно текущему.
    if (!isOppositeDirection(directionRef.current, nextDir)) {
      directionRef.current = nextDir;
    }

    const head = snake[0];
    const newHead = movePoint(head, directionRef.current);

    // Столкновение со стеной
    if (
      newHead.x < 0 ||
      newHead.x >= cols ||
      newHead.y < 0 ||
      newHead.y >= rows
    ) {
      endGame();
      return;
    }

    const ateFood = isSamePoint(newHead, foodRef.current);
    prevSnakeRef.current = snake;
    const nextSnake = [newHead, ...snake];
    if (!ateFood) nextSnake.pop();

    // Столкновение с собой (после движения)
    const body = nextSnake.slice(1);
    if (body.some((p) => isSamePoint(p, newHead))) {
      endGame();
      return;
    }

    snakeRef.current = nextSnake;
    lastTickAtRef.current = performance.now();

    if (ateFood) {
      setScore((s) => s + 1);
      foodRef.current = randomFoodPosition(cols, rows, nextSnake);
    }
  }

  function draw(now: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rr =
      "roundRect" in ctx
        ? (ctx.roundRect.bind(ctx) as (
            x: number,
            y: number,
            w: number,
            h: number,
            radii?: number | number[]
          ) => void)
        : (x: number, y: number, w: number, h: number) => ctx.rect(x, y, w, h);

    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#020617"; // slate-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)"; // slate-400
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, rows * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(cols * cellSize, y * cellSize + 0.5);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    ctx.fillStyle = "#f59e0b"; // amber-500
    ctx.beginPath();
    rr(
      food.x * cellSize + 3,
      food.y * cellSize + 3,
      cellSize - 6,
      cellSize - 6,
      6
    );
    ctx.fill();

    // Snake
    const snake = snakeRef.current;
    const prevSnake = prevSnakeRef.current;
    const t = Math.max(0, Math.min(1, (now - lastTickAtRef.current) / tickMs));
    for (let i = 0; i < snake.length; i++) {
      const cur = snake[i];
      const prev = prevSnake?.[i] ?? cur;
      const x = prev.x + (cur.x - prev.x) * t;
      const y = prev.y + (cur.y - prev.y) * t;
      const isHead = i === 0;
      // Head is slightly brighter to stand out from the body.
      ctx.fillStyle = isHead ? "#6ee7b7" : "#10b981"; // emerald
      ctx.beginPath();
      rr(
        x * cellSize + 2,
        y * cellSize + 2,
        cellSize - 4,
        cellSize - 4,
        isHead ? 7 : 6
      );
      ctx.fill();

      if (isHead) {
        // Simple eyes oriented by current direction.
        const dir = directionRef.current;
        const left = x * cellSize;
        const top = y * cellSize;
        const midX = left + cellSize / 2;
        const midY = top + cellSize / 2;

        const eyeOffsetA = 5;
        const eyeOffsetB = 3;
        let e1: Point;
        let e2: Point;

        if (dir === "left" || dir === "right") {
          // Horizontal movement: eyes are above/below the centerline.
          const forward = dir === "right" ? 5 : -5;
          e1 = { x: midX + forward, y: midY - eyeOffsetA };
          e2 = { x: midX + forward, y: midY + eyeOffsetA };
        } else {
          // Vertical movement: eyes are left/right of the centerline.
          const forward = dir === "down" ? 5 : -5;
          e1 = { x: midX - eyeOffsetA, y: midY + forward };
          e2 = { x: midX + eyeOffsetA, y: midY + forward };
        }

        const whiteR = 2.6;
        const pupilR = 1.3;

        // whites
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // slate-900 tint for outline contrast
        ctx.beginPath();
        ctx.arc(e1.x, e1.y, whiteR + 0.6, 0, Math.PI * 2);
        ctx.arc(e2.x, e2.y, whiteR + 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f8fafc"; // slate-50
        ctx.beginPath();
        ctx.arc(e1.x, e1.y, whiteR, 0, Math.PI * 2);
        ctx.arc(e2.x, e2.y, whiteR, 0, Math.PI * 2);
        ctx.fill();

        // pupils (slightly forward)
        ctx.fillStyle = "#0f172a"; // slate-900
        const px =
          dir === "left" ? -eyeOffsetB : dir === "right" ? eyeOffsetB : 0;
        const py = dir === "up" ? -eyeOffsetB : dir === "down" ? eyeOffsetB : 0;

        ctx.beginPath();
        ctx.arc(e1.x + px, e1.y + py, pupilR, 0, Math.PI * 2);
        ctx.arc(e2.x + px, e2.y + py, pupilR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Overlay: game over
    if (gameOverRef.current) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fafc"; // slate-50
      ctx.font = "600 22px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 6);
      ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("Press Restart", canvas.width / 2, canvas.height / 2 + 18);
    }
  }

  useEffect(() => {
    resetGame();
    startLoop();
    startRenderLoop();

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          nextDirectionRef.current = "up";
          break;
        case "ArrowDown":
          e.preventDefault();
          nextDirectionRef.current = "down";
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextDirectionRef.current = "left";
          break;
        case "ArrowRight":
          e.preventDefault();
          nextDirectionRef.current = "right";
          break;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      if (e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 24;
      if (Math.max(absX, absY) < threshold) return;

      if (absX > absY) nextDirectionRef.current = dx > 0 ? "right" : "left";
      else nextDirectionRef.current = dy > 0 ? "down" : "up";
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      stopLoop();
      stopRenderLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Snake</h1>
          <p className="mt-1 text-sm text-slate-400">
            Управление: стрелки клавиатуры. Ешь еду, не врезайся в стены и себя.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm">
            <span className="text-slate-400">Score:</span>{" "}
            <span className="font-semibold text-slate-50">{score}</span>
          </div>
          {bestScore != null && (
            <div className="hidden rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 sm:block">
              Лучший: {bestScore}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              resetGame();
              startLoop();
            }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/80"
          >
            Лидерборд
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 shadow-sm">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="block touch-none rounded-xl"
          />
        </div>

        {isGameOver && (
          <div className="text-sm text-slate-300">
            Игра окончена. Нажмите <span className="font-semibold">Restart</span>
            .
          </div>
        )}
      </div>

      <LeaderboardModal
        gameId={GAME_ID}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </section>
  );
}

