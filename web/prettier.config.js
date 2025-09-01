/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ['prettier-plugin-tailwindcss', 'prettier-plugin-classnames'],
  semi: false,
  singleQuote: true,
}
export default config
