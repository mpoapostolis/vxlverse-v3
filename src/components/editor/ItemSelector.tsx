import { GAME_ITEMS, Item } from "../../types";
import { Check, ChevronDown, Filter, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ItemSelectorProps {
  onSelect: (items: Item[]) => void;
  onClose: () => void;
  initialSelectedItems?: Item[];
  maxSelections?: number;
  title?: string;
}

export function ItemSelector({
  onSelect,
  onClose,
  initialSelectedItems = [],
  maxSelections = Infinity,
  title = "Select Items",
}: ItemSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<Item["type"] | "all">("all");
  const [selectedItems, setSelectedItems] =
    useState<Item[]>(initialSelectedItems);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "value" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Extract all unique types from items
  const types = [
    "all",
    ...Array.from(new Set(GAME_ITEMS.map((item) => item.type))),
  ];

  // Filter and sort items
  const filteredItems = GAME_ITEMS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === "value") {
      return sortOrder === "asc" ? a.value - b.value : b.value - a.value;
    } else {
      return sortOrder === "asc"
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }
  });

  // Toggle item selection
  const toggleItemSelection = (item: Item) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);

      if (isSelected) {
        // Remove item if already selected
        return prev.filter((i) => i.id !== item.id);
      } else {
        // Add item if not at max selections
        if (prev.length < maxSelections) {
          return [...prev, item];
        }
        return prev;
      }
    });
  };

  // Check if an item is selected
  const isItemSelected = (itemId: string) => {
    return selectedItems.some((item) => item.id === itemId);
  };

  // Handle confirm selection
  const handleConfirm = () => {
    onSelect(selectedItems);
    onClose();
  };

  // Reset search when type changes
  useEffect(() => {
    setSearch("");
  }, [selectedType]);

  return (
    <div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-100 flex items-center">
              <span className="mr-2">{title}</span>
              {maxSelections < Infinity && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 ">
                  Max: {maxSelections}
                </span>
              )}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 transition-colors p-1 hover:bg-slate-700/50 "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-slate-600/50 text-slate-200"
            />
          </div>

          {/* Type Filters */}
          <div className="mt-3 flex items-center">
            <div className="flex-1 flex flex-wrap gap-1.5">
              {types
                .slice(
                  0,
                  showFilters ? types.length : Math.min(4, types.length)
                )
                .map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type as any)}
                    className={`px-2.5 py-1  text-xs font-medium capitalize transition-all ${
                      selectedType === type
                        ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              {types.length > 4 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-2 py-1  text-xs font-medium bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 transition-all flex items-center"
                >
                  {showFilters ? "Less" : "More"}
                  <ChevronDown
                    className={`w-3 h-3 ml-1 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="ml-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5  text-xs font-medium transition-all flex items-center ${
                  showFilters
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                }`}
                title="Advanced filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-2 bg-slate-800/50  border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Sort by:</span>
                  <div className="flex gap-1.5">
                    {(["name", "value", "type"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          if (sortBy === option) {
                            setSortOrder((prev) =>
                              prev === "asc" ? "desc" : "asc"
                            );
                          } else {
                            setSortBy(option);
                            setSortOrder("asc");
                          }
                        }}
                        className={`px-2 py-0.5  text-[10px] capitalize flex items-center ${
                          sortBy === option
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-slate-700/30 text-slate-400 hover:bg-slate-700/50"
                        }`}
                      >
                        {option}
                        {sortBy === option && (
                          <ChevronDown
                            className={`w-3 h-3 ml-1 transition-transform ${
                              sortOrder === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Items Preview */}
          {selectedItems.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 p-2 bg-slate-800/30  border border-slate-700/30">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-blue-500/10 text-blue-300 text-xs px-2 py-0.5  flex items-center"
                >
                  <span className="mr-1">{item.emoji}</span>
                  <span className="truncate max-w-[100px]">{item.name}</span>
                  <button
                    onClick={() => toggleItemSelection(item)}
                    className="ml-1 text-blue-400 hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="p-4 overflow-y-auto flex-grow custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No items found matching your search</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedType("all");
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map((item) => {
                const isSelected = isItemSelected(item.id);
                const isDisabled =
                  !isSelected && selectedItems.length >= maxSelections;

                return (
                  <button
                    key={item.id}
                    onClick={() => !isDisabled && toggleItemSelection(item)}
                    className={`flex items-center gap-3 p-3 transition-all relative overflow-hidden h-full ${
                      isSelected
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : isDisabled
                        ? "bg-slate-700/20 border border-slate-700/30 opacity-50 cursor-not-allowed"
                        : "bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600"
                    } text-left`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-blue-500 p-1 -bl-md">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-3xl flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-700/60 to-slate-800/60 border border-slate-600/40 shadow-inner">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {item.value} coins
                        </span>
                        <span className="text-[10px] bg-slate-800/70 px-1.5 py-0.5  text-slate-400 capitalize">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center flex-shrink-0">
          <div className="text-xs text-slate-400">
            {selectedItems.length > 0 ? (
              <span>
                Selected:{" "}
                <span className="text-blue-300 font-medium">
                  {selectedItems.length}
                </span>
                {maxSelections < Infinity && <span> / {maxSelections}</span>}
              </span>
            ) : (
              <span>No items selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm  transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className={`px-3 py-1.5 text-sm  transition-colors ${
                selectedItems.length > 0
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-blue-500/30 text-blue-300/50 cursor-not-allowed"
              }`}
            >
              Confirm ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
