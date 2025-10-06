# Bearable Health Coach - Agent Instructions

## Quality Verification Protocol
Before marking complete:
1. Run `npm run verify` (lint, type-check, test all pass)
2. Deploy and verify bundle hash changed
3. Test live functionality with actual user actions
4. Check browser console for errors
5. Report specific evidence (not "should work")

## Error Handling Priority
Fix in this order to avoid cascade failures:
1. Syntax errors (code won't run)
2. Type errors (TypeScript compilation)
3. Test failures (functionality broken)
4. Lint errors (code style)
5. Warnings (potential issues)

## Project-Specific Configuration

### Voice System Architecture
- Voice API server: port 3002 (`node server.js`)
- React app: port 3001 (`npm start`)
- Premium voice: OpenAI TTS with local API fallback
- Browser voice fallback automatically enabled

### Development Workflow
- Always test voice functionality end-to-end after changes
- Verify both server and client components work together
- Test fallback mechanisms when primary voice services unavailable

## When Debugging
- Add console.logs temporarily but remove before committing
- Don't make superficial fixes - address root causes
- Use test output to guide fixes, don't guess
- If tests timeout, check for infinite loops or uncaught promises
