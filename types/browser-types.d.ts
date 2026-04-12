// browser-types.d.ts
import "@wxt-dev/browser";
import type { SidebarAction } from "webextension-polyfill";

declare module "@wxt-dev/browser" {
  namespace Browser {
    export const sidebarAction: SidebarAction.Static;
  }
}