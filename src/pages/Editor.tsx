import { Canvas } from "@react-three/fiber";
import { ScenePanel } from "../components/editor/ScenePanel";
import { PropertiesPanel } from "../components/editor/PropertiesPanel";
import {
  KeyboardControls,
  OrbitControls,
  useKeyboardControls,
} from "@react-three/drei";
import { useEffect, useState, useRef, Suspense } from "react";
import { useEditorStore } from "../stores/editorStore";
import { Perf } from "r3f-perf";
import {
  Brush,
  Magnet,
  Move,
  RotateCcw,
  Grid3X3,
  Play,
  Undo,
  Redo,
  Minimize,
  Expand,
  ExpandIcon,
  Copy,
  Trash,
  X,
  Layout,
  Plus,
  Gauge,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "../components/UI/Toast";
import { EditorScene } from "../components/editor/EditorScene";
import { Tooltip } from "../components/UI/Tooltip";
import { Player } from "../components/game/Player";
import { Hero } from "../components/game/Hero";
import { useParams } from "react-router-dom";
import { pb } from "../lib/pocketbase";
import { useGame } from "../hooks/useGame";
import { useSyncGameState } from "../hooks/useSyncEditor";

// Updated keyboard mapping for tools
const KEYBOARD_MAP = [
  { name: "translate", keys: ["KeyW"] },
  { name: "rotate", keys: ["KeyE"] },
  { name: "scale", keys: ["KeyR"] },
  { name: "brush", keys: ["KeyB"] },
  { name: "grid", keys: ["KeyG"] },
  { name: "snap", keys: ["KeyS"] },
  { name: "undo", keys: ["KeyZ"] },
  { name: "redo", keys: ["KeyY"] },
  { name: "focus", keys: ["KeyF"] },
  { name: "full screen", keys: ["Meta+KeyF"] },
  { name: "play", keys: ["KeyP"] },
  { name: "metrics", keys: ["KeyM"] },
  { name: "escape", keys: ["Escape"] },
  { name: "duplicate", keys: ["KeyD"] },
  // Changed delete key to the dedicated Delete key
  { name: "delete", keys: ["Backspace"] },
];

export function Editor() {
  const { id = "" } = useParams<{ id: string }>();
  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <_Editor gameId={id} />
    </KeyboardControls>
  );
}

export function _Editor({ gameId }: { gameId: string }) {
  const {
    scenes,
    currentSceneId,
    addScene,
    selectedObjectId,
    toggleBrushMode,
    gridSnap,
    toggleGridSnap,
    showGrid,
    toggleGrid,
    setSelectedObject,
    setCurrentScene,
    duplicateObject,
    removeScene,
    removeObject,
    brushActive,
    createNewScene,
  } = useEditorStore();
  const [showMetrics, setShowMetrics] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("move");
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const orbitControlsRef = useRef();
  const focusOnObject = useEditorStore((state) => state.focusOnObject);
  const setFocusOnObject = useEditorStore((state) => state.setFocusOnObject);

  // Create a default scene if none exists
  useEffect(() => {
    if (scenes.length === 0) {
      createNewScene("New Scene");
    }
  }, [scenes, createNewScene]);
  const { id } = useParams<{ id: string }>();
  useGame(id!);
  useSyncGameState(id!);
  const [subscribeKeys] = useKeyboardControls();

  useEffect(() => {
    // Translate tool
    const unsubscribeTranslate = subscribeKeys(
      (state) => state.translate,
      (pressed) => {
        if (pressed && selectedObjectId) {
          setActiveTool("move");
          toggleBrushMode(false);
          setTransformMode("translate");
        }
      }
    );

    // Rotate tool
    const unsubscribeRotate = subscribeKeys(
      (state) => state.rotate,
      (pressed) => {
        if (pressed && selectedObjectId) {
          setActiveTool("rotate");
          toggleBrushMode(false);
          setTransformMode("rotate");
        }
      }
    );

    // Scale tool
    const unsubscribeScale = subscribeKeys(
      (state) => state.scale,
      (pressed) => {
        if (pressed && selectedObjectId) {
          setActiveTool("scale");
          toggleBrushMode(false);
          setTransformMode("scale");
        }
      }
    );

    // Brush tool
    const unsubscribeBrush = subscribeKeys(
      (state) => state.brush,
      (pressed) => {
        if (pressed && selectedObjectId) {
          setActiveTool("brush");
          toggleBrushMode(pressed);
        }
      }
    );

    // Toggle grid visibility
    const unsubscribeGrid = subscribeKeys(
      (state) => state.grid,
      (pressed) => {
        if (pressed) {
          toggleGrid();
          toggleBrushMode(false);
        }
      }
    );

    // Toggle grid snapping
    const unsubscribeSnap = subscribeKeys(
      (state) => state.snap,
      (pressed) => {
        if (pressed) {
          toggleGridSnap();
          toggleBrushMode(false);
        }
      }
    );

    // Focus on selected object
    const unsubscribeFocus = subscribeKeys(
      (state) => state.focus,
      (pressed) => {
        if (pressed && selectedObjectId) {
          setFocusOnObject(true);
          setTimeout(() => setFocusOnObject(false), 100);
        }
      }
    );

    // Fullscreen toggle
    const unsubscribeFullScreen = subscribeKeys(
      (state) => state["full screen"],
      (pressed) => {
        if (pressed) toggleFullscreen();
      }
    );

    // Preview mode toggle
    const unsubscribePlay = subscribeKeys(
      (state) => state.play,
      (pressed) => {
        if (pressed) togglePreviewMode();
      }
    );

    // Escape: deselect object
    const unsubscribeEscape = subscribeKeys(
      (state) => state.escape,
      (pressed) => {
        if (pressed) {
          toggleBrushMode(false);
          setSelectedObject(null);
        }
      }
    );

    // Duplicate object
    const unsubscribeDuplicate = subscribeKeys(
      (state) => state.duplicate,
      (pressed) => {
        if (pressed && selectedObjectId && currentSceneId) {
          console.debug("Duplicate action triggered");
          duplicateObject(currentSceneId, selectedObjectId);
        }
      }
    );

    // Duplicate object
    const metrics = subscribeKeys(
      (state) => state.metrics,
      (pressed) => {
        if (pressed && selectedObjectId && currentSceneId) {
          setShowMetrics((s) => !s);
        }
      }
    );

    // Delete object using Delete key
    const unsubscribeDelete = subscribeKeys(
      (state) => state.delete,
      (pressed) => {
        if (pressed && selectedObjectId && currentSceneId) {
          console.debug("Delete action triggered");
          removeObject(currentSceneId, selectedObjectId);
          toast.info("Object deleted");
        }
      }
    );

    return () => {
      metrics();
      unsubscribeTranslate();
      unsubscribeRotate();
      unsubscribeScale();
      unsubscribeBrush();
      unsubscribeGrid();
      unsubscribeSnap();
      unsubscribeFocus();
      unsubscribeFullScreen();
      unsubscribePlay();
      unsubscribeEscape();
      unsubscribeDuplicate();
      unsubscribeDelete();
    };
  }, [
    selectedObjectId,
    currentSceneId,
    subscribeKeys,
    toggleBrushMode,
    toggleGrid,
    toggleGridSnap,
    duplicateObject,
    removeObject,
  ]);

  const handleBrushToggle = () => {
    if (selectedObjectId && activeTool === "brush") {
      setActiveTool("move");
      toggleBrushMode(false);
    } else {
      setActiveTool("brush");
      toggleBrushMode(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen && document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePreviewMode = () => {
    setIsPreviewMode((prev) => !prev);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-slate-900">
      {/* Main toolbar */}

      <div className="grid h-full grid-cols-[350px_1fr_350px]  overflow-hidden">
        <ScenePanel />
        <div className="relative max-h-screen flex-1">
          {/* Scene tabs */}
          <div className="absolute h-8 no-scrollbar top-0 left-0 right-0 z-50 flex overflow-x-auto bg-slate-900 backdrop-blur-sm border-b border-slate-800">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => {
                  toggleBrushMode(false);

                  setSelectedObject(null);
                  setCurrentScene(scene.id);
                }}
                className={`px-4 py-2 text-xs font-medium flex items-center gap-2 whitespace-nowrap border-r border-slate-800/50 min-w-[120px] max-w-[180px] transition-all ${
                  scene.id === currentSceneId
                    ? "bg-slate-800 text-white border-b-2 border-blue-500"
                    : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/30"
                }`}
              >
                <Layout
                  size={14}
                  className={
                    scene.id === currentSceneId
                      ? "text-blue-400"
                      : "text-slate-500"
                  }
                />
                <span className="truncate">{scene.name}</span>
                <Trash
                  size={12}
                  className="ml-2 text-slate-500 hover:text-red-500"
                  onClick={(e) => {
                    confirm("Are you sure you want to delete this scene?") &&
                      removeScene(scene.id);
                  }}
                />
              </button>
            ))}
            <button
              onClick={() => {
                createNewScene(`Scene ${scenes.length + 1}`);
                toggleBrushMode(false);
                setSelectedObject(null);
              }}
              className="px-2 w-fit text-blue-500 bg-slate-900/50  py-2 text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all "
              title="Add New Scene"
            >
              <Plus size={14} className="text-white" />
            </button>
          </div>

          <div className="absolute z-50 bottom-0 h-10  bg-slate-900 backdrop-blur-sm border-b border-slate-800 right-0 w-full flex justify-center">
            {/* Tools section */}
            <div className="flex h-full items-center">
              {/* Transform Tools Group */}
              <div className="flex h-full border-r border-slate-700/20">
                <Tooltip position="top" content="Move Tool (W)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      setActiveTool("move");
                      setTransformMode("translate");
                      toggleBrushMode(false);
                    }}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      selectedObjectId && activeTool === "move"
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    }`}
                  >
                    <Move className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Rotate Tool (E)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      setActiveTool("rotate");
                      setTransformMode("rotate");
                      toggleBrushMode(false);
                    }}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      selectedObjectId && activeTool === "rotate"
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Scale Tool (R)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      setActiveTool("scale");
                      setTransformMode("scale");
                      toggleBrushMode(false);
                    }}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      selectedObjectId && activeTool === "scale"
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    }`}
                  >
                    <ExpandIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>

              {/* Object Manipulation Group */}
              <div className="flex h-full border-r border-slate-700/20">
                <Tooltip position="top" content="Duplicate Object (Meta + D)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      if (selectedObjectId && currentSceneId) {
                        duplicateObject(currentSceneId, selectedObjectId);
                      }
                    }}
                    className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Brush Tool (B)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={handleBrushToggle}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      brushActive
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    }`}
                  >
                    <Brush className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Delete Object (Delete)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      if (selectedObjectId && currentSceneId) {
                        removeObject(currentSceneId, selectedObjectId);
                      }
                    }}
                    className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Close (Esc)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      setSelectedObject(null);
                    }}
                    className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>

              {/* Grid and View Group */}
              <div className="flex h-full border-r border-slate-700/20">
                <Tooltip position="top" content="Toggle Grid Snap (S)">
                  <button
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      gridSnap
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
                    }`}
                    onClick={toggleGridSnap}
                  >
                    <Magnet className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Toggle Grid (G)">
                  <button
                    onClick={toggleGrid}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      showGrid
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Focus on Object (F)">
                  <button
                    disabled={!selectedObjectId}
                    onClick={() => {
                      if (selectedObjectId) {
                        setFocusOnObject(true);
                        setTimeout(() => setFocusOnObject(false), 100);
                      }
                    }}
                    className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-slate-700/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>

              {/* Utility Group */}
              <div className="flex h-full border-r border-slate-700/20">
                <Tooltip position="top" content="Metrics">
                  <button
                    onClick={() => setShowMetrics(!showMetrics)}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      showMetrics
                        ? "bg-gradient-to-b from-green-600/30 to-green-500/20 text-green-300 border-b-2 border-green-400 shadow-[0_2px_4px_rgba(74,222,128,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
                    }`}
                  >
                    <Gauge className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Undo (Ctrl+Z)">
                  <button className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-slate-700/40 hover:text-white">
                    <Undo className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Redo (Ctrl+Y)">
                  <button className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-slate-700/40 hover:text-white">
                    <Redo className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>

              {/* View Mode Group */}
              <div className="flex h-full">
                <Tooltip
                  position="top"
                  content={
                    isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                  }
                >
                  <button
                    onClick={toggleFullscreen}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      isFullscreen
                        ? "bg-gradient-to-b from-blue-600/30 to-blue-500/20 text-blue-300 border-b-2 border-blue-400 shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
                    }`}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Expand className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
                <Tooltip position="top" content="Preview Mode (P)">
                  <button
                    onClick={togglePreviewMode}
                    className={`w-10 h-full flex items-center justify-center transition-all duration-200 ${
                      isPreviewMode
                        ? "bg-gradient-to-b from-green-600/30 to-green-500/20 text-green-300 border-b-2 border-green-400 shadow-[0_2px_4px_rgba(74,222,128,0.2)]"
                        : "text-slate-400 hover:bg-green-900/30 hover:text-green-300"
                    }`}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </Tooltip>

                <Tooltip position="top" content="Publish">
                  <button
                    onClick={() => {
                      const { publishGame } = useUpdateGame();

                      if (gameId) {
                        publishGame(gameId);
                      } else {
                        toast.error("Game ID not found");
                      }
                    }}
                    className="w-10 h-full flex items-center justify-center transition-all duration-200 text-slate-400 hover:bg-green-900/30 hover:text-green-300"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {currentSceneId ? (
            <Canvas
              key={currentSceneId}
              shadows
              gl={{ preserveDrawingBuffer: true }}
              camera={{ position: [5, 5, 5], fov: 50 }}
              className="w-full relative h-full"
            >
              <Hero />
              {showMetrics && <Perf className="absolute w-80 top-8 left-0" />}
              <EditorScene
                showGrid={showGrid}
                gridSnap={gridSnap}
                transformMode={transformMode}
                focusOnObject={focusOnObject}
                orbitControlsRef={orbitControlsRef}
              />
              {/* @ts-ignore */}
              <OrbitControls ref={orbitControlsRef} makeDefault />
            </Canvas>
          ) : (
            <div className="z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              No scene selected
            </div>
          )}
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
