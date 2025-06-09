"use client";

import { ThemeProvider } from "./utils/contexts/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    );
}