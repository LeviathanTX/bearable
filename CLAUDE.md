# Claude Configuration for This Project

## Testing Philosophy
- ALWAYS run tests before claiming something is fixed
- If tests fail after your changes, fix them before committing
- Write tests for new features before implementing them
- Use the test output to guide your fixes, don't guess

## Workflow Rules
1. Before saying "I've fixed it", run: `npm run verify`
2. If any tests fail, analyze the actual error message
3. Don't make superficial fixes - address root causes
4. When debugging, add console.logs temporarily but remove them before committing
5. Always verify types compile with `npm run type-check`

## Common Issues and Solutions
- If you see "Cannot find module" errors: Run `npm install` first
- If types are failing: Check tsconfig.json and ensure imports are correct
- If tests timeout: The code might have infinite loops or uncaught promises
- If lint fails: Run `npm run lint:fix` to auto-fix, then handle remaining issues

## Git Commit Standards
- Use conventional commits: feat:, fix:, chore:, docs:, test:, refactor:
- Include ticket number if applicable
- Keep commits focused on single changes
- Run tests before every commit

## Error Handling Priority
1. Syntax errors (code won't run)
2. Type errors (TypeScript compilation)
3. Test failures (functionality broken)
4. Lint errors (code style)
5. Warning messages (potential issues)

Fix in this order to avoid cascade failures.

## Voice System Configuration
- Voice API server runs on port 3002 (node server.js)
- React app runs on port 3001 (npm start)
- Premium voice uses OpenAI TTS with local API fallback
- Browser voice fallback is automatically enabled

## Key Commands
- `npm run verify` - Run all checks (lint, type-check, test)
- `npm test` - Run tests with coverage
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - Check TypeScript types
- `claude /test-loop` - Run automated test fixing loop
- `claude /verify-pr` - Comprehensive PR verification