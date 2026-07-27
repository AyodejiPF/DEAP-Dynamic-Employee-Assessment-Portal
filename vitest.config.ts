import { defineConfig } from 'vitest/config'

// Added 27 Jul 2026, world class readiness pass. StaffiQ had zero test
// infrastructure before this. Kept separate from vite.config.ts on purpose,
// vitest reads its own config file cleanly without needing the app's
// superadmin path alias or the React plugin for pure logic tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
