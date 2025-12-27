import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "purpl-green": "#76715A",
        "purpl-orange": "#ED693A",
        "purpl-ecru": "#EDEAE3",
        "purpl-black": "#171717",
        "purpl-sable": "#D4D4D4",
      },
    },
  },
  plugins: [],
};

export default config;


