# Testing Documentation

This document describes the testing setup and practices for the Evvl application.

## Test Framework

We use **Jest** with **React Testing Library** for testing. This provides:
- Unit testing for utilities and functions
- Component testing for React components
- Integration testing for user interactions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs tests when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized using the `__tests__` directory pattern:

```
lib/
  __tests__/
    storage.test.ts
components/
  __tests__/
    navigation.test.tsx
app/
  __tests__/
    page.test.tsx
  settings/
    __tests__/
      page.test.tsx
```

## What We Test

### 1. Storage Utilities (`lib/__tests__/storage.test.ts`)
Tests for localStorage wrapper functions:
- ✅ Saving and loading API keys
- ✅ Clearing API keys
- ✅ Saving eval results with 50-item limit
- ✅ Loading eval history
- ✅ Deleting individual eval results
- ✅ Getting eval by ID

### 2. Navigation Component (`components/__tests__/navigation.test.tsx`)
Tests for the navigation bar:
- ✅ Rendering all navigation links
- ✅ Correct href attributes
- ✅ Logo link functionality
- ✅ Styling classes

### 3. Settings Page (`app/settings/__tests__/page.test.tsx`)
Tests for the settings/configuration page:
- ✅ Rendering input fields for all providers
- ✅ Loading existing API keys
- ✅ Updating input values
- ✅ Saving API keys
- ✅ Clearing all API keys
- ✅ Display of privacy notes and help links

### 4. Main Eval Page (`app/__tests__/page.test.tsx`)
Tests for the core evaluation functionality:
- ✅ Rendering prompt input and generate button
- ✅ Rendering all three provider columns
- ✅ Configuration state handling
- ✅ Prompt input updates
- ✅ Generate button enable/disable logic
- ✅ API calls for configured providers
- ✅ Display of generated content
- ✅ Token count and latency display
- ✅ Error handling for API failures
- ✅ Network error handling
- ✅ Parallel generation for multiple providers

## Test Configuration

### `jest.config.js`
- Uses Next.js Jest configuration
- Sets up module path mapping for `@/` imports
- Configures jsdom test environment
- Enables coverage collection

### `jest.setup.js`
- Imports `@testing-library/jest-dom` for additional matchers
- Mocks localStorage for tests

## Mocking Strategy

### localStorage
We provide a full localStorage mock that maintains state within tests:
```javascript
class LocalStorageMock {
  store = {};
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}
```

### Next.js Components
- `next/link` is mocked to render as `<a>` tags
- `next/image` is mocked to render as `<img>` tags

### Fetch API
Tests mock `global.fetch` to simulate API responses without making real network calls.

## Test Coverage

Current test coverage:
- **4 test suites**: All passing
- **45 tests**: All passing
- **10 tests**: Skipped (API route tests - see note below)

## Known Limitations

### API Route Tests
The API route tests in `app/api/generate/__tests__/route.test.ts` are currently skipped because testing Next.js API routes requires additional setup for mocking the Request/Response objects.

**To implement these properly, consider:**
- Using `node-mocks-http` for HTTP request/response mocking
- Using `next-test-api-route-handler` for Next.js-specific API route testing

## Best Practices

1. **Clear State**: Always clear localStorage and mocks in `beforeEach` blocks
2. **User Events**: Use `@testing-library/user-event` for realistic user interactions
3. **Async Testing**: Use `waitFor` for asynchronous operations
4. **Query Priority**: Prefer `getByRole` and `getByLabelText` over `getByText` when possible
5. **Test Behavior**: Focus on testing user-facing behavior, not implementation details

## Adding New Tests

When adding a new feature:

1. Create a `__tests__` directory next to the code you're testing
2. Name test files with `.test.ts` or `.test.tsx` extension
3. Group related tests using `describe` blocks
4. Clear state in `beforeEach` hooks
5. Write tests for both success and error cases
6. Run tests locally before committing

## Continuous Integration

To add CI/CD testing:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
```
