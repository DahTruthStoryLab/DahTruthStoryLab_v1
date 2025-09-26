/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#F7FAFC",        // off-white background
        primary: "#EAF2FF",     // very light blue
        accent: "#CAB1D6",      // mauve
        gold: "#D4AF37",        // gold accent
        ink: "#0F172A",         // dark text
        muted: "#94A3B8",       // subtle text / borders
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', '"Helvetica Neue"', 'sans-serif'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      borderRadius: {
        'glass': '16px',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: "0 8px 28px rgba(0,0,0,0.08)",
        "inner-soft": "inset 0 2px 6px rgba(0,0,0,0.06)",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "14px",
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at 20% 10%, rgba(202,177,214,0.25), rgba(234,242,255,0) 60%)",
      },
    },
  },
  plugins: [
    // Simple glassmorphism utility: className="glass"
    function ({ addUtilities, theme }) {
      addUtilities({
        ".glass": {
          backgroundColor: "rgba(255, 255, 255, 0.55)",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: theme("borderRadius.glass"),
          boxShadow: theme("boxShadow.soft"),
        },
      });
    },
  ],
};
