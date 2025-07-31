/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/utilities/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        galaxy: {
          indigo: "#4b0082",
          nebula: "#6a0dad",
          starlight: "#f0f8ff"
        }
      },
      fontFamily: {
        cosmic: ["'Orbitron'", "sans-serif"]
      },
      backgroundImage: {
        'space-gradient': "linear-gradient(to bottom, black, indigo, gray)"
      }
    }
  },
  plugins: []
}
