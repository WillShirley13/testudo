# Testudo Test Suite

This directory contains tests for the Testudo Solana program. The tests are organized by functionality and use shared setup utilities.

## Test Structure

The test suite is organized as follows:

- `utils/` - Shared test utilities
  - `setup.ts` - Common test setup and helper functions

- Test files:
  - `legate.test.ts` - Tests for Legate account administration
  - `centurion.test.ts` - Tests for Centurion account operations

## Running Tests

You can run specific test groups or all tests:

```bash
# Run all tests
npm run test:all
# or 
anchor test

# Run only Legate administration tests
npm run test:legate
# or
anchor run legate

# Run only Centurion account tests
npm run test:centurion
# or
anchor run centurion
```

**Important Notes**: 
- All test commands automatically start and stop the Solana validator.
- Tests may take a moment to start as the validator initializes.
- Each test suite runs independently with a fresh validator state.

## Creating New Test Files

To add new test files:

1. Create a new TypeScript file in the `tests` directory (e.g., `my-feature.test.ts`)
2. Import the TestSetup utility:
   ```typescript
   import { TestSetup } from "./utils/setup";
   ```
3. Use a descriptive name for your test suite:
   ```typescript
   describe("My Feature Tests", () => {
       const testContext = new TestSetup();
       
       before(async () => {
           await testContext.initialize();
           // Additional setup specific to these tests
       });
       
       it("should do something", async () => {
           // Test code here
       });
   });
   ```
4. Add a new script to `package.json` to run your tests specifically:
   ```json
   "scripts": {
       "test:my-feature": "anchor test -- -g 'My Feature'"
   }
   ```

## Best Practices

1. Group related tests together with nested `describe` blocks
2. Use descriptive test names that explain what's being tested
3. Add new helper methods to `setup.ts` for common operations
4. Verify results with clear assertion messages
5. Separate test failures from expected errors (use try/catch for expected errors)
6. Clean up after your tests in an `after` block if needed 