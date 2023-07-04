/** @type {import('tailwindcss').Config} */
// tailwind.config.js
const FormKitVariants = require('@formkit/themes/tailwindcss')

module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  content: [
    './src/**/*.{html,js,vue}',
    './node_modules/@formkit/themes/dist/tailwindcss/genesis/index.cjs'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: [FormKitVariants]
}
