import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as THREE from "three";
import { Scene, GameObject } from "../types";
import { toast } from "../components/UI/Toast";

const DEFAULT_SCENES = [] as Scene[];

// Helper function to create a new scene with default values
const createDefaultScene = (name: string, id: string): Scene => ({
  id,
  name,
  showGrid: true,
  gridSize: 1,
  snapPrecision: 0.1,
  objects: [],
  environment: "sunset",
  background: "environment",
  ambientLight: 0.5,
  fog: {
    color: "#000000",
    near: 1,
    far: 100,
  },
  clouds: {
    enabled: false,
    speed: 1,
    opacity: 0.5,
    count: 20,
  },
  stars: {
    enabled: false,
    count: 5000,
    depth: 50,
    fade: true,
  },
});

export interface EditorState {
  scenes: Scene[];
  currentSceneId: string | null;
  selectedObjectId: string | null;
  showModelSelector: boolean;
  editingSceneName: string | null;
  brushActive: boolean;
  brushTemplate: GameObject | null;
  brushSize: number;
  gridSnap: boolean;
  showGrid: boolean;
  gridSize: number;
  snapPrecision: number;
  isTransforming: boolean;
  focusOnObject: boolean;

  addScene: (scene: Scene) => void;
  removeScene: (id: string) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  setCurrentScene: (id: string) => void;
  addObject: (sceneId: string, object: GameObject) => void;
  updateObject: (
    sceneId: string,
    objectId: string,
    updates: Partial<GameObject>
  ) => void;
  setBrushActive: (active: boolean) => void;
  removeObject: (sceneId: string, objectId: string) => void;
  duplicateObject: (sceneId: string, objectId: string) => void;
  setSelectedObject: (id: string | null) => void;
  setShowModelSelector: (show: boolean) => void;
  setEditingSceneName: (id: string | null) => void;
  updateSceneName: (id: string, name: string) => void;
  toggleBrushMode: (active: boolean) => void;
  setBrushTemplate: (object: GameObject | null) => void;
  setBrushSize: (size: number) => void;
  placeObjectWithBrush: (
    sceneId: string,
    position: THREE.Vector3 | { x: number; y: number; z: number }
  ) => void;
  toggleGridSnap: () => void;
  setGridSnap: (enabled: boolean) => void;
  toggleGrid: () => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapPrecision: (precision: number) => void;
  createNewScene: (name: string) => void;
  setIsTransforming: (isTransforming: boolean) => void;
  setFocusOnObject: (focus: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      scenes: DEFAULT_SCENES,
      currentSceneId: null as string | null,
      selectedObjectId: null as string | null,
      showModelSelector: false,
      editingSceneName: null as string | null,
      brushActive: false,
      brushTemplate: null as GameObject | null,
      brushSize: 1,
      gridSnap: true,
      showGrid: true,
      gridSize: 1,
      snapPrecision: 0.1,
      isTransforming: false,
      focusOnObject: false,

      addScene: (scene) => {
        set((state) => {
          const exists = state.scenes.some((s) => s.id === scene.id);
          if (!exists) {
            return {
              brushActive: false,
              brushTemplate: null,
              scenes: [...state.scenes, scene],
              currentSceneId: scene.id,
            };
          }
          return state;
        });
        toast.success(`Scene added: ${scene.name}`);
      },
      setBrushActive: (active: boolean) => set(() => ({ brushActive: active })),
      removeScene: (id) =>
        set((state) => {
          const newScenes = state.scenes.filter((s) => s.id !== id);

          return {
            brushActive: false,
            brushTemplate: null,
            scenes: newScenes,
            currentSceneId: null,
            selectedObjectId: null,
          };
        }),
      updateScene: (id, updates) =>
        set((state) => ({
          scenes: state.scenes.map((scene) =>
            scene.id === id ? { ...scene, ...updates } : scene
          ),
        })),
      setCurrentScene: (id) => set({ currentSceneId: id }),
      addObject: (sceneId, object) =>
        set((state) => ({
          scenes: state.scenes.map((scene) =>
            scene.id === sceneId
              ? { ...scene, objects: [...scene.objects, object] }
              : scene
          ),
          selectedObjectId: object.id,
        })),
      updateObject: (sceneId, objectId, updates) =>
        set((state) => ({
          scenes: state.scenes.map((scene) =>
            scene.id === sceneId
              ? {
                  ...scene,
                  objects: scene.objects.map((obj) =>
                    obj.id === objectId ? { ...obj, ...updates } : obj
                  ),
                }
              : scene
          ),
        })),
      removeObject: (sceneId, objectId) =>
        set((state) => ({
          brushActive: false,
          brushTemplate: null,
          scenes: state.scenes.map((scene) =>
            scene.id === sceneId
              ? {
                  ...scene,
                  objects: scene.objects.filter((obj) => obj.id !== objectId),
                }
              : scene
          ),
          selectedObjectId:
            state.selectedObjectId === objectId ? null : state.selectedObjectId,
        })),
      duplicateObject: (sceneId, objectId) =>
        set((state) => {
          const scene = state.scenes.find((s) => s.id === sceneId);
          if (!scene) return state;

          const object = scene.objects.find((obj) => obj.id === objectId);
          if (!object) return state;

          // Deep clone the object
          const newObject = JSON.parse(JSON.stringify(object));

          // Generate a new ID
          newObject.id = new THREE.Object3D().uuid;

          // Offset the position slightly (0.5 units in x and z)
          if (newObject.position) {
            newObject.position.x += 0.5;
            newObject.position.z += 0.5;
          }

          return {
            brushActive: false,
            brushTemplate: null,
            scenes: state.scenes.map((s) =>
              s.id === sceneId
                ? { ...s, objects: [...s.objects, newObject] }
                : s
            ),
            selectedObjectId: newObject.id,
          };
        }),
      setSelectedObject: (id) =>
        set({
          selectedObjectId: id,
        }),
      setShowModelSelector: (show) => set({ showModelSelector: show }),
      setEditingSceneName: (id) => set({ editingSceneName: id }),
      updateSceneName: (id, name) =>
        set((state) => ({
          scenes: state.scenes.map((scene) =>
            scene.id === id ? { ...scene, name } : scene
          ),
          editingSceneName: null,
        })),
      toggleBrushMode: (active) => {
        const selectedId = get().selectedObjectId;
        const currentObject = get()
          .scenes.find((s) => s.id === selectedId)
          ?.objects.find((o) => o.id === selectedId);
        set((state) => ({
          brushActive: active,
          // When turning off brush mode, clear the brush template
          brushTemplate: active ? currentObject : null,
        }));
      },
      setBrushTemplate: (object) => {
        set({
          brushTemplate: object,
        });
      },
      setBrushSize: (size) =>
        set(() => ({
          brushSize: Math.max(1, size),
        })),
      placeObjectWithBrush: (sceneId, position) => {
        const object = get()
          .scenes.find((s) => s.id === sceneId)
          ?.objects.find((o) => o.id === get().selectedObjectId);
        if (!object) return;
        const obj = new THREE.Object3D();
        // Create a new object based on the brush template
        const newObject = {
          id: new THREE.Object3D().uuid,
          name: object.name,
          modelUrl: object.modelUrl,
          position: {
            // Handle both Vector3 and regular position objects
            x: position.x !== undefined ? position.x : 0,
            y: position.y !== undefined ? position.y : 0,
            z: position.z !== undefined ? position.z : 0,
          },
          rotation: object?.rotation ?? { x: 0, y: 0, z: 0 },
          scale: object?.scale ?? { x: 1, y: 1, z: 1 },
        };

        // Add the object to the scene
        get().addObject(sceneId, newObject);

        // Force a state update to trigger a re-render
        set((state) => ({ ...state }));
      },
      toggleGridSnap: () => {
        const newState = !get().gridSnap;
        set({ gridSnap: newState });
        toast.info(`Grid snap ${newState ? "enabled" : "disabled"}`);
      },
      setGridSnap: (enabled) => set({ gridSnap: enabled }),
      toggleGrid: () => {
        const newState = !get().showGrid;
        set({ showGrid: newState });
        toast.info(`Grid ${newState ? "visible" : "hidden"}`);
      },
      setShowGrid: (show) => set({ showGrid: show }),
      setGridSize: (size) => {
        const currentSceneId = get().currentSceneId;
        if (currentSceneId) {
          get().updateScene(currentSceneId, { gridSize: size });
          toast.info(`Grid size set to ${size}`);
        }
      },
      setSnapPrecision: (precision) => {
        const currentSceneId = get().currentSceneId;
        if (currentSceneId) {
          get().updateScene(currentSceneId, { snapPrecision: precision });
          toast.info(`Snap precision set to ${precision}`);
        }
      },
      createNewScene: (name) => {
        const id = crypto.randomUUID();
        const newScene = createDefaultScene(name, id);
        set((state) => ({
          brushActive: false,
          brushTemplate: null,
          scenes: [...state.scenes, newScene],
          currentSceneId: id,
        }));
        toast.success(`Scene created: ${name}`);
      },
      setIsTransforming: (isTransforming) => set({ isTransforming }),
      setFocusOnObject: (focus) => set({ focusOnObject: focus }),
    }),
    {
      name: "editor-storage",
      partialize: (state) => ({
        scenes: state.scenes.map((scene) => ({
          ...scene,
          objects: scene.objects.map((obj) => ({
            ...obj,
            position: {
              x: obj.position.x,
              y: obj.position.y,
              z: obj.position.z,
            },
            rotation: {
              x: obj.rotation.x,
              y: obj.rotation.y,
              z: obj.rotation.z,
            },
            scale: {
              x: obj.scale.x,
              y: obj.scale.y,
              z: obj.scale.z,
            },
          })),
        })),
        currentSceneId: state.currentSceneId,
        selectedObjectId: state.selectedObjectId,
        gridSnap: state.gridSnap,
        showGrid: state.showGrid,
        gridSize: state.gridSize,
        snapPrecision: state.snapPrecision,
        isTransforming: state.isTransforming,
      }),
      merge: (persistedState: any, currentState: EditorState) => {
        const convertedState = {
          ...persistedState,
          scenes: persistedState.scenes.map((scene: any) => ({
            ...scene,
            objects: scene.objects.map((obj: any) => ({
              ...obj,
              position: new THREE.Vector3(
                obj.position.x,
                obj.position.y,
                obj.position.z
              ),
              rotation: new THREE.Euler(
                obj.rotation.x,
                obj.rotation.y,
                obj.rotation.z
              ),
              scale: new THREE.Vector3(obj.scale.x, obj.scale.y, obj.scale.z),
            })),
          })),
          gridSnap: persistedState.gridSnap,
          showGrid: persistedState.showGrid,
          gridSize: persistedState.gridSize,
          snapPrecision: persistedState.snapPrecision,
          isTransforming: persistedState.isTransforming,
        };
        return {
          ...currentState,
          ...convertedState,
        };
      },
    }
  )
);
