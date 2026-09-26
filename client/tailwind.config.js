/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        india: {
          saffron: '#FF9933',
          white: '#FFFFFF',
          green: '#138808',
          navy: '#000080',
        },
        slate: {
          850: '#151f32',
          950: '#070d17',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 25px rgba(245, 158, 11, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
