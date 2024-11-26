import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, LogOut } from "lucide-react";
import { AuthModal } from "../components/auth/AuthModal";
import { CreateGameModal } from "../components/game/CreateGameModal";
import { useAuthStore } from "../stores/authStore";
import { Hero } from "../components/home/Hero";
import { FeaturedGames } from "../components/home/FeaturedGames";
import { PopularTags } from "../components/home/PopularTags";

export function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");

  const { user, isAuthenticated, logout } = useAuthStore();

  const handleCreateGame = () => {
    if (!isAuthenticated) {
      setAuthMode("signin");
      setShowAuthModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 backdrop-blur-md bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Gamepad2 className="w-8 h-8 text-blue-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                VXLverse
              </span>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50"
                  >
                    <img
                      src={
                        user.avatar ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                      }
                      alt="Avatar"
                      className="w-8 h-8 rounded-lg"
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-400">Game Creator</div>
                    </div>
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setAuthMode("signin");
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setAuthMode("register");
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    Register
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Hero />
        <FeaturedGames />
        <PopularTags />
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
      <CreateGameModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
