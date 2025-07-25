/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   
  // @ts-expect-error - Vitest test configuration is not recognized by Vite types
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Vitestで実行するテストファイルのパターンを指定
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Playwrightのテストファイルを除外
    exclude: ["node_modules/**", "tests/**", "e2e/**", "playwright/**"],
  },
});
