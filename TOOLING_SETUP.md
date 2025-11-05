# Development Tooling Setup

This document describes all the development tools configured for this project.

## 🎨 Code Quality Tools

### Prettier (Code Formatter)

- **Config**: `.prettierrc`
- **Ignore**: `.prettierignore`
- **Scripts**:
  - `npm run format` - Auto-format all source files
  - `npm run format:check` - Check if files need formatting
- **Settings**: Single quotes, 100 char width, 2 space tabs

### ESLint (Linter)

- **Config**: `package.json` > `eslintConfig`
- **Extends**: `react-app`, `react-app/jest`, `prettier`
- **Scripts**:
  - `npm run lint` - Check for lint errors
  - `npm run lint:fix` - Auto-fix lint errors

### TypeScript

- **Config**: `tsconfig.json`
- **Script**: `npm run type-check` - Validate TypeScript without building

## 🪝 Git Hooks (Husky)

All git hooks are managed by Husky in `.husky/` directory.

### Pre-commit Hook

- Runs `lint-staged` automatically
- Only checks files you're committing (fast!)
- Auto-formats with Prettier
- Auto-fixes ESLint issues
- **What runs**: Prettier + ESLint on staged files only

### Pre-push Hook

- Runs full test suite before pushing
- If tests fail, automatically calls Claude to fix them
- Blocks push if tests still fail after auto-fix
- **What runs**: `npm test`

## 📦 lint-staged

Runs linters only on staged files (much faster than full project linting).

**Config** (in `package.json`):

```json
{
  "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix", "git add"],
  "*.{json,css,md}": ["prettier --write", "git add"]
}
```

## 🧪 Testing

- **Framework**: Jest + React Testing Library
- **Scripts**:
  - `npm test` - Run tests with coverage
  - `npm run test:watch` - Interactive watch mode
  - `npm run test:ci` - CI-optimized test run

## ✅ Verification

### Comprehensive Verification

```bash
npm run verify
```

Runs in order:

1. `npm run format:check` - Prettier
2. `npm run lint` - ESLint
3. `npm run type-check` - TypeScript
4. `npm run test` - Jest

### Claude Commands

- `npm run claude:fix` - Ask Claude to fix issues
- `npm run claude:test-loop` - Automated test fixing loop
- `/verify-pr` - Comprehensive PR verification
- `/test-loop` - Automated test fixing (max 5 iterations)
- `/fix-and-test` - TDD approach for bug fixes

## 🔧 Environment Setup

### Environment Variables

See `.env.example` for all available environment variables:

- `REACT_APP_OPENAI_API_KEY` - OpenAI API (required)
- `REACT_APP_ELEVENLABS_API_KEY` - ElevenLabs voice (optional)
- `REACT_APP_CLAUDE_API_KEY` - Claude API (optional)
- `REACT_APP_SENTRY_DSN` - Sentry error tracking (optional)
- `REACT_APP_VOICE_ENABLED` - Enable voice features (true/false)

### Interactive Setup

```bash
npm run setup
```

Walks you through API key configuration.

## 🤖 Claude Code Hooks

**Location**: `.claude/settings.json`

### PostToolUse Hooks

- **After editing `.ts/.tsx/.js/.jsx`**: Runs tests with `--bail` flag
- **After editing `package.json`**: Runs `npm install && npm audit`

## 🚀 CI/CD (GitHub Actions)

### Workflows

1. **claude.yml** - Claude Code Assistant integration
2. **auto-fix-tests.yml** - Automated test fixing on PRs
3. **vercel-preview.yml** - Preview deployments
4. **security-review.yml** - Security scanning on PRs

## 📋 Common Workflows

### Before Committing

```bash
npm run format          # Auto-format your code
npm run lint:fix        # Auto-fix lint issues
npm run verify          # Run all checks
```

### Starting Development

```bash
npm install             # Install dependencies
npm run setup           # Configure API keys
npm start               # Start dev server (port 3001)
node server.js          # Start voice API server (port 3002)
```

### Before Pushing

```bash
npm run verify          # Ensure everything passes
git push                # pre-push hook runs tests automatically
```

## 🎯 Key Benefits

1. **Automatic Formatting**: Never argue about code style again
2. **Fast Pre-commit Checks**: Only lints files you're changing
3. **Test Safety Net**: Can't push broken tests
4. **Claude Auto-fix**: Tests failing? Claude attempts to fix them
5. **Consistent Verification**: Same checks locally and in CI
6. **Environment Documentation**: `.env.example` shows what's needed

## 🔍 Troubleshooting

### Git hooks not running?

```bash
git config core.hooksPath .husky
```

### Prettier and ESLint fighting?

They're configured to work together via `eslint-config-prettier`.

### Tests slow?

Use `npm run test:watch` for faster feedback during development.

### Need to skip hooks?

```bash
git commit --no-verify  # Skip pre-commit
git push --no-verify    # Skip pre-push
```

(Use sparingly!)
