import { Search } from 'lucide-react';
import { Model3D } from '../types';
import { motion } from 'framer-motion';

interface FiltersProps {
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
}

export function Filters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: FiltersProps) {
  return (
    <div className="space-y-4 sticky top-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white font-medium'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>
    </div>
  );
}