"use client";

import { useTheme } from "@/app/utils/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        className="w-10 h-10 bg-muted border border-border rounded-full flex items-center justify-center animate-pulse"
        disabled
        aria-label="Loading theme toggle"
      >
        ...
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="w-10 h-10 bg-muted border border-border hover:border-accent rounded-full
       flex items-center justify-center transition-all duration-300 group"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SunIcon className="w-5 h-5 text-yellow-400"/>
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MoonIcon className="w-5 h-5 text-gray-800" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}



// "use client";

// import { useTheme } from '@/app/utils/contexts/ThemeContext';

// export default function ThemeToggle() {
//   const { theme, toggleTheme, mounted } = useTheme();

//   console.log("🔘 ThemeToggle render - theme:", theme, "mounted:", mounted);

//   const handleClick = () => {
//     console.log("🔘 ThemeToggle button clicked!");
//     toggleTheme();
//   };

//   if (!mounted) {
//     console.log("ThemeToggle: Not mounted, showing loading...");
//   }

//   return (
//     <button
//       onClick={handleClick}
//       className="text-sm px-4 py-1 border rounded text-gray-600 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//       aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
//     >
//       {!mounted ? (
//         <div>
//           <span className="animate-pulse">Loading...</span>
//         </div>
//       ) : (
//         <div>
//           {theme === 'dark' ? "🌞 Light Mode" : "🌙 Dark Mode"}
//         </div>
//       )}
//     </button>
//   );
// }