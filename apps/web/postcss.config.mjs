/**
 * PostCSS Configuration
 *
 * This configuration file sets up the PostCSS plugins that process the project's CSS.
 * It's essential for enabling Tailwind CSS and ensuring cross-browser compatibility.
 */
const config = {
  plugins: {
    /**
     * PostCSS Import
     * This plugin must be first. It allows you to use @import statements
     * to combine your CSS files, which is useful for organization.
     */
    "postcss-import": {},
    /**
     * Tailwind CSS Plugin
     * This plugin scans your files for Tailwind classes and generates the
     * corresponding CSS. It must come before autoprefixer.
     */
    tailwindcss: {},
    /**
     * Autoprefixer Plugin
     * This plugin automatically adds vendor prefixes to your CSS rules
     * (e.g., -webkit-, -moz-), ensuring styles are consistent across
     * different browsers.
     */
    autoprefixer: {},
  },
};

export default config;