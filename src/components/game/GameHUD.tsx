import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { useEnemyStore } from "../../stores/enemyStore";
import { cn } from "../../lib/utils";

interface GameHUDProps {
  onOpenInventory?: () => void;
  onOpenQuestLog?: () => void;
  onOpenMap?: () => void;
  onOpenCharacterSheet?: () => void;
}

// Minimal progress bar with translucent styling
interface ProgressBarProps {
  label: string;
  icon: React.ReactNode;
  current: number;
  max: number;
  lowPulse?: boolean;
  fromColor?: string;
  toColor?: string;
}

// A minimal progress bar with translucent styling and small text.
function ProgressBar({
  label,
  icon,
  current,
  max,
  lowPulse,
  fromColor = "from-red-700",
  toColor = "to-red-500",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="relative w-full h-3 rounded-full overflow-hidden bg-black/30">
      <div
        className={cn(
          "absolute left-0 top-0 h-full bg-gradient-to-r",
          fromColor,
          toColor,
          lowPulse && "animate-pulse"
        )}
        style={{ width: `${pct}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-white font-semibold">
        <span className="flex items-center space-x-1">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span>
          {Math.floor(current)}/{max}
        </span>
      </div>
    </div>
  );
}

export function GameHUD({
  onOpenInventory,
  onOpenQuestLog,
  onOpenMap,
  onOpenCharacterSheet,
}: GameHUDProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Responsive
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 640);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Game store data
  const { health, maxHealth, energy, maxEnergy, xp, xpNeeded, level, money } =
    useGameStore((s) => s.playerStats);
  const activeQuest = useGameStore((s) => s.activeQuest);
  const inventory = useGameStore((s) => s.inventory);
  const gameTime = useGameStore((s) => s.gameTime);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const showLevelUp = useGameStore((s) => s.showLevelUp);
  const setShowLevelUp = useGameStore((s) => s.setShowLevelUp);

  const inventoryCount = inventory.length;

  // Basic time formatting
  const formattedTime = `${String(gameTime.hours).padStart(2, "0")}:${String(
    gameTime.minutes
  ).padStart(2, "0")}`;

  // Low thresholds
  const healthLow = health <= maxHealth * 0.2;
  const energyLow = energy <= maxEnergy * 0.2;
  const xpPct = (xp / xpNeeded) * 100;

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col text-white">
      {/* LEVEL-UP POPUP */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 rounded-lg px-5 py-6 border border-yellow-500 shadow-2xl pointer-events-auto max-w-xs w-[90%]"
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-2xl font-bold mb-2">Level Up!</h2>
              <p className="text-lg mb-4">
                You are now level{" "}
                <span className="text-yellow-300 font-extrabold">{level}</span>
              </p>
              <div className="bg-white/10 p-3 rounded-md mb-4">
                <p className="font-medium mb-1 text-sm">Stats increased:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="mr-1">❤️</span> +20
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">⚡</span> +10
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">⚔️</span> +5
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">🛡️</span> +3
                  </div>
                </div>
              </div>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-6 py-2 rounded-md shadow-md pointer-events-auto"
                onClick={() => setShowLevelUp(false)}
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className="pointer-events-auto bg-black/50 border-b border-gray-700 shadow-sm flex items-center justify-between px-4 py-2">
        {/* Left: Time & Day */}
        <div className="flex items-center space-x-2 text-sm font-semibold">
          <span className="text-base">
            {timeOfDay === "morning" && "🌅"}
            {timeOfDay === "noon" && "☀️"}
            {timeOfDay === "evening" && "🌆"}
            {timeOfDay === "night" && "🌙"}
          </span>
          <span>
            {formattedTime} | Day {gameTime.day}
          </span>
        </div>
        {/* Right: Level & Money */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-yellow-300 flex items-center justify-center text-black text-sm sm:text-base font-extrabold shadow-sm">
            {level}
          </div>
          <div className="flex items-center bg-white/10 rounded-full px-2 py-1 text-sm">
            <span className="mr-1 text-yellow-300">💰</span>
            <span className="font-bold">{money}</span>
          </div>
        </div>
      </div>

      {/* RESOURCE BARS (Health, Energy, XP) */}
      <div className="grid md:grid-cols-1 max-w-96  gap-1 grid-cols-3 mt-2 px-2">
        <ProgressBar
          label="HP"
          icon="❤️"
          current={health}
          max={maxHealth}
          lowPulse={healthLow}
          fromColor="from-red-700"
          toColor="to-red-500"
        />
        <ProgressBar
          label="EN"
          icon="⚡"
          current={energy}
          max={maxEnergy}
          lowPulse={energyLow}
          fromColor="from-blue-700"
          toColor="to-blue-500"
        />
        <ProgressBar
          label="XP"
          icon="✨"
          current={xp}
          max={xpNeeded}
          lowPulse={xpPct >= 90}
          fromColor="from-purple-700"
          toColor="to-indigo-500"
        />
      </div>

      {/* Spacer to allow the center area for the 3D model */}
      <div className="flex-1" />

      {/* BOTTOM BAR */}
      <div className="pointer-events-auto    flex justify-end py-2">
        <div className="flex items-center space-x-3">
          {/* Inventory */}
          <button
            onClick={onOpenInventory}
            className="relative w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-xl flex items-center justify-center transition transform hover:scale-105 shadow-sm"
          >
            🎒
            {inventoryCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center border border-red-400 shadow-sm">
                {inventoryCount}
              </span>
            )}
          </button>

          {/* Quest Log */}
          <button
            onClick={onOpenQuestLog}
            className="relative w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-xl flex items-center justify-center transition transform hover:scale-105 shadow-sm"
          >
            📜
            {activeQuest && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center border border-yellow-400 shadow-sm animate-pulse">
                !
              </span>
            )}
          </button>

          {/* Map */}
          <button
            onClick={onOpenMap}
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-xl flex items-center justify-center transition transform hover:scale-105 shadow-sm"
          >
            🗺️
          </button>
        </div>
      </div>
    </div>
  );
}
