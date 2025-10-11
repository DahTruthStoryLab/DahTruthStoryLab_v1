// tailwind.config.js (ESM)
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
  theme: {
    extend: {
      colors: {
        base:   "#F7FAFC",   // page background
        ink:    "#0F172A",   // primary text
        muted:  "#475569",   // secondary text (higher contrast than before)
        primary:"#4F46E5",   // accessible CTA (indigo-600)
        accent: "#CAB1D6",   // mauve
        gold:   "#D4AF37",   // gold accent
        border: "#E5EDF7",   // light borders for glass UI
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', '"Helvetica Neue"', 'sans-serif'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      borderRadius: {
        glass: '16px',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: "0 8px 28px rgba(0,0,0,0.08)",
        "inner-soft": "inset 0 2px 6px rgba(0,0,0,0.06)",
        glass: "0 16px 40px rgba(15,23,42,0.08)",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "14px",
        lg: "24px",
      },
      backgroundImage: {
        // soft radial spotlight used as bg-radial-fade
        "radial-fade": "radial-gradient(1000px 600px at 50% -120px, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
      },
    },
  },
  plugins: [
    // Glassmorphism helpers
    function ({ addUtilities, theme }) {
      const border = theme("colors.border");
      addUtilities({
        ".glass": {
          backgroundColor: "rgba(255, 255, 255, 0.55)",
          border: `1px solid ${border}`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: theme("borderRadius.glass"),
          boxShadow: theme("boxShadow.soft"),
        },
        ".glass-soft": {
          backgroundColor: "rgba(255,255,255,0.70)",
          border: `1px solid ${border}`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: theme("borderRadius.2xl"),
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        },
        ".glass-panel": {
          backgroundColor: "rgba(255,255,255,0.80)",
          border: `1px solid ${border}`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: theme("borderRadius.3xl"),
          boxShadow: theme("boxShadow.glass"),
        },
      });
    },
  ],
};
