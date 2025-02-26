import { useState, useEffect } from "react";
import { useEditorStore } from "../../stores/editorStore";
import {
  Plus,
  Trash2,
  Box,
  Search,
  Eye,
  EyeOff,
  Package,
  User,
  FileCode,
  Copy,
  MoreHorizontal,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Model3D } from "../../types";
import useSWR from "swr";
import { pb } from "../../lib/pocketbase";
import { Input } from "../UI/input";
import { Tooltip } from "../UI/Tooltip";

const useModels = (searchTerm: string) => {
  const { data, error } = useSWR("models" + searchTerm, async (url) => {
    const res = await pb.collection("3d_models").getList<Model3D>(1, 50, {
      sort: "created",
      filter: `name ~ "${searchTerm}" || tags ~ "${searchTerm}"`,
    });
    return res.items?.map((obj) => ({
      ...obj,
      thumbnail: pb.files.getURL(obj, obj.thumbnail),
      glb: pb.files.getURL(obj, obj.glb),
    }));
  });

  return {
    models: data || [],
    isLoading: !data && !error,
    error,
  };
};

export function ScenePanel() {
  const {
    scenes,
    currentSceneId,
    selectedObjectId,
    removeObject,
    setSelectedObject,
  } = useEditorStore();

  // State to track search input and expanded scenes
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenObjects, setHiddenObjects] = useState<string[]>([]);
  const [objectsExpanded, setObjectsExpanded] = useState(true);
  const [modelsExpanded, setModelsExpanded] = useState(true);

  // State for models
  const { models, isLoading } = useModels(searchQuery);

  const currentScene = scenes.find((scene) => scene.id === currentSceneId);

  // Handle adding model to scene
  const handleAddModelToScene = (model: Model3D) => {
    if (!currentSceneId) return;

    const newObject = {
      id: new THREE.Object3D().uuid,
      name: model.name,
      modelUrl: model.glb,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    };

    useEditorStore.getState().addObject(currentSceneId, newObject);
  };

  // Toggle object visibility
  const toggleObjectVisibility = (objectId: string) => {
    if (hiddenObjects.includes(objectId)) {
      setHiddenObjects(hiddenObjects.filter((id) => id !== objectId));
    } else {
      setHiddenObjects([...hiddenObjects, objectId]);
    }
  };

  // Duplicate object
  const duplicateObject = (objectId: string) => {
    if (!currentSceneId) return;

    const objectToDuplicate = currentScene?.objects.find(
      (obj) => obj.id === objectId
    );
    if (!objectToDuplicate) return;

    const newObject = {
      ...objectToDuplicate,
      id: new THREE.Object3D().uuid,
      name: `${objectToDuplicate.name} (copy)`,
      position: new THREE.Vector3(
        objectToDuplicate.position.x + 1,
        objectToDuplicate.position.y,
        objectToDuplicate.position.z
      ),
    };

    useEditorStore.getState().addObject(currentSceneId, newObject);
  };

  return (
    <div className="flex flex-col h-full border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* HEADER: Title, Actions, & Search */}
      <div className="flex border-b h-9 border-white/10 px-4 items-center gap-2">
        <div className="w-7 h-7  flex items-center justify-center ">
          <span className="text-lg font-bold text-indigo-400">VXL</span>
        </div>
        <h1 className="text-sm font-bold text-white">verse</h1>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        {/* OBJECTS SECTION */}
        <section className="flex-1  flex flex-col overflow-hidden border-b border-slate-800/70">
          <div
            className="px-3 py-2 bg-slate-800/30 border-b border-slate-800/50 flex justify-between items-center cursor-pointer hover:bg-slate-800/40 transition-colors"
            onClick={() => setObjectsExpanded(!objectsExpanded)}
          >
            <h3 className="text-xs font-medium text-slate-200 flex items-center">
              <Box className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              {currentScene?.objects.length
                ? `Hierarchy  (${currentScene.objects.length})`
                : "Hierarchy"}
            </h3>
          </div>

          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-1.5 overflow-y-auto custom-scrollbar flex-grow"
            >
              {currentScene?.objects.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-800/20 border border-slate-700/20 rounded-md">
                  <Box className="w-12 h-12 text-slate-500 mb-3 opacity-50" />
                  <p className="text-sm font-medium text-slate-300">
                    No objects in this scene
                  </p>
                  <p className="text-xs text-slate-500 mt-2 mb-4 max-w-[220px]">
                    Add 3D models from the library below to populate your scene
                  </p>
                  <button className="px-3 py-1.5 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30 transition-colors flex items-center gap-1.5">
                    <Plus size={12} />
                    Add Object
                  </button>
                </div>
              )}
              {currentScene?.objects.map((object) => (
                <motion.div
                  key={object.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -10, opacity: 0 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className={`group p-2.5 rounded-md cursor-pointer border transition-all ${
                    selectedObjectId === object.id
                      ? "bg-gradient-to-r from-blue-500/20 to-blue-500/5 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                      : "hover:bg-slate-800/70 border-transparent hover:border-slate-700/50"
                  } ${hiddenObjects.includes(object.id) ? "opacity-50" : ""}`}
                  onClick={() => setSelectedObject(object.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-5 h-5 flex items-center justify-center rounded-sm ${
                          selectedObjectId === object.id
                            ? "bg-blue-500/30"
                            : "bg-slate-800/70"
                        }`}
                      >
                        <Box
                          className={`w-3 h-3 ${
                            selectedObjectId === object.id
                              ? "text-blue-300"
                              : "text-slate-400"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium truncate ${
                          selectedObjectId === object.id
                            ? "text-blue-100"
                            : "text-slate-200"
                        }`}
                      >
                        {object.name}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip
                        content={
                          hiddenObjects.includes(object.id) ? "Show" : "Hide"
                        }
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleObjectVisibility(object.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {hiddenObjects.includes(object.id) ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                        </button>
                      </Tooltip>
                      <Tooltip content="Duplicate">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateObject(object.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <Copy size={12} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeObject(currentSceneId!, object.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  {selectedObjectId === object.id && (
                    <div className="mt-2 pt-2 border-t border-blue-500/20 text-xs text-slate-400 flex flex-wrap gap-2">
                      <div className="px-2 py-0.5 bg-slate-800/50 rounded-sm">
                        {object.type}
                      </div>
                      <div className="px-2 py-0.5 bg-slate-800/50 rounded-sm flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Active
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* MODELS SECTION */}
        <section className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
          <div
            className="px-3 py-2 bg-slate-800/30 border-b border-slate-800/50 flex justify-between items-center cursor-pointer hover:bg-slate-800/40 transition-colors"
            onClick={() => setModelsExpanded(!modelsExpanded)}
          >
            <div className="flex items-center text-xs font-medium text-slate-200">
              <Package className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
              <span>Models Library</span>
            </div>
            <div className="flex items-center">
              <div className="relative w-36 mr-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full pl-7 pr-2 py-1.5 text-xs text-slate-200 bg-slate-800/80  border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="text-slate-400">
                {modelsExpanded ? (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus size={14} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ rotate: 180 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus size={14} />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {modelsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-2 overflow-y-auto custom-scrollbar flex-grow"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-32 text-xs text-slate-500 p-4 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent -full mb-3"></div>
                    <p>Loading models...</p>
                  </div>
                ) : models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-xs text-slate-500 p-4 text-center">
                    <Package className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-sm">No models found</p>
                    {searchQuery && (
                      <p className="text-xs mt-1 text-slate-400">
                        Try a different search term
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {models.map((model) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-800/40  overflow-hidden cursor-pointer transition-all border border-transparent hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50"
                      >
                        <div className="flex p-2">
                          <div className="w-16 h-16 bg-slate-900  overflow-hidden flex-shrink-0 border border-slate-800">
                            <img
                              src={model.thumbnail}
                              alt={model.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0 flex flex-col justify-center">
                            <div className="text-xs font-medium text-slate-200 truncate">
                              {model.name}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <a
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                href={model.attribution_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 flex items-center gap-1 hover:underline"
                              >
                                <User className="w-3 h-3" />
                                <span className="text-[10px] truncate">
                                  {model.creator || "Unknown"}
                                </span>
                              </a>
                            </div>

                            <div className="flex items-center gap-1 mt-0.5">
                              <FileCode className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-400 truncate">
                                {model.licence || "No license"}
                              </span>
                            </div>
                          </div>
                          <Tooltip content="Add to scene">
                            <button
                              className="ml-2 p-1.5  bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 hover:text-purple-300 self-center flex-shrink-0 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddModelToScene(model);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
