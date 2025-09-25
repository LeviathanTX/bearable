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