# Claude CLI GitHub Actions Testing Automation Setup

## Objective
Set up a comprehensive GitHub Actions integration that automatically tests code changes, fixes failures, and prevents broken code from being merged. This eliminates the frustration of being told something is "fixed" when it clearly has errors.

## Phase 1: Initial GitHub Integration Setup

First, let's install the GitHub integration:

```bash
/install-github-app
```

After running this command, follow the OAuth prompts to connect your repository.

## Phase 2: Core Workflow Files Setup

Create the following GitHub Actions workflow files:

### 2.1 Main Claude Workflow
Create `.github/workflows/claude.yml`:

```yaml
name: Claude Code Assistant
on:
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]
  issues:
    types: [opened, labeled]

jobs:
  claude-assist:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request') ||
      (github.event_name == 'issues')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Run Tests First
        id: initial-tests
        continue-on-error: true
        run: |
          npm ci
          npm test 2>&1 | tee test-output.txt
          echo "exit_code=$?" >> $GITHUB_OUTPUT
          
      - name: Claude Analysis
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          claude_args: |
            --model claude-opus-4-1-20250805
            --max-turns 10
            
      - name: Run Tests After Claude Changes
        if: steps.initial-tests.outputs.exit_code != '0'
        run: |
          npm test
          npm run lint
          npm run type-check || true
```

### 2.2 Automatic Test-Fix Loop
Create `.github/workflows/auto-fix-tests.yml`:

```yaml
name: Auto-Fix Failed Tests
on:
  pull_request:
    types: [opened, synchronize]
  workflow_dispatch:

jobs:
  test-and-fix:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          ref: ${{ github.head_ref }}
          
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Test Suite
        id: test-run
        continue-on-error: true
        run: |
          set +e
          npm test 2>&1 | tee test-results.log
          TEST_EXIT=$?
          echo "test_exit=$TEST_EXIT" >> $GITHUB_OUTPUT
          
          npm run lint 2>&1 | tee -a test-results.log
          LINT_EXIT=$?
          echo "lint_exit=$LINT_EXIT" >> $GITHUB_OUTPUT
          
          npm run type-check 2>&1 | tee -a test-results.log
          TYPE_EXIT=$?
          echo "type_exit=$TYPE_EXIT" >> $GITHUB_OUTPUT
          
          if [ $TEST_EXIT -ne 0 ] || [ $LINT_EXIT -ne 0 ] || [ $TYPE_EXIT -ne 0 ]; then
            echo "has_failures=true" >> $GITHUB_OUTPUT
          else
            echo "has_failures=false" >> $GITHUB_OUTPUT
          fi
          
      - name: Auto-Fix with Claude
        if: steps.test-run.outputs.has_failures == 'true'
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            The automated tests have failed. Here are the results:
            
            Test Exit Code: ${{ steps.test-run.outputs.test_exit }}
            Lint Exit Code: ${{ steps.test-run.outputs.lint_exit }}
            Type Check Exit Code: ${{ steps.test-run.outputs.type_exit }}
            
            Full output:
            ```
            $(cat test-results.log)
            ```
            
            Please fix ALL the issues found above. Make sure to:
            1. Fix any failing tests
            2. Resolve all linting errors
            3. Fix any TypeScript type errors
            4. Run the tests yourself to verify they pass
            5. Commit the fixes with a clear message explaining what was fixed
            
      - name: Verify Fix
        if: steps.test-run.outputs.has_failures == 'true'
        run: |
          echo "Verifying Claude's fixes..."
          npm test
          npm run lint
          npm run type-check
          echo "✅ All tests passing after Claude's fixes!"
```

### 2.3 Security Review Workflow
Create `.github/workflows/security-review.yml`:

```yaml
name: Security Review
on:
  pull_request:
    paths:
      - '**/*.ts'
      - '**/*.tsx'
      - '**/*.js'
      - '**/*.jsx'
      - '**/package.json'
      - '**/package-lock.json'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Claude Security Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            /security-review
            
            Perform a comprehensive security review of this PR. Check for:
            - SQL injection vulnerabilities
            - XSS vulnerabilities
            - Authentication/authorization issues
            - Sensitive data exposure
            - Dependency vulnerabilities
            - CORS misconfigurations
            - Rate limiting issues
            
            If you find any security issues, create comments on the specific lines.
```

## Phase 3: Claude CLI Configuration

### 3.1 Create Project-Specific Settings
Create `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit:*.ts|Edit:*.tsx|Edit:*.js|Edit:*.jsx",
        "hooks": [
          {
            "type": "command",
            "command": "npm test --bail 2>/dev/null || echo '❌ Tests failing - will be fixed in CI'"
          }
        ]
      },
      {
        "matcher": "Edit:package.json",
        "hooks": [
          {
            "type": "command",
            "command": "npm install && npm audit"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit:*",
        "hooks": [
          {
            "type": "command",
            "command": "git stash && npm test && git stash pop || git stash pop"
          }
        ]
      }
    ]
  }
}
```

### 3.2 Create Custom Commands
Create `.claude/commands/test-loop.md`:

```markdown
# Test Loop Command

Run a comprehensive test loop until all tests pass:

1. Run all test suites (unit, integration, e2e)
2. If any fail, analyze the errors
3. Fix the issues
4. Re-run tests
5. Repeat until all pass
6. Create a summary of what was fixed

Maximum iterations: 5

After all tests pass, commit with message: "fix: resolved test failures - <brief summary>"
```

Create `.claude/commands/verify-pr.md`:

```markdown
# Verify PR Command

Comprehensive PR verification:

1. Check out the PR branch
2. Install dependencies
3. Run all tests
4. Run linting
5. Run type checking
6. Run build
7. Check for console.logs in production code
8. Verify no sensitive data in commits
9. Create a markdown report of the verification

If any issues found, fix them and push to the PR branch.
```

Create `.claude/commands/fix-and-test.md`:

```markdown
# Fix and Test Command

For the file or issue specified in $ARGUMENTS:

1. Identify the problem
2. Write tests that expose the bug (TDD approach)
3. Fix the implementation
4. Verify all tests pass
5. Run related tests to ensure no regressions
6. Update documentation if needed
7. Commit with conventional commit message

Always verify your fixes work before claiming they're complete.
```

## Phase 4: Git Hooks Setup

Create `.githooks/pre-push`:

```bash
#!/bin/bash
echo "Running pre-push validation..."

# Run tests
npm test > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Tests are failing. Asking Claude to fix them..."
  claude -p "Tests are failing on pre-push. Fix them before pushing." --no-confirm
  npm test
  if [ $? -ne 0 ]; then
    echo "❌ Tests still failing after Claude's attempt. Push blocked."
    exit 1
  fi
fi

echo "✅ All tests passing"
```

Make it executable and install:
```bash
chmod +x .githooks/pre-push
git config core.hooksPath .githooks
```

## Phase 5: Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit",
    "verify": "npm run lint && npm run type-check && npm run test",
    "claude:fix": "claude -p 'Run npm run verify and fix any issues found'",
    "claude:test-loop": "claude /test-loop"
  }
}
```

## Phase 6: CLAUDE.md Configuration

Create `CLAUDE.md` in your project root:

```markdown
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
```

## Phase 7: Execution Instructions

Run these commands in order:

1. First, let me set up the GitHub integration:
   ```bash
   /install-github-app
   ```

2. Create all the workflow files listed above

3. Add your Anthropic API key to GitHub secrets:
   - Go to your repo Settings → Secrets and variables → Actions
   - Add `ANTHROPIC_API_KEY` with your key

4. Test the setup:
   ```bash
   git checkout -b test-claude-integration
   echo "// Test comment" >> index.js
   git add . && git commit -m "test: verify Claude integration"
   git push origin test-claude-integration
   ```

5. Create a PR and comment: `@claude can you add a test for this file?`

## Phase 8: Verification

After setup, verify everything works:

1. **Test Auto-Fix**: Intentionally break a test, push it, and watch Claude fix it
2. **Security Review**: Make a PR with a console.log containing passwords
3. **Test Loop**: Run `/test-loop` on a file with broken tests
4. **PR Review**: Have Claude review an existing PR

## Troubleshooting

If you get "gh: Not Found (HTTP 404)":
```bash
gh auth refresh -h github.com -s workflow
```

If Claude doesn't respond to @mentions:
- Verify the GitHub App is installed on your repo
- Check that workflows have permission to run
- Ensure ANTHROPIC_API_KEY is set correctly

If tests keep failing after Claude's fixes:
- Check if Claude has access to all test files
- Ensure test environment is properly configured
- Verify Claude can run the tests locally

## Success Metrics

You'll know this is working when:
- PRs automatically show test status
- Failed tests get fixed without your intervention
- Security issues are caught before merge
- You never hear "it's fixed" when it's not
- Your velocity increases because you're not debugging Claude's mistakes

Remember: The goal is to catch errors BEFORE you waste time manually testing, not after!
