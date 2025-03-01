import { motion } from "framer-motion";
import {
  Lightbulb,
  PenTool,
  PlayCircle,
  Share2,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    icon: Lightbulb,
    title: "Imagine",
    description:
      "Start with your game idea. Adventure, puzzle, strategy - the possibilities are endless.",
    color: "yellow",
  },
  {
    icon: PenTool,
    title: "Create",
    description:
      "Build your world using our powerful voxel editor with intuitive grid and snapping tools.",
    color: "blue",
  },
  {
    icon: PlayCircle,
    title: "Play",
    description:
      "Test your game instantly in the browser and refine the gameplay experience.",
    color: "green",
  },
  {
    icon: Share2,
    title: "Share",
    description:
      "Publish your creation and share it with players around the world.",
    color: "purple",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-block p-2 bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm mb-4">
            <Lightbulb className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From concept to playable game in four simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/30 backdrop-blur-sm group hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-${step.color}-500/20 border border-${step.color}-500/30`}
                    >
                      <step.icon className={`w-5 h-5 text-${step.color}-400`} />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {step.title}
                    </div>
                  </div>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    {step.description}
                  </p>

                  {/* Arrow for all but last item */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6 text-blue-400" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 text-center"
        >
          <motion.a
            href="/editor"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-500/25"
          >
            Start Creating Now
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
