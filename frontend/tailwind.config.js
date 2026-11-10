/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F1EDE4',       // Warm organic sand background (not dark, not white)
        surface: {
          DEFAULT: '#FAF6EE',    // Warm bisque card surface
          elevated: '#FCF9F2',
          muted: '#EAE4D6',      // Sandstone muted fill for search & inputs
        },
        borderWarm: {
          DEFAULT: '#DCD4C4',    // Muted handcrafted hairline border
          subtle: '#EAE4D8',
          dark: '#C8BEAD',
        },
        forest: {
          DEFAULT: '#1B3B34',    // Heritage spruce green (deep grounded accent)
          hover: '#142E28',
          light: '#E2ECE6',
        },
        terracotta: {
          50: '#FAF2ED',
          100: '#F6E7DF',
          DEFAULT: '#C25E37',    // Glazed Tuscan Terracotta (distinctive human primary accent)
          hover: '#AA4F2C',
          dark: '#8D3F21',
        },
        charcoal: {
          DEFAULT: '#23201B',    // Rich dark umber/charcoal for headings (never harsh pure black)
          muted: '#5A5347',      // Warm body text
          faint: '#8A8274',      // Meta labels
        },
        sage: {
          50: '#F0F5F2',
          DEFAULT: '#476B5D',
          tint: '#E2EBE5',
        },
        ochre: {
          DEFAULT: '#B88B42',
          tint: '#F6EFE2',
        },
      },
      boxShadow: {
        'warm-sm': '0 1px 2px rgba(35, 32, 27, 0.04)',
        'warm-md': '0 4px 14px rgba(35, 32, 27, 0.05), 0 1px 2px rgba(35, 32, 27, 0.03)',
        'warm-lg': '0 10px 25px -4px rgba(35, 32, 27, 0.08), 0 4px 10px -2px rgba(35, 32, 27, 0.04)',
      },
    },
  },
  plugins: [],
}
