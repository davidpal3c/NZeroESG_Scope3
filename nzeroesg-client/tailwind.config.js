module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--background) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                'secondary-bg': 'rgb(var(--secondary-bg) / <alpha-value>)',
                'secondary-fg': 'rgb(var(--secondary-fg) / <alpha-value>)',
                card: 'rgb(var(--card) / <alpha-value>)',
                'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
                muted: 'rgb(var(--muted) / <alpha-value>)',
                'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                primary: 'rgb(var(--primary) / <alpha-value>)',
                secondary: 'rgb(var(--secondary) / <alpha-value>)',
                tertiary: 'rgb(var(--tertiary) / <alpha-value>)',
                accent: 'rgb(var(--accent) / <alpha-value>)',
            }
        },
    },
    plugins: [],
    safelist: [
        'dark',
        'bg-white',
        'dark:bg-gray-800',
        'bg-gray-50',
        'dark:bg-gray-900',
        'text-gray-900',
        'dark:text-gray-100'
    ]
};