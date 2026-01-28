import { GameCard } from "../shared/GameCard";

export function Home() {
  return (
    <section>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Retro Games</h1>
        <p className="mt-2 text-sm text-slate-400">
          Небольшая коллекция классических игр прямо в браузере.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GameCard
          title="Snake"
          description="Классическая змейка. Собирай еду и не врежься в стены."
          to="/game/snake"
          icon="🐍"
        />
        <GameCard
          title="Tetris"
          description="Складывай падающие фигуры в линии и набирай максимум очков."
          to="/game/tetris"
          icon="🧱"
        />
      </div>
    </section>
  );
}

