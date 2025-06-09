
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {

    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);

      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        setTheme(initialTheme);
        localStorage.setItem('theme', initialTheme);
      }
    } catch (error) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    setMounted(true);
  }, []);

  // Update HTML class and localStorage when theme changes
  useEffect(() => {
    if (!mounted) {
      return;
    }
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Could not save theme to localStorage:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};




// "use client";

// import { createContext, useContext, useEffect, useState } from "react";

// type Theme = "light" | "dark";

// interface ThemeContextType {
//   theme: Theme;
//   toggleTheme: () => void;
//   mounted: boolean; // Add mounted state to prevent hydration mismatch
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
//   const [theme, setTheme] = useState<Theme>("light");
//   const [mounted, setMounted] = useState(false);

//   // Initialize theme on mount
//   useEffect(() => {
//     try {
//       const savedTheme = localStorage.getItem('theme') as Theme;
      
//       if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
//         setTheme(savedTheme);
//       } else {
//         const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
//         const initialTheme = prefersDark ? 'dark' : 'light';
//         setTheme(initialTheme);
//         localStorage.setItem('theme', initialTheme);
//       }
//     } catch (error) {
//       // Fallback if localStorage is not available
//       console.warn('localStorage not available:', error);
//       const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
//       setTheme(prefersDark ? 'dark' : 'light');
//     }
    
//     setMounted(true);
//   }, []);

//   // Update HTML class and localStorage when theme changes
//   useEffect(() => {
//     if (!mounted) return; // Don't run on server

//     const root = document.documentElement;

//     if (theme === "dark") {
//       root.classList.add('dark');
//     } else {
//       root.classList.remove('dark');
//     }

//     try {
//       localStorage.setItem('theme', theme);
//     } catch (error) {
//       console.warn('Could not save theme to localStorage:', error);
//     }
//   }, [theme, mounted]);

//   const toggleTheme = () => {
//     setTheme((prev) => (prev === "dark" ? "light" : "dark"));
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = (): ThemeContextType => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error("useTheme must be used within a ThemeProvider");
//   }
//   return context;
// };





// ------------------------------------------------------------------------------------

// "use client";

// import { createContext, useContext, useEffect, useState } from "react";

// type Theme = "light" | "dark";

// interface ThemeContextType {
//   theme: Theme;
//   toggleTheme: () => void;
// }

// // const ThemeContext = createContext<{
// //   theme: Theme;
// //   toggleTheme: () => void;
// // } | undefined>(undefined);

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
//   const [theme, setTheme] = useState<Theme>("light");

//   // load initial theme from localStorage or system preference
//   useEffect(() => {
//     const savedTheme = localStorage.getItem('theme') as Theme;

//     if (savedTheme) {
//       setTheme(savedTheme);
//     } else {
//       const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
//       setTheme(prefersDark ? 'dark' : 'light');
//       localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
//     }
//   }, []);

//   // update HTML class based on theme preference
//   useEffect(() => {
//     const root = document.documentElement;

//     if (theme === "dark") {
//       root.classList.add('dark');
//       localStorage.setItem('theme', 'dark');
//     } else {
//       root.classList.remove('dark');
//       localStorage.setItem('theme', 'light');
//     }

//     // if (theme === "dark") {
//     //   document.body.classList.add('dark');
//     //   localStorage.setItem('theme', 'dark');
//     // } else {
//     //   document.body.classList.remove('dark');
//     //   localStorage.setItem('theme', 'light');
//     // }

//     // document.documentElement.classList.toggle("dark", theme === "dark");
//     // localStorage.setItem("theme", theme);
//   }, [theme]);

//   const toggleTheme = () => {
//     setTheme((prev) => (prev === "dark" ? "light" : "dark"));
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = (): ThemeContextType => {
//   const context = useContext(ThemeContext);
//   if (!context) throw new Error("useTheme must be used within a ThemeProvider");
//   return context;
// };
