import { useState } from "react";
import { Quest, Item, GAME_ITEMS } from "../../../types";
import { ItemSelector } from "../../editor/ItemSelector";
import { QuestStory } from "./QuestStory";
import { QuestRequirements } from "./QuestRequirements";
import { QuestRewards } from "./QuestRewards";

interface QuestEditorProps {
  quest: Quest;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
}

export function QuestEditor({ quest, updateQuest }: QuestEditorProps) {
  const [showItemSelector, setShowItemSelector] = useState<{
    type: "requirement" | "reward";
    open: boolean;
  }>({ type: "requirement", open: false });

  const handleAddItem = (items: Item[]) => {
    if (items.length === 0) return;

    // Add all selected items
    if (showItemSelector.type === "requirement") {
      const currentItems = quest.requirements.items || [];

      // Create a new array with all existing items that don't conflict with new selections
      const nonConflictingItems = currentItems.filter(
        (existingItem) =>
          !items.some((newItem) => newItem.id === existingItem.id)
      );

      // Add all newly selected items
      const newItems = [
        ...nonConflictingItems,
        ...items.map((item) => ({
          ...item,
          // Preserve any additional properties needed
        })),
      ];

      // Update quest with new items
      updateQuest(quest.id, {
        requirements: {
          ...quest.requirements,
          items: newItems,
        },
      });

      // Show a toast or feedback that items were added
    } else {
      const currentItems = quest.rewards.items || [];

      // Create a new array with all existing items that don't conflict with new selections
      const nonConflictingItems = currentItems.filter(
        (existingItem) =>
          !items.some((newItem) => newItem.id === existingItem.id)
      );

      // Add all newly selected items
      const newItems = [
        ...nonConflictingItems,
        ...items.map((item) => ({
          ...item,
          // Preserve any additional properties needed
        })),
      ];

      // Update quest with new items
      updateQuest(quest.id, {
        rewards: {
          ...quest.rewards,
          items: newItems,
        },
      });
    }

    // Close the item selector after adding items
    setShowItemSelector({ ...showItemSelector, open: false });
  };

  const handleRemoveItem = (itemId: string, type: "requirement" | "reward") => {
    if (type === "requirement") {
      const updatedItems =
        quest.requirements.items?.filter((i) => i.id !== itemId) || [];
      updateQuest(quest.id, {
        requirements: {
          ...quest.requirements,
          items: updatedItems,
        },
      });
    } else {
      const updatedItems =
        quest.rewards.items?.filter((i) => i.id !== itemId) || [];
      updateQuest(quest.id, {
        rewards: {
          ...quest.rewards,
          items: updatedItems,
        },
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Story Section */}
        <QuestStory quest={quest} updateQuest={updateQuest} />

        {/* Requirements Section */}
        <QuestRequirements
          quest={quest}
          updateQuest={updateQuest}
          onAddItem={() =>
            setShowItemSelector({ type: "requirement", open: true })
          }
          onRemoveItem={(itemId) => handleRemoveItem(itemId, "requirement")}
        />

        {/* Rewards Section */}
        <QuestRewards
          quest={quest}
          updateQuest={updateQuest}
          onAddItem={() => setShowItemSelector({ type: "reward", open: true })}
          onRemoveItem={(itemId) => handleRemoveItem(itemId, "reward")}
        />
      </div>

      {/* Item Selector Modal */}
      {showItemSelector.open && (
        <ItemSelector
          onSelect={handleAddItem}
          initialSelectedItems={
            showItemSelector.type === "requirement"
              ? quest.requirements.items || []
              : quest.rewards.items || []
          }
          onClose={() =>
            setShowItemSelector({ ...showItemSelector, open: false })
          }
          title={`Select ${
            showItemSelector.type === "requirement" ? "Required" : "Reward"
          } Items`}
          maxSelections={10}
        />
      )}
    </>
  );
}
