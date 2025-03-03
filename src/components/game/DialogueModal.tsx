import { Portal } from "../Portal";
import { useGameStore } from "../../stores/gameStore";
import { useSound } from "../../hooks/useSound";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import { aiDialogueService } from "../../services/AIDialogueService";
import { useEditorStore } from "../../stores/editorStore";
import { MessageSquare, User, Loader2, X, Send, RefreshCw } from "lucide-react";
import { Dialogue } from "../../types";
import { Input } from "../UI";

// Message component for better performance
const MessageItem = memo(({ message }: { message: Dialogue }) => {
  const isPlayer = message.speaker === "Player";

  return (
    <div className="mb-3 last:mb-0 animate-fadeIn">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${
            isPlayer ? "bg-emerald-600" : "bg-indigo-600"
          }`}
        >
          {isPlayer ? (
            <User className="w-3.5 h-3.5 text-white" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          )}
        </div>
        <h3
          className={`text-base font-bold ${
            isPlayer ? "text-emerald-300" : "text-indigo-300"
          }`}
        >
          {message.speaker}
        </h3>
      </div>
      <div className="text-white text-sm leading-relaxed pl-9 opacity-90">
        {message.text}
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

export function DialogueModal() {
  const { playSound } = useSound();
  const { activeNpc, setActiveNpc } = useGameStore((state) => ({
    activeNpc: state.activeNpc,
    setActiveNpc: state.setActiveNpc,
  }));
  const scenes = useEditorStore((state) => state.scenes);

  // UI state
  const [userInput, setUserInput] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [npcName, setNpcName] = useState("");
  const [messages, setMessages] = useState<Dialogue[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialize the dialogue when an NPC is selected
  const init = useCallback(async () => {
    setMessages([]);
    setIsGeneratingAI(false);
    setIsModelLoading(true);
    if (!activeNpc) return;

    try {
      // Initialize the AI service
      await aiDialogueService.initialize(npcName);
    } catch (error) {
      console.error("Failed to initialize AI service:", error);
    } finally {
      setIsModelLoading(false);
    }

    // Find the scene containing the active NPC
    const currentScene = scenes.find((scene) =>
      scene.objects.some((obj) => obj.id === activeNpc)
    );

    if (currentScene) {
      // Find the NPC object in the scene
      const npcObject = currentScene.objects.find(
        (obj) => obj.id === activeNpc
      );

      if (npcObject) {
        // Set NPC name
        setNpcName(npcObject.name || "NPC");

        // Set the NPC description as context for the AI dialogue
        if (npcObject.description) {
          aiDialogueService.setContext(npcObject.description);
        }

        // Generate initial greeting
        generateInitialGreeting(npcObject.name || "NPC");
      }
    }
  }, [activeNpc, scenes]);

  // Generate initial NPC greeting
  const generateInitialGreeting = useCallback(
    async (name: string) => {
      if (!aiDialogueService.isReady()) {
        // Wait for model to be ready
        setIsModelLoading(true);
        try {
          await aiDialogueService.initialize(name);
        } catch (error) {
          console.error("Failed to initialize AI service:", error);
        } finally {
          setIsModelLoading(false);
        }
      }

      setIsGeneratingAI(true);
      try {
        const greetingDialogue = await aiDialogueService.generateGreeting(name);
        setMessages([greetingDialogue]);
        playSound("dialogueStart");
      } catch (error) {
        console.error("Failed to generate greeting:", error);
        // Fallback greeting
        const fallbackMessage: Dialogue = {
          id: Date.now(),
          speaker: name,
          text: `Greetings, traveler. How may I help you today?`,
          choices: [],
        };
        setMessages([fallbackMessage]);
      } finally {
        setIsGeneratingAI(false);
      }
    },
    [playSound]
  );

  // Handle user message submission
  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isGeneratingAI || isModelLoading) return;

    // Create player message
    const playerMessage: Dialogue = {
      id: Date.now(),
      speaker: "Player",
      text: userInput,
      choices: [],
    };

    // Add to messages
    setMessages((prev) => [...prev, playerMessage]);
    setUserInput("");

    // Generate AI response
    setIsGeneratingAI(true);
    try {
      // Create conversation history for context
      const conversationMessages: {
        role: "system" | "user" | "assistant";
        content: string;
      }[] = [
        {
          role: "system",
          content:
            aiDialogueService.getContext() ||
            `You are ${npcName}, an NPC in a fantasy game.`,
        },
      ];

      // Add previous messages to conversation history
      messages.forEach((msg) => {
        const role =
          msg.speaker === "Player" ? ("user" as const) : ("assistant" as const);
        conversationMessages.push({
          role: role,
          content: msg.text,
        });
      });

      // Add current user message
      conversationMessages.push({
        role: "user",
        content: userInput,
      });

      const response = await aiDialogueService.generateResponse(
        conversationMessages
      );

      // The AIDialogueService now sets the speaker name correctly, but we'll ensure it matches
      // our NPC name just in case
      const responseWithCorrectSpeaker = {
        ...response,
        speaker: response.speaker || npcName,
      };

      setMessages((prev) => [...prev, responseWithCorrectSpeaker]);
    } catch (error) {
      console.error("Failed to generate response:", error);
      // Fallback response
      const fallbackResponse: Dialogue = {
        id: Date.now(),
        speaker: npcName,
        text: "I'm not sure how to respond to that. Is there something else you'd like to discuss?",
        choices: [],
      };

      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [userInput, isGeneratingAI, messages, npcName]);

  // Handle closing the dialogue
  const handleCloseDialogue = useCallback(() => {
    setActiveNpc(null);
    setMessages([]);
    setUserInput("");
    playSound("dialogueEnd");
  }, [playSound, setActiveNpc]);

  // Handle resetting the conversation
  const handleResetConversation = useCallback(() => {
    if (npcName) {
      setMessages([]);
      generateInitialGreeting(npcName);
    }
  }, [npcName, generateInitialGreeting]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input field when dialogue opens or after AI generation completes
  useEffect(() => {
    if (activeNpc && inputRef.current && !isGeneratingAI && !isModelLoading) {
      inputRef.current.focus();
    }
  }, [activeNpc, isGeneratingAI, isModelLoading]);

  useEffect(() => {
    if (activeNpc) {
      init();
    }

    // Cleanup worker when component unmounts
    return () => {
      if (!activeNpc) {
        aiDialogueService.terminate();
      }
    };
  }, [activeNpc, init]);

  // Don't render if no active NPC
  if (!activeNpc) return null;

  return (
    <Portal>
      <div className="fixed inset-0 flex items-end justify-center pointer-events-none z-50 px-4 pb-4 md:pb-8">
        <div className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-lg border border-indigo-500/30 rounded-t-lg shadow-2xl pointer-events-auto max-h-[80vh] flex flex-col transform transition-all duration-200 ease-in-out animate-fadeIn">
          {/* Header with title and controls */}
          <div className="flex justify-between items-center p-3 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-t-lg">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-indigo-100">{npcName}</span>
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleResetConversation}
                className="text-indigo-300 hover:text-white transition-colors p-1.5 hover:bg-indigo-700/30 rounded-full"
                title="Reset conversation"
                disabled={isGeneratingAI || isModelLoading}
              >
                <RefreshCw
                  size={16}
                  className={isGeneratingAI ? "opacity-50" : ""}
                />
              </button>
              <button
                onClick={handleCloseDialogue}
                className="text-indigo-300 hover:text-white transition-colors p-1.5 hover:bg-indigo-700/30 rounded-full"
                title="Close dialogue"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Message history */}
          <div
            ref={messagesContainerRef}
            className="overflow-y-auto custom-scrollbar flex-grow p-3 space-y-3"
            style={{
              height: "40vh",
              maxHeight: "400px",
            }}
          >
            {messages.map((message) => (
              <div key={message.id} className="animate-fadeIn">
                <MessageItem message={message} />
              </div>
            ))}
          </div>

          {/* Loading indicators */}
          {isModelLoading && (
            <div className="border-t border-indigo-500/20 py-2 px-3 flex justify-center items-center bg-purple-900/30">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin mr-2" />
              <span className="text-purple-300 text-sm font-medium">
                Loading AI model...
              </span>
            </div>
          )}
          {isGeneratingAI && !isModelLoading && (
            <div className="border-t border-indigo-500/20 py-2 px-3 flex justify-center items-center bg-indigo-900/20">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin mr-2" />
              <span className="text-indigo-300 text-sm font-medium">
                Generating response...
              </span>
            </div>
          )}

          {/* User input field */}
          <div
            className={`border-t border-indigo-500/20 p-3 ${
              inputFocused ? "bg-indigo-900/20" : "bg-gray-900/70"
            } transition-colors duration-200`}
          >
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  e.key === "Enter" && handleSendMessage();
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Type your message..."
                className="flex-grow bg-gray-800/60 border border-indigo-500/30 rounded-md px-3 py-2 text-white text-sm placeholder-indigo-300/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                disabled={isGeneratingAI || isModelLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isGeneratingAI || isModelLoading || !userInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/40 disabled:cursor-not-allowed p-2 rounded-md flex items-center justify-center transition-colors shadow-md"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
