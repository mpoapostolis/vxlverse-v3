import { Suspense, useEffect } from "react";
import { Environment, Sky } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { GameObject } from "../GameObject";
import { Scene as SceneType } from "../../types";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Player } from "./Player";
import { useSound } from "../../hooks/useSound";
import { useEnemyStore } from "../../stores/enemyStore";
import { Enemy } from "./Enemy";
import { EnemyRewardModal } from "./EnemyReward";

interface SceneProps {
  sceneData?: SceneType;
  isPreview?: boolean;
}

export function Scene({ sceneData, isPreview }: SceneProps) {
  const { scene } = useThree();

  const { playSound } = useSound();

  useEffect(() => {
    playSound("background");
  }, [sceneData?.fog, scene]);

  if (!sceneData) return null;
  const enemies = useEnemyStore((state) => state.enemies);

  const startSpawning = useEnemyStore((state) => state.startSpawning);
  const stopSpawning = useEnemyStore((state) => state.stopSpawning);

  useEffect(() => {
    startSpawning();
    return () => stopSpawning();
  }, [startSpawning, stopSpawning]);

  return (
    <>
      {sceneData.environment && (
        <Environment
          preset={sceneData.environment as any}
          background={sceneData.background === "environment"}
        />
      )}

      <ambientLight intensity={sceneData.ambientLight || 0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      <Physics debug>
        {/* Ground */}
        <RigidBody type="fixed" colliders="trimesh">
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </RigidBody>

        {!isPreview && <Player />}
        {/* Spawn Enemies */}
        <Suspense fallback={null}>
          {enemies.map((enemy) => (
            <Enemy key={enemy.id} enemy={enemy} />
          ))}
        </Suspense>
        {/* Scene Objects */}
        {sceneData.objects.map((object) => (
          <GameObject
            key={object.id}
            modelUrl={object.modelUrl}
            position={object.position}
            rotation={object.rotation}
            scale={object.scale}
            isSelected={false}
            quests={object.quests}
            thumbnail={object.modelUrl
              .replace("scene_", "thumbnail_")
              .replace(".glb", ".webp")}
          />
        ))}
      </Physics>
    </>
  );
}
