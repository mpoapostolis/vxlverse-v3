import { Canvas } from "@react-three/fiber";
import { Scene } from "../components/Scene";
import { ScenePanel } from "../components/editor/ScenePanel";
import { PropertiesPanel } from "../components/editor/PropertiesPanel";
import { Loader, OrbitControls } from "@react-three/drei";
import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import * as THREE from "three";

export function Editor() {
  const { scenes, addScene } = useEditorStore();

  useEffect(() => {
    if (scenes.length === 0) {
      const defaultScene = {
        id: new THREE.Object3D().uuid,
        name: "Main Scene",
        objects: [],
      };
      addScene(defaultScene);
    }
  }, [scenes.length, addScene]);

  return (
    <div className="flex w-full h-screen bg-slate-900">
      <ScenePanel />

      <div className="relative flex-1">
        <Canvas
          shadows
          gl={{ preserveDrawingBuffer: true }}
          camera={{ position: [5, 5, 5], fov: 50 }}
          className="w-full h-full"
        >
          <Scene />
          <OrbitControls makeDefault />
        </Canvas>
        <Loader />
        <PropertiesPanel />
      </div>
    </div>
  );
}
