import { Suspense, useEffect } from "react";
import { Environment, Stars } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { GameObject } from "./GameObject";
import { Scene as SceneType } from "../../types";
import { useThree } from "@react-three/fiber";
import { Player } from "./Player";
import { useSound } from "../../hooks/useSound";
import { useEnemyStore } from "../../stores/enemyStore";
import { Enemy } from "./Enemy";
import { Fireball } from "./FireBall";
import { useParams } from "react-router-dom";

interface SceneProps {
  sceneData?: SceneType;
  isPreview?: boolean;
}

function Floor() {
  return (
    <group>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </RigidBody>
    </group>
  );
}

export function GameScene({ sceneData }: SceneProps) {
  const { scene } = useThree();
  const { playSound, stopSound } = useSound();
  const enemies = useEnemyStore((state) => state.enemies);
  const startSpawning = useEnemyStore((state) => state.startSpawning);
  const stopSpawning = useEnemyStore((state) => state.stopSpawning);
  const { debug: isPreview } = useParams<{ debug: string }>();
  useEffect(() => {
    stopSound("background");
    playSound("background");
  }, [scene, playSound, stopSound]);

  useEffect(() => {
    if (!sceneData?.farmZone?.enabled) return;
    startSpawning();
    return () => stopSpawning();
  }, [startSpawning, stopSpawning, sceneData?.farmZone?.enabled]);

  if (!sceneData) return null;

  return (
    <>
      {sceneData.environment && (
        <Environment
          preset={sceneData.environment as any}
          background={sceneData.background === "environment"}
        />
      )}
      <gridHelper args={[100, 100]} position={[0, 0.1, 0]}>
        <meshBasicMaterial color="#1a1a1a" side={2} attach="material" />
      </gridHelper>

      <ambientLight intensity={sceneData.ambientLight || 0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Stars />
      <Physics debug={true}>
        <Floor />
        <Fireball />

        <Player />
        {/* Spawn Enemies */}
        <Suspense fallback={null}>
          {enemies.map((enemy, idx) => (
            <Enemy key={enemy.id + idx} enemy={enemy} />
          ))}
        </Suspense>
        {/* Scene Objects */}
        {sceneData.objects.map((object) => (
          <GameObject key={object.id} {...object} />
        ))}
      </Physics>
    </>
  );
}
