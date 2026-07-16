import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // SuperAdmin module switching:
      //   VITE_SUPERADMIN_SOURCE=stub (default) → no-op stubs for team safety
      //   VITE_SUPERADMIN_SOURCE=real        → real Platform Owner implementation
      // The env variable is read at build time; Vite inlines the alias statically.
      'superadmin': path.resolve(__dirname, 'src/superadmin/index.ts'),
    },
  },
})
