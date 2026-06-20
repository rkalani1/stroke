import { defineConfig, configDefaults } from 'vitest/config';

// Keep the unit-test gate HONEST. Without an explicit exclude, vitest also
// crawls stale duplicate test copies under untracked agent worktrees
// (.claude/worktrees/**), inflating the count to thousands and obscuring the
// real ~472-test src/ + tests/ suite. Exclude non-source trees here.
export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude, // node_modules, dist, .git, .cache, etc.
      '.claude/**',
      '.discovery/**',
      'mcp/**',
      'output/**',
      'dist/**',
    ],
  },
});
