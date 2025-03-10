/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import * as THREE from "three";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Html,
  Sphere,
  Trail,
  useAnimations,
  useGLTF,
  useKeyboardControls,
} from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { RapierCollider, RapierRigidBody } from "@react-three/rapier";
import { useGameStore } from "../../stores/gameStore";
import { useGame, useJoystickControls } from "ecctrl";
import { useEnemyStore } from "../../stores/enemyStore";
import { useFrame } from "@react-three/fiber";
import { useSound } from "../../hooks/useSound";
// Helper function to get health bar color based on percentage
export function getHealthBarColor(current: number, max: number): string {
  const percentage = current / max;
  if (percentage > 0.6) return "#4CAFff"; // Green
  if (percentage > 0.3) return "#FFC107"; // Yellow/Orange
  return "#F44336"; // Red
}

type GLTFResult = GLTF & {
  nodes: {
    model_T: THREE.SkinnedMesh;
    mixamorigHips: THREE.Bone;
  };
  materials: {
    ["Body.003"]: THREE.MeshPhysicalMaterial;
  };
};

export const Hero = forwardRef<RapierRigidBody>(function (
  props: JSX.IntrinsicElements["group"],
  ref
) {
  const group = useRef<THREE.Group>(null);
  const { scene, nodes, materials } = useGLTF("/player.glb") as GLTFResult;
  const gameStore = useGameStore();
  const joystick = useJoystickControls();

  const [attack, setAttack] = useState(false);
  const { currentEnemy } = useGameStore();
  const { enemies } = useEnemyStore();
  const { playSound } = useSound();

  useEffect(() => {
    setAttack(joystick.curButton5Pressed);
  }, [joystick.curButton5Pressed]);

  const [sub] = useKeyboardControls();

  useEffect(() => {
    return sub(
      (state) => state.action1,
      (pressed) => {
        setAttack(pressed);
      }
    );
  }, []);

  useEffect(() => {
    if (!attack) return;
    playSound("attack");
    // Make sure ref exists and has a current property
    if (ref && typeof ref === "object" && "current" in ref && ref.current) {
      // Make sure enemy exists before accessing its position
      const playerPos = ref.current.translation();
      const enemy = enemies.find((enemy) => enemy.id === currentEnemy);
      const enemyPos = enemy?.position ?? new THREE.Vector3(0, 0, 0);
      // Create a proper Vector3 for the target position
      const targetPos = new THREE.Vector3(enemyPos.x, enemyPos.y, enemyPos.z);

      // Set the attack with proper position
      gameStore.setAttack({
        initial: new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z),
        target: targetPos,
      });
    }
  }, [attack]);

  // Get player stats for HP bar
  const { playerStats } = useGameStore();
  const { health, level, maxHealth, xp, xpNeeded } = playerStats;
  const height = useMemo(
    () => new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()).y,
    [scene]
  );
  return (
    <group ref={group} {...props} position={[0, -0.9, 0]} dispose={null}>
      {height && (
        <Html position={[0, height * 1.7, 0]} sprite center>
          <div className="pointer-events-none">
            {/* Simple RPG status bars */}
            <div className="flex items-center gap-1.5 p-0.5">
              {/* Level indicator */}
              <div className="flex items-center justify-center w-5 h-5 bg-[#2A2A2A] border-2 border-[#4A4A4A]  shadow-[2px_2px_0px_0px_#000000] outline outline-1 outline-black">
                <span className="text-[#7FE4FF] text-[10px] font-bold">
                  {level}
                </span>
              </div>

              {/* Bars container */}
              <div className="w-[80px]">
                {/* Health bar */}
                <div className="w-full h-2 bg-[#2A2A2A] border border-[#4A4A4A]  shadow-[2px_2px_0px_0px_#000000] outline outline-1 outline-black overflow-hidden mb-1">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(health / maxHealth) * 100}%`,
                      backgroundColor: "#7FE4FF",
                    }}
                  ></div>
                </div>

                {/* XP bar */}
                <div className="w-full h-1 bg-[#2A2A2A]  border-[#4A4A4A]  shadow-[2px_2px_0px_0px_#000000] outline outline-1 outline-black overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(xp / xpNeeded) * 100}%`,
                      backgroundColor: "#FFD700",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}

      <group name="Scene">
        <group name="Armature" rotation={[0.471, 0, 0]}>
          <skinnedMesh
            name="model_T"
            geometry={nodes.model_T.geometry}
            material={materials["Body.003"]}
            skeleton={nodes.model_T.skeleton}
          />
          <primitive object={nodes.mixamorigHips} />
        </group>
      </group>
    </group>
  );
});

useGLTF.preload("/player.glb");
