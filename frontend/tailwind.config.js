/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // 1. O index.html está na raiz da pasta frontend
    "./index.html",
    // 2. Os componentes .jsx estão em src/
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
