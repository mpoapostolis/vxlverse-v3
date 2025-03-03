import { useEditorStore } from "../stores/editorStore";
import { useGameStore } from "../stores/gameStore";
import { GameHUD } from "../components/game/GameHUD";
import { QuestLog } from "../components/game/QuestLog";
import { Inventory } from "../components/game/Inventory";
import { DialogueModal } from "../components/game/DialogueModal";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useEnemyStore } from "../stores/enemyStore";
import { EnemyRewardModal } from "../components/game/EnemyReward";
import { LevelUpModal } from "../components/game/LevelUpModal";
import { useParams } from "react-router-dom";
import { GameScene } from "../components/game/Scene";
import { Joystick } from "../components/game/Joystick";
import { useGame } from "../hooks/useGame";

export function Game() {
  const { id } = useParams<{ id: string }>();
  const { isLoading } = useGame(id!);
  useGame(id!);

  // Game state management
  const gameState = useGameStore((state) => ({
    currentSceneId: state.currentSceneId,
    setCurrentSceneId: state.setCurrentSceneId,
    showLevelUp: state.showLevelUp,
    inventoryOpen: state.inventoryOpen,
    questLogOpen: state.questLogOpen,
    timeOfDay: state.timeOfDay,
  }));
  // Editor state for scene data
  const scenes = useEditorStore((state) => state.scenes);
  const currentScene =
    scenes.find((scene) => scene.id === gameState.currentSceneId) ?? scenes[0];

  // Enemy rewards state
  const { rewards, clearRewards } = useEnemyStore((state) => ({
    rewards: state.rewards,
    clearRewards: state.clearRewards,
  }));

  // Local UI state
  const [showSceneName, setShowSceneName] = useState(false);

  // Set the current scene ID when the route parameter changes
  useEffect(() => {
    if (id) {
      gameState.setCurrentSceneId(id);
    }
  }, [id, gameState.setCurrentSceneId]);

  useEffect(() => {
    setShowSceneName(true);
    const timeout = setTimeout(() => {
      setShowSceneName(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [gameState.currentSceneId]);

  const getSunPosition = () => {
    switch (gameState.timeOfDay) {
      case "morning":
        return [-1, 0.5, 2];
      case "noon":
        return [0, 1, 0];
      case "evening":
        return [1, 0.5, -2];
      case "night":
        return [0, -1, 0];
      default:
        return [0, 1, 0];
    }
  };

  return (
    <div className="w-full h-screen relative select-none">
      <div key={gameState.currentSceneId} className="w-full h-full">
        {/* 3D Scene */}

        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <Suspense fallback={null}>
            <GameScene sceneData={currentScene} />
            <Sky sunPosition={getSunPosition() as [number, number, number]} />
          </Suspense>
        </Canvas>

        {/* Scene Name Indicator */}
        <AnimatePresence>
          {showSceneName && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm px-6 py-2 ">
                <h2 className="text-xl font-bold text-white">
                  {currentScene?.name}
                </h2>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Game UI */}
      <GameHUD />
      <Joystick />

      {/* Modals */}
      {gameState.inventoryOpen && <Inventory />}
      {gameState.questLogOpen && <QuestLog />}
      <DialogueModal />
      {/* Reward Modal */}
      {rewards && !gameState.showLevelUp && (
        <EnemyRewardModal rewards={rewards} onClose={clearRewards} />
      )}

      {gameState.showLevelUp && <LevelUpModal />}
    </div>
  );
}
