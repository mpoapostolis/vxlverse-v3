import { useMemo, useRef, useEffect, useState } from "react";
import {
  useGLTF,
  useAnimations,
  Html,
  Billboard,
  Outlines,
  Box,
} from "@react-three/drei";
import { useGameStore } from "../../stores/gameStore";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import type { GameObject, Quest } from "../../types";

// same url multiple GLTF instances
function useGltfMemo(url: string) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => {
    const clonedScene = SkeletonUtils.clone(gltf.scene);

    // Make all meshes in the scene interactive
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.selectable = true;
        // Ensure the mesh has proper raycast behavior
        child.raycast = (raycaster, intersects) => {
          THREE.Mesh.prototype.raycast.call(child, raycaster, intersects);
        };
      }
    });

    return clonedScene;
  }, [gltf.scene]);

  const height = new THREE.Box3()
    .setFromObject(gltf.scene)
    .getSize(new THREE.Vector3()).y;

  return { ...gltf, animations: [...gltf.animations], scene: scene, height };
}

export function GameObject(props: GameObject & { thumbnail: string }) {
  useGLTF.preload(props.modelUrl);
  const gltf = useGltfMemo(props.modelUrl);
  const { actions } = useAnimations(gltf.animations, gltf.scene);
  const ref = useRef<THREE.Group>(null);
  const setActiveNpc = useGameStore((state) => state.setActiveNpc);

  // Check if this NPC has available quests

  useEffect(() => {
    if (props.animations?.idle) {
      actions[props.animations.idle]?.play();
    }
  }, [props.animations, actions]);

  const { position, rotation, scale } = useMemo(() => {
    return {
      position: new THREE.Vector3(
        props.position.x,
        props.position.y,
        props.position.z
      ),
      rotation: new THREE.Euler().copy(props.rotation),
      scale: new THREE.Vector3(props.scale.x, props.scale.y, props.scale.z),
    };
  }, [props.position, props.rotation, props.scale]);
  return (
    <>
      <primitive
        onClick={(e: THREE.Event) => {
          // @ts-ignore
          e.stopPropagation();

          if (props.type === "npc") {
            setActiveNpc(props.id);
          }
        }}
        ref={ref}
        scale={scale}
        position={position}
        rotation={rotation}
        object={gltf.scene}
      />

      {/* <Helper type={"axesHelper"} /> */}
      {/* Quest indicator */}
      {gltf.height && (
        <group scale={scale} rotation={rotation} position={position}>
          <Html distanceFactor={15} center position={[0, gltf.height * 1.1, 0]}>
            <div className="quest-indicator">
              <div className="exclamation-mark">!</div>
            </div>
          </Html>
        </group>
      )}
    </>
  );
}
