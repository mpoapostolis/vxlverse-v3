import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useGameStore } from "../stores/gameStore";
import * as THREE from "three";
import { PivotControls } from "@react-three/drei";
import { useSound } from "../hooks/useSound";

import { SkeletonUtils } from "three-stdlib";

// same url multiple GLTF instances
function useGltfMemo(url: string) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  return { ...gltf, animations: [...gltf.animations], scene: scene };
}

interface GameObjectProps {
  modelUrl: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  isSelected: boolean;
  quests?: any[];
  thumbnail?: string;
  onClick?: () => void;
  onTransform?: (
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ) => void;
}

export function GameObject({
  modelUrl,
  position,
  rotation,
  scale,
  isSelected,
  quests,
  thumbnail,
  onClick,
  onTransform,
}: GameObjectProps) {
  const { scene } = useGltfMemo(modelUrl);
  const setActiveQuest = useGameStore((state) => state.setActiveQuest);
  const questLog = useGameStore((state) => state.questLog);
  const setActiveDialogue = useGameStore((state) => state.setActiveDialogue);
  const { playSound } = useSound();
  const isGameMode = window.location.pathname === "/game" || "/";
  const isEditor = window.location.pathname === "/editor";
  const groupRef = useRef<THREE.Group>(null);

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    onClick?.();

    if (isGameMode && quests?.[0]) {
      if (
        questLog?.active?.find((quest) => quest.id === quests[0].id)?.completed
      )
        return;
      playSound("npcGreeting");
      playSound("questAccept");
      setActiveQuest({ ...quests[0], thumbnail });
      setActiveDialogue(0);
    } else if (!isGameMode && onClick) {
      onClick();
    }
  };

  return (
    <group ref={groupRef}>
      {isSelected ? (
        <PivotControls
          scale={50}
          lineWidth={1.5}
          fixed
          activeAxes={[true, true, true]}
          depthTest={false}
          axisColors={["#ff2060", "#20df80", "#2080ff"]}
          anchor={[0, 0, 0]}
          matrix={new THREE.Matrix4().compose(
            position,
            new THREE.Quaternion().setFromEuler(rotation),
            scale
          )}
          onDrag={(matrix) => {
            if (!onTransform) return;

            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();

            matrix.decompose(position, quaternion, scale);
            const rotation = new THREE.Euler().setFromQuaternion(quaternion);

            onTransform(position, rotation, scale);
          }}
        >
          <primitive
            object={scene}
            onClick={handleClick}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "default";
            }}
          />
        </PivotControls>
      ) : (
        <group position={position} rotation={rotation} scale={scale}>
          <primitive
            object={scene}
            onClick={handleClick}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "default";
            }}
          />
        </group>
      )}
    </group>
  );
}
