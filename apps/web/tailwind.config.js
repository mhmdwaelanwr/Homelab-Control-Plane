const config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
                panel: 'rgb(var(--color-panel) / <alpha-value>)',
                panelAlt: 'rgb(var(--color-panel-alt) / <alpha-value>)',
                line: 'rgb(var(--color-line) / <alpha-value>)',
                brand: 'rgb(var(--color-brand) / <alpha-value>)',
                accent: 'rgb(var(--color-accent) / <alpha-value>)',
                accentSoft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                info: 'rgb(var(--color-info) / <alpha-value>)',
                warning: 'rgb(var(--color-warning) / <alpha-value>)',
                danger: 'rgb(var(--color-danger) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['"Nunito Sans"', 'sans-serif'],
                display: ['"Nunito Sans"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            boxShadow: {
                panel: '0 24px 80px rgba(0, 0, 0, 0.32)',
            },
            backgroundImage: {
                grid: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
            },
        },
    },
    plugins: [],
};
export default config;
