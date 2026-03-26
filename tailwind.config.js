/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        blue: { DEFAULT: '#4d65ff', dim: '#3a4fd4' },
      },
    },
  },
  plugins: [],
};
