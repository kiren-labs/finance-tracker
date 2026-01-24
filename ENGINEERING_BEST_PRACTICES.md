# 🏗️ Engineering Best Practices

> Comprehensive engineering standards and practices for FinChronicle development

**Version**: 1.0.0  
**Last Updated**: January 16, 2026  
**Applies to**: FinChronicle v3.2.1+

---

## 📑 Table of Contents

1. [Code Organization](#-code-organization)
2. [Code Quality](#-code-quality)
3. [Testing Strategy](#-testing-strategy)
4. [Documentation](#-documentation)
5. [Version Control](#-version-control)
6. [Security Practices](#-security-practices)
7. [Performance](#-performance)
8. [Accessibility](#-accessibility)
9. [Build & Deploy](#-build--deploy)
10. [Monitoring & Observability](#-monitoring--observability)

---

## 🗂️ Code Organization

### File Structure

```
finchronicle/
├── .github/                    # GitHub-specific files
│   ├── workflows/             # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/        # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── css/                       # Stylesheets
│   ├── styles.css            # Main styles
│   └── dark-mode.css         # Dark theme
├── js/                       # JavaScript modules
│   ├── app.js                # Main application logic
│   ├── data.js               # Data layer (localStorage)
│   ├── ui.js                 # UI components
│   ├── utils.js              # Utility functions
│   └── charts.js             # Chart rendering
├── tests/                    # Test suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── docs/                     # Extended documentation
│   ├── api/                  # API documentation
│   ├── architecture/         # Architecture diagrams
│   └── guides/               # User guides
├── icons/                    # PWA icons
├── index.html               # Entry point
├── sw.js                    # Service worker
├── manifest.json            # PWA manifest
├── package.json             # Dependencies & scripts
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── jest.config.js          # Jest configuration
└── README.md               # Main documentation
```

### Module Organization

**Principle**: Separation of Concerns

```javascript
// ❌ Bad: Everything in one file
// index.html with 2000+ lines of inline JS

// ✅ Good: Modular architecture
// js/data.js - Data management
export const TransactionStore = {
  save: (transaction) => { ... },
  load: () => { ... },
  delete: (id) => { ... }
};

// js/ui.js - UI components
export const TransactionCard = (transaction) => { ... };

// js/app.js - Application logic
import { TransactionStore } from './data.js';
import { TransactionCard } from './ui.js';
```

### Naming Conventions

```javascript
// Classes: PascalCase
class TransactionManager { }

// Functions: camelCase
function calculateTotal() { }

// Constants: UPPER_SNAKE_CASE
const MAX_TRANSACTION_AMOUNT = 1000000;

// Private: _prefix
class Budget {
  _calculateRemaining() { }  // Private method
}

// Boolean: is/has/should prefix
const isValid = true;
const hasPermission = false;
const shouldUpdate = true;

// Files: kebab-case
// transaction-card.js
// currency-utils.js
// budget-manager.js
```

---

## 🎯 Code Quality

### Linting & Formatting

**ESLint Configuration** (`.eslintrc.json`):

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "serviceworker": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "arrow-spacing": "error",
    "no-duplicate-imports": "error"
  }
}
```

**Prettier Configuration** (`.prettierrc`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

### Code Review Checklist

- [ ] **Readability**: Code is self-documenting
- [ ] **DRY**: No code duplication
- [ ] **SOLID**: Follows SOLID principles
- [ ] **Error Handling**: Proper try-catch blocks
- [ ] **Edge Cases**: Handles edge cases
- [ ] **Security**: No XSS vulnerabilities
- [ ] **Performance**: No performance regressions
- [ ] **Tests**: Adequate test coverage
- [ ] **Documentation**: Code comments and docs updated

### Code Metrics

**Target Metrics:**
- **Cyclomatic Complexity**: < 10 per function
- **Function Length**: < 50 lines
- **File Length**: < 500 lines
- **Parameter Count**: < 5 parameters
- **Nesting Level**: < 4 levels deep

---

## 🧪 Testing Strategy

### Testing Pyramid

```
        /\
       /E2E\         10% - End-to-end tests
      /------\
     /Integration\   20% - Integration tests
    /-----------\
   /    Unit     \  70% - Unit tests
  /--------------\
```

### Unit Tests

**Framework**: Jest + Testing Library

```javascript
// tests/unit/currency-utils.test.js
import { formatCurrency, convertCurrency } from '../../js/utils/currency.js';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    test('formats USD correctly', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    });

    test('formats INR correctly', () => {
      expect(formatCurrency(1000, 'INR')).toBe('₹1,000.00');
    });

    test('handles zero', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    test('handles negative amounts', () => {
      expect(formatCurrency(-500, 'USD')).toBe('-$500.00');
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/transaction-flow.test.js
import { TransactionManager } from '../../js/transaction-manager.js';
import { StorageService } from '../../js/storage.js';

describe('Transaction Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('creates and retrieves transaction', async () => {
    const manager = new TransactionManager();
    
    const transaction = {
      type: 'expense',
      amount: 100,
      category: 'Food',
      date: '2026-01-16'
    };

    const id = await manager.add(transaction);
    const retrieved = await manager.get(id);

    expect(retrieved).toMatchObject(transaction);
  });
});
```

### E2E Tests

**Framework**: Playwright

```javascript
// tests/e2e/add-transaction.spec.js
import { test, expect } from '@playwright/test';

test('add new expense transaction', async ({ page }) => {
  await page.goto('http://localhost:8000');

  // Fill transaction form
  await page.click('[data-testid="expense-tab"]');
  await page.fill('[data-testid="amount"]', '100');
  await page.selectOption('[data-testid="category"]', 'Food');
  await page.fill('[data-testid="notes"]', 'Lunch');
  await page.click('[data-testid="submit"]');

  // Verify transaction appears in list
  await expect(page.locator('.transaction-item').first()).toContainText('Food');
  await expect(page.locator('.transaction-item').first()).toContainText('₹100');
});

test('transaction persists after reload', async ({ page }) => {
  await page.goto('http://localhost:8000');
  
  // Add transaction
  await page.fill('[data-testid="amount"]', '50');
  await page.click('[data-testid="submit"]');
  
  // Reload page
  await page.reload();
  
  // Verify transaction still exists
  await expect(page.locator('.transaction-item')).toHaveCount(1);
});
```

### Test Coverage Goals

- **Overall**: 80%+
- **Critical Paths**: 100%
- **Utils/Helpers**: 90%+
- **UI Components**: 70%+

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:all

# Watch mode
npm run test:watch
```

---

## 📚 Documentation

### Code Documentation

**JSDoc Comments**:

```javascript
/**
 * Calculates the total expenses for a given month
 * @param {Array<Transaction>} transactions - Array of transaction objects
 * @param {string} month - Month in YYYY-MM format
 * @returns {number} Total expenses for the month
 * @throws {Error} If month format is invalid
 * @example
 * const total = calculateMonthlyExpenses(transactions, '2026-01');
 * // Returns: 5000
 */
function calculateMonthlyExpenses(transactions, month) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }
  
  return transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);
}
```

### README Structure

Every project should have:

1. **Title & Description**
2. **Badges** (version, build status, coverage)
3. **Screenshots**
4. **Features**
5. **Installation**
6. **Usage**
7. **API Documentation**
8. **Contributing**
9. **License**
10. **Contact**

### Architecture Documentation

```markdown
# Architecture Decision Record (ADR)

## ADR-001: Use localStorage for Data Persistence

**Status**: Accepted  
**Date**: 2026-01-10

### Context
Need to store transaction data locally without server dependency.

### Decision
Use localStorage API for all data persistence.

### Consequences
**Positive:**
- 100% offline functionality
- Zero server costs
- Complete user privacy
- Simple implementation

**Negative:**
- ~5-10MB storage limit
- No cross-device sync
- Data can be cleared by user

### Alternatives Considered
- IndexedDB: More complex, overkill for current needs
- Cookies: Too limited storage
- Server-side: Against privacy-first principle
```

---

## 🔀 Version Control

### Branch Strategy

**GitFlow Model:**

```
main                    # Production-ready code
  └── develop          # Integration branch
       ├── feature/    # New features
       ├── fix/        # Bug fixes
       ├── docs/       # Documentation
       └── refactor/   # Code refactoring
```

### Commit Messages

**Conventional Commits Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
feat(budget): add monthly budget tracking

- Add budget creation form
- Implement budget progress bars
- Add budget alerts at 80%, 90%, 100%

Closes #42

---

fix(currency): correct INR formatting

Fixes thousand separator for Indian Rupee format.

Fixes #58

---

docs(readme): update installation instructions

Add Python 3 requirement for local server.
```

### Pull Request Guidelines

**PR Template:**

```markdown
## 📋 Description
Brief description of changes

## 🔗 Related Issues
Fixes #123, Closes #456

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested on mobile
- [ ] Tested offline

## 📸 Screenshots
(if UI changes)

## 📝 Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

---

## 🔒 Security Practices

### Input Validation

```javascript
// ✅ Good: Validate and sanitize all inputs
function addTransaction(amount, category, notes) {
  // Validate amount
  if (typeof amount !== 'number' || amount <= 0 || amount > 10000000) {
    throw new Error('Invalid amount');
  }

  // Sanitize text inputs
  const sanitizedCategory = sanitizeHTML(category);
  const sanitizedNotes = sanitizeHTML(notes);

  // Proceed with validated data
  // ...
}

function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### XSS Prevention

```javascript
// ❌ Bad: Directly inserting user content
element.innerHTML = userInput;

// ✅ Good: Use textContent or sanitize
element.textContent = userInput;

// Or use DOMPurify for HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; 
               img-src 'self' data: https:; 
               font-src 'self' cdn.jsdelivr.net;">
```

### Security Checklist

- [ ] All user inputs validated
- [ ] XSS vulnerabilities checked
- [ ] CSRF protection (if server)
- [ ] HTTPS enforced (production)
- [ ] Sensitive data not in localStorage
- [ ] Dependencies security audit
- [ ] No exposed API keys
- [ ] Rate limiting (if applicable)

---

## ⚡ Performance

### Performance Budgets

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | < 1s | 1.5s |
| Time to Interactive | < 2s | 3s |
| Total Bundle Size | < 50KB | 100KB |
| JavaScript Size | < 30KB | 50KB |
| CSS Size | < 15KB | 25KB |
| Images | < 200KB | 500KB |
| Lighthouse Score | > 95 | > 90 |

### Code Splitting

```javascript
// ✅ Good: Lazy load non-critical features
async function loadCharts() {
  const { ChartRenderer } = await import('./charts.js');
  return new ChartRenderer();
}

// Only load when user clicks "View Charts"
document.getElementById('viewCharts').addEventListener('click', async () => {
  const charts = await loadCharts();
  charts.render();
});
```

### Caching Strategy

**Service Worker:**

```javascript
// Cache-first for static assets
const CACHE_NAME = 'finchronicle-v3.2.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json'
];

// Network-first for API calls (if any)
// Stale-while-revalidate for images
```

### Performance Monitoring

```javascript
// Measure key interactions
function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  
  // Send to analytics if available
  if (window.gtag) {
    gtag('event', 'timing_complete', {
      name: name,
      value: Math.round(duration)
    });
  }
  
  return result;
}

// Usage
measurePerformance('Add Transaction', () => {
  addTransaction(data);
});
```

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

**Requirements:**

1. **Perceivable**
   - Text alternatives for images
   - Color contrast ratio ≥ 4.5:1
   - Resizable text up to 200%

2. **Operable**
   - Keyboard navigation
   - No keyboard traps
   - Skip navigation links

3. **Understandable**
   - Clear error messages
   - Consistent navigation
   - Predictable behavior

4. **Robust**
   - Valid HTML
   - Compatible with assistive tech
   - Proper ARIA labels

### Implementation

```html
<!-- ✅ Good: Semantic HTML with ARIA -->
<button 
  aria-label="Add expense transaction" 
  aria-describedby="expense-hint"
  class="primary">
  <i class="ri-add-line" aria-hidden="true"></i>
  Add Expense
</button>
<span id="expense-hint" class="sr-only">
  Opens form to record a new expense
</span>

<!-- ✅ Good: Form labels -->
<label for="amount">
  Amount
  <span aria-label="required">*</span>
</label>
<input 
  id="amount" 
  type="number" 
  required 
  aria-required="true"
  aria-invalid="false"
  aria-describedby="amount-error">
<span id="amount-error" role="alert"></span>
```

### Testing Tools

- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Screen Readers**: NVDA, JAWS, VoiceOver
- **Keyboard Only**: Tab navigation testing

---

## 🚀 Build & Deploy

### Build Process

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "python3 -m http.server 8000",
    "build": "npm run lint && npm run test && npm run minify",
    "lint": "eslint js/**/*.js --fix && prettier --write '**/*.{js,css,html}'",
    "test": "jest --coverage",
    "test:e2e": "playwright test",
    "minify": "terser js/**/*.js -o dist/app.min.js && cssnano css/**/*.css -o dist/styles.min.css",
    "deploy": "npm run build && gh-pages -d .",
    "lighthouse": "lighthouse http://localhost:8000 --view",
    "audit": "npm audit && lighthouse-ci autorun"
  }
}
```

### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linters
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Deployment Checklist

- [ ] All tests passing
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Build successful
- [ ] Performance tested
- [ ] Security audit passed
- [ ] Accessibility audit passed
- [ ] Cross-browser tested
- [ ] Documentation updated
- [ ] Release notes written

---

## 📊 Monitoring & Observability

### Error Tracking

```javascript
// Global error handler
window.addEventListener('error', (event) => {
  const error = {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // Log locally
  console.error('Application Error:', error);
  
  // Send to error tracking service (if implemented)
  // sendToSentry(error);
});
```

### Analytics

```javascript
// Track feature usage
function trackEvent(category, action, label, value) {
  if (window.gtag) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
  
  // Also log locally for debugging
  console.log(`Event: ${category} - ${action}`, { label, value });
}

// Usage examples
trackEvent('Transaction', 'Add', 'Expense', amount);
trackEvent('Export', 'CSV', 'Monthly');
trackEvent('Budget', 'Create', category);
```

### Health Checks

```javascript
// Service health monitoring
async function performHealthCheck() {
  const health = {
    timestamp: new Date().toISOString(),
    storage: {
      available: !!window.localStorage,
      quota: await checkStorageQuota()
    },
    serviceWorker: {
      registered: !!navigator.serviceWorker?.controller,
      state: navigator.serviceWorker?.controller?.state
    },
    features: {
      offline: navigator.onLine === false ? 'working' : 'online',
      pwa: window.matchMedia('(display-mode: standalone)').matches
    }
  };
  
  console.log('Health Check:', health);
  return health;
}

async function checkStorageQuota() {
  if (navigator.storage?.estimate) {
    const { quota, usage } = await navigator.storage.estimate();
    return {
      total: quota,
      used: usage,
      available: quota - usage,
      percentUsed: ((usage / quota) * 100).toFixed(2)
    };
  }
  return null;
}
```

---

## 📋 Summary Checklist

Use this checklist for every feature/release:

### Development
- [ ] Code follows style guide
- [ ] Proper error handling
- [ ] Input validation
- [ ] Performance optimized
- [ ] Accessible (WCAG AA)
- [ ] Security reviewed

### Testing
- [ ] Unit tests written (70%+ coverage)
- [ ] Integration tests
- [ ] E2E tests for critical flows
- [ ] Manual testing completed
- [ ] Cross-browser tested
- [ ] Mobile tested

### Documentation
- [ ] Code comments added
- [ ] JSDoc for public APIs
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Architecture docs (if needed)

### Release
- [ ] Version bumped
- [ ] Git tags created
- [ ] Release notes written
- [ ] Deployed successfully
- [ ] Smoke tests passed

---

## 🎓 Learning Resources

### JavaScript
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)

### Testing
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)

### Performance
- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Accessibility
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)

---

## 📞 Questions?

- 📖 See [CONTRIBUTING.md](CONTRIBUTING.md)
- 🐛 [Report Issues](https://github.com/kiren-labs/finance-tracker/issues)
- 💬 [Discussions](https://github.com/kiren-labs/finance-tracker/discussions)

---

**Last Review**: January 16, 2026  
**Next Review**: April 16, 2026  
**Maintained by**: Kiren Labs
