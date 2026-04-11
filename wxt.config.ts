import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';
import svgr from 'vite-plugin-svgr';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    version: '0.1.4',
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    web_accessible_resources: [
      {
        resources: ['options.html'],
        matches: ['<all_urls>'],
      },
    ],
    permissions: ['storage', 'commands', 'tabs', 'contextMenus', 'sidePanel'],
    commands: {
      "open_panel": {
        description: "__MSG_open_panel_description__",
        global: true
      }
    },
    browser_specific_settings: {
      gecko: {
        id: 'cluelens@cppakko',
        // @ts-expect-error - WXT doesn't support this field yet
        data_collection_permissions: {
          required: ['websiteActivity'],
        },
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss(), svgr()],
  }),
});
