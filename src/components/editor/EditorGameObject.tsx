import { useMemo, useRef, useState, useEffect } from "react";
import {
  useGLTF,
  TransformControls,
  useAnimations,
  Helper,
  Box,
  useHelper,
  Gltf,
} from "@react-three/drei";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";
import { useEditorStore } from "../../stores/editorStore";
import { toast } from "../UI/Toast";
import { useSound } from "../../hooks/useSound";

/**
 * Custom hook to load and clone a GLTF model.
 * Centers individual mesh geometries and the overall scene pivot.
 */
function useGltfMemo(url: string) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => {
    const clonedScene = SkeletonUtils.clone(gltf.scene);

    // Make meshes selectable but don't modify their geometry
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.selectable = true;
        // Ensure proper raycast behavior
        child.raycast = (raycaster, intersects) => {
          THREE.Mesh.prototype.raycast.call(child, raycaster, intersects);
        };
      }
    });

    return clonedScene;
  }, [gltf.scene]);

  return { ...gltf, animations: [...gltf.animations], scene: scene };
}

interface EditorGameObjectProps {
  id: string;
  modelUrl: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  isSelected: boolean;
  type?: "prop" | "npc" | "enemy" | "item" | "portal" | "trigger";
  thumbnail?: string;
  onClick?: (e: THREE.Event) => void;
  transformMode?: "translate" | "rotate" | "scale";
  onTransform?: (
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ) => void;
}

/**
 * EditorGameObject represents a 3D model object within an editor.
 * It supports selection, transformation, grid snapping, and animations.
 */
export function EditorGameObject({
  id,
  modelUrl,
  position,
  rotation,
  scale,
  isSelected,
  transformMode,
  onClick,
  onTransform,
}: EditorGameObjectProps) {
  // Load and memoize the GLTF scene and animations.
  const { scene, animations } = useGltfMemo(modelUrl);
  const { playSound } = useSound();

  // Refs for grouping and object manipulation.
  const groupRef = useRef<THREE.Group>(null);
  const objectRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Local state for dragging and animation handling.
  const [isDragging, setIsDragging] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);

  // Editor store state.
  const gridSnap = useEditorStore((state) => state.gridSnap);
  const setIsTransforming = useEditorStore((state) => state.setIsTransforming);
  const currentSceneId = useEditorStore((state) => state.currentSceneId);
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
  const scenes = useEditorStore((state) => state.scenes);
  const brushActive = useEditorStore((state) => state.brushActive);
  const placeObjectWithBrush = useEditorStore(
    (state) => state.placeObjectWithBrush
  );

  const currentScene = scenes.find((scene) => scene.id === currentSceneId);
  const selectedObject = currentScene?.objects.find(
    (obj) => obj.id === selectedObjectId
  );

  // Setup animations only if they exist
  const { actions, mixer } = useAnimations(
    animations.length > 0 ? animations : [],
    scene
  );

  // Update the object's transform when props change.
  useEffect(() => {
    if (objectRef.current) {
      objectRef.current.position.copy(position);
      objectRef.current.rotation.copy(rotation);
      objectRef.current.scale.copy(scale);
    }
  }, [position, rotation, scale]);

  // Handle playing and stopping animations based on selection.
  useEffect(() => {
    // Skip animation handling if there are no animations
    if (!actions || !mixer || Object.keys(actions).length === 0) return;

    if (isSelected && selectedObject?.activeAnimation) {
      const animationName = selectedObject.activeAnimation;

      if (actions[animationName]) {
        try {
          // Stop current animation if playing
          if (currentAnimation && actions[currentAnimation]) {
            actions[currentAnimation].stop();
          }

          // Play the new animation
          actions[animationName].reset();
          actions[animationName].play();

          setCurrentAnimation(animationName);
        } catch (error) {
          console.error("Error playing animation:", error);
          setCurrentAnimation(null);
        }
      } else {
        console.warn(`Animation "${animationName}" not found in model`);
      }
    } else if (currentAnimation && actions[currentAnimation]) {
      try {
        actions[currentAnimation].stop();
        setCurrentAnimation(null);
      } catch (error) {
        console.error("Error stopping animation:", error);
        setCurrentAnimation(null);
      }
    }

    // Make sure the animation mixer updates
    return () => {
      if (mixer) mixer.update(0);
    };
  }, [actions, mixer, isSelected, selectedObject?.activeAnimation]);

  // Drag start and end handlers.
  const handleDragStart = () => {
    setIsDragging(true);
    setIsTransforming(true);
  };

  const handleDragEnd = () => {
    if (!objectRef.current || !onTransform) return;
    const newPosition = objectRef.current.position.clone();
    const newRotation = objectRef.current.rotation.clone();
    const newScale = objectRef.current.scale.clone();
    onTransform(newPosition, newRotation, newScale);
    setIsDragging(false);
    setIsTransforming(false);
  };

  /**
   * Snap the object's transformation to a grid.
   * Provides visual feedback during transformation.
   */
  const handleObjectChange = () => {
    if (!objectRef.current || !gridSnap) return;

    // Apply grid snapping if enabled
    if (gridSnap) {
      // Snap position to grid (0.5 unit grid to match EditorScene)
      objectRef.current.position.x =
        Math.round(objectRef.current.position.x * 2) / 2;
      objectRef.current.position.y =
        Math.round(objectRef.current.position.y * 2) / 2;
      objectRef.current.position.z =
        Math.round(objectRef.current.position.z * 2) / 2;

      // Snap rotation to 45-degree increments
      objectRef.current.rotation.x =
        Math.round(objectRef.current.rotation.x / (Math.PI / 4)) *
        (Math.PI / 4);
      objectRef.current.rotation.y =
        Math.round(objectRef.current.rotation.y / (Math.PI / 4)) *
        (Math.PI / 4);
      objectRef.current.rotation.z =
        Math.round(objectRef.current.rotation.z / (Math.PI / 4)) *
        (Math.PI / 4);

      // Snap scale to 0.25 increments
      objectRef.current.scale.x = Math.round(objectRef.current.scale.x * 4) / 4;
      objectRef.current.scale.y = Math.round(objectRef.current.scale.y * 4) / 4;
      objectRef.current.scale.z = Math.round(objectRef.current.scale.z * 4) / 4;
    }
  };
  // useHelper(isSelected && objectRef, THREE.BoxHelper, 0xffff00);
  return (
    <group key={id}>
      <group
        key={id}
        ref={objectRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onDoubleClick={(e) => {
          if (!brushActive) e.stopPropagation();
          document.body.style.cursor = "pointer";
          if (onClick && !brushActive) onClick(e);
        }}
        onPointerOver={() => {
          document.body.style.cursor = brushActive ? "crosshair" : "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <primitive object={scene} />
      </group>

      {isSelected && (
        <TransformControls
          object={objectRef}
          onObjectChange={handleObjectChange}
          mode={transformMode}
          size={0.7}
          showX
          showY
          showZ
          camera={camera}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        />
      )}
    </group>
  );
}
