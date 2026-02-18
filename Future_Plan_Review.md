
## 📊 **EXECUTIVE SUMMARY**

Your roadmap is **well-structured** with a logical phased approach. However, there are **critical architectural decisions**, **data integrity concerns**, and **PWA-specific challenges** that need addressing before implementation.

---

## 🎯 **CRITICAL ISSUES & RISKS**

### 1. **Database Schema Migration Strategy - HIGH RISK**

**Problem:** Your plan bumps DB versions across 7 releases (v1 → v7), but IndexedDB migrations are **not backwards compatible** and **cannot be reversed**.

**Current State:**
```javascript
const DB_VERSION = 1;  // app.js line 7
```

**Your Plan's Migration Path:**
```
v3.11.0: DB v1 → v2 (add recurringTemplates)
v3.12.0: DB v2 (add optional fields) ❌ NO VERSION BUMP
v3.13.0: DB v2 → v3 (add budgets)
v3.14.0: DB v3 → v4 (add tags field + index)
v3.15.0: DB v4 → v5 (add split fields)
v3.16.0: DB v5 → v6 (add savingsGoals)
v3.17.0: DB v6 → v7 (add receipts)
```

**Critical Flaw:** v3.12.0 adds 7 optional fields WITHOUT bumping DB version. This means:
- No `onupgradeneeded` trigger
- No formal migration code
- Users who skip v3.12.0 will have schema mismatch
- Future migrations won't know if optional fields exist

**Solution:**
```javascript
// v3.12.0 MUST bump to DB v3, not stay at v2
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const oldVersion = event.oldVersion;
    
    // v2: Add recurring templates
    if (oldVersion < 2) {
        const recurringStore = db.createObjectStore('recurringTemplates', { keyPath: 'id' });
        recurringStore.createIndex('nextDueDate', 'nextDueDate');
        recurringStore.createIndex('enabled', 'enabled');
    }
    
    // v3: Add optional fields metadata (localStorage schema version)
    if (oldVersion < 3) {
        // Set flag that optional fields are available
        localStorage.setItem('db_schema_version', '3');
        localStorage.setItem('optional_fields_available', 'true');
    }
    
    // v4: Add budgets...
};
```

**Recommendation:** Bump DB version even for nullable field additions. Use feature flags in localStorage to track schema evolution.

---

### 2. **Optional Fields System - Architectural Flaw**

**Problem:** Your design stores field enablement state in localStorage but data in IndexedDB. This creates **data integrity nightmares**.

**Scenario:**
1. User enables all optional fields
2. Records 500 transactions with merchant, paymentMethod, etc.
3. User clears browser cache (wipes localStorage)
4. App loads with **default config** (all fields disabled)
5. User's 500 transactions now have "hidden" data with no UI to access it

**Current Architecture:**
```javascript
// localStorage (volatile, easily cleared)
enabledFields: {
    paymentMethod: true,
    merchant: true,
    // ...deletable by user or browser
}

// IndexedDB (persistent)
transactions: [
    { id: 1, paymentMethod: 'UPI', merchant: 'Amazon', ... }
]
```

**Better Solution - Store Config in IndexedDB:**
```javascript
// New ObjectStore: appSettings
{
    id: 'config',
    enabledFields: {
        paymentMethod: true,
        merchant: true,
        account: true,
        expenseType: false,
        attachedTo: false,
        referenceId: false,
        location: false
    },
    version: '3.12.0',
    lastUpdated: '2026-03-15T10:00:00Z'
}
```

**Alternative - Auto-Enable on Data Detection:**
```javascript
// On app load, scan for existing data
function autoDetectEnabledFields() {
    const fieldsWithData = {
        paymentMethod: transactions.some(t => t.paymentMethod),
        merchant: transactions.some(t => t.merchant),
        account: transactions.some(t => t.account),
        // ...
    };
    
    // Auto-enable fields that have data
    // Override localStorage if conflict
    return fieldsWithData;
}
```

---

### 3. **Recurring Transactions - Date/Time Complexity**

**Problem:** Your design uses `nextDueDate` but doesn't account for timezone issues, daylight saving time, or execution timing.

**Current Plan:**
```javascript
{
    frequency: 'monthly',      // ❌ Too vague
    nextDueDate: '2026-03-01'  // ❌ No time component
}
```

**Issues:**
- What if user opens app at `2026-03-01 23:59:59`? Does it trigger?
- What if user's timezone differs from nextDueDate's implicit timezone?
- Daylight saving time can shift daily budgets by 1 hour
- "Monthly" on Jan 31 → what's the next date? (Feb 28/29?)

**Better Design:**
```javascript
{
    frequency: 'monthly',
    dayOfMonth: 1,              // Or 'last' for month-end
    executionTime: '09:00',     // Consistent execution time
    timezone: 'Asia/Kolkata',   // Store user's timezone
    lastExecuted: '2026-02-01T09:00:00+05:30',  // ISO with timezone
    nextDue: '2026-03-01T09:00:00+05:30',
    skipWeekends: false,        // Business logic option
    skipHolidays: false
}

// Execution logic
function checkRecurringTransactions() {
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    templates.forEach(template => {
        const nextDue = new Date(template.nextDue);
        
        // Only execute if:
        // 1. We're past the due date
        // 2. Execution time has passed (with 1-hour grace period)
        if (now >= nextDue && !executedToday(template)) {
            generateTransaction(template);
            updateNextDueDate(template);
        }
    });
}
```

---

### 4. **Receipt Photos - Storage Quota Management Missing**

**Problem:** Your plan mentions storage monitoring but doesn't provide a **quota enforcement strategy** before users hit the limit.

**Current Browser Limits (Estimated):**
```
Desktop Chrome:    60% of free disk space (up to ~60GB on 100GB free)
Mobile Chrome:     ~500MB - 1GB
iOS Safari:        ~500MB - 1GB
Firefox:           ~2GB (with user prompt)
```

**Your Plan:**
```javascript
- checkStorageQuota() ✅
- compressImage() ✅
- getTotalStorageUsed() ✅
- showStorageWarning() ❌ WHEN to show? At 80%? 90%?
```

**Missing Implementation:**
```javascript
// 1. Pre-flight check BEFORE upload
async function canAddReceipt(fileSize) {
    const estimate = await navigator.storage.estimate();
    const available = estimate.quota - estimate.usage;
    const afterUpload = estimate.usage + fileSize;
    const percentUsed = (afterUpload / estimate.quota) * 100;
    
    if (percentUsed > 90) {
        showCriticalStorageWarning();
        return false;
    }
    if (percentUsed > 80) {
        showStorageWarning();
        // Allow but warn
    }
    return true;
}

// 2. Proactive cleanup suggestions
function suggestCleanup() {
    const oldReceipts = getReceiptsOlderThan(365); // 1 year
    if (oldReceipts.length > 50) {
        showModal({
            title: 'Storage Cleanup',
            message: `You have ${oldReceipts.length} receipts older than 1 year. Delete them to free up space?`,
            actions: [
                { label: 'View Receipts', action: () => showReceiptList(oldReceipts) },
                { label: 'Delete All Old', action: () => bulkDeleteReceipts(oldReceipts) },
                { label: 'Not Now', action: () => {} }
            ]
        });
    }
}

// 3. Automatic downsizing on quota pressure
async function adaptiveCompression(file) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;
    
    let quality = 0.8;
    if (percentUsed > 90) quality = 0.5;
    else if (percentUsed > 80) quality = 0.6;
    else if (percentUsed > 70) quality = 0.7;
    
    return compressImage(file, quality);
}
```

---

## 🔧 **ARCHITECTURAL IMPROVEMENTS**

### 5. **Reports & Visualizations - Performance Bottleneck**

**Problem:** Your plan uses HTML/CSS-only charts, which is great for avoiding dependencies, but **doesn't account for rendering 1000+ transactions**.

**Calculation Complexity:**
```javascript
// Your planned approach
function generateCategoryPieData() {
    // Filter transactions by date range
    const filtered = transactions.filter(t => inDateRange(t));  // O(n)
    
    // Group by category
    const grouped = {};
    filtered.forEach(t => {  // O(n)
        grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    
    // Sort by amount
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);  // O(k log k)
    
    return sorted;
}

// Called for EVERY report type on EVERY render
// With optional fields: 9+ reports × 1000 transactions = 9000+ iterations
```

**Solution - Implement Caching:**
```javascript
let reportCache = {
    dateRange: null,
    enabledFields: null,
    data: null
};

function generateAllReports() {
    const currentRange = getSelectedDateRange();
    const currentFields = getEnabledFields();
    
    // Cache hit
    if (reportCache.dateRange === currentRange && 
        JSON.stringify(reportCache.enabledFields) === JSON.stringify(currentFields)) {
        return reportCache.data;
    }
    
    // Cache miss - regenerate
    const filtered = transactions.filter(t => inDateRange(t, currentRange));
    
    const reports = {
        categoryPie: generateCategoryPieData(filtered),
        monthlyTrend: generateMonthlyTrendData(filtered),
        // ...only generate for enabled fields
    };
    
    if (currentFields.paymentMethod) {
        reports.paymentMethod = generatePaymentMethodBreakdown(filtered);
    }
    
    reportCache = { dateRange: currentRange, enabledFields: currentFields, data: reports };
    return reports;
}

// Invalidate cache only when data changes
function saveTransactionToDB(transaction) {
    reportCache = { dateRange: null, enabledFields: null, data: null };
    // ... existing save logic
}
```

---

### 6. **Budget Limits - Missing Rollover Logic**

**Problem:** Your budget plan doesn't specify what happens when a month ends. Most personal finance apps offer **rollover budgets**.

**Example:**
```
Groceries Budget: ₹10,000/month
January: Spent ₹8,000 → Saved ₹2,000
February: Should budget be ₹10,000 or ₹12,000?
```

**User Expectations (from accounting perspective):**
- **Envelope budgeting:** Rollover unused funds
- **Zero-based budgeting:** Reset to ₹10,000 each month
- **Percentage-based:** Adjust based on rolling average

**Recommendation:**
```javascript
{
    id: number,
    category: string,
    monthlyLimit: number,
    rolloverEnabled: boolean,  // ✅ ADD THIS
    rolloverBalance: number,   // ✅ ADD THIS
    budgetType: 'fixed' | 'envelope' | 'percentage',  // ✅ ADD THIS
    resetDay: 1,  // Day of month to reset
    // ...
}

function calculateAvailableBudget(category, month) {
    const budget = getBudget(category);
    const currentSpending = getCategorySpending(category, month);
    
    let available = budget.monthlyLimit;
    
    if (budget.rolloverEnabled && month !== getCurrentMonth()) {
        const previousMonth = getPreviousMonth(month);
        const previousSpending = getCategorySpending(category, previousMonth);
        const previousSavings = budget.monthlyLimit - previousSpending;
        
        if (previousSavings > 0) {
            available += previousSavings;
        }
    }
    
    return available - currentSpending;
}
```

---

## 🚨 **MISSING CRITICAL FEATURES**

### 7. **Data Validation & Sanitization**

**Current State:**
```javascript
// app.js line 416-426 (your current implementation)
const transaction = {
    id: editingId || Date.now(),
    type: document.getElementById('type').value,      // ❌ No validation
    amount: amount,                                    // ❌ No range check
    category: document.getElementById('category').value, // ❌ No XSS protection
    date: document.getElementById('date').value,      // ❌ No date validation
    notes: document.getElementById('notes').value     // ❌ No length limit
};
```

**Must Add (BEFORE any new features):**
```javascript
function validateTransaction(transaction) {
    const errors = [];
    
    // Type validation
    if (!['income', 'expense'].includes(transaction.type)) {
        errors.push('Invalid transaction type');
    }
    
    // Amount validation
    if (isNaN(transaction.amount) || transaction.amount <= 0) {
        errors.push('Amount must be a positive number');
    }
    if (transaction.amount > 999999999) {  // ₹99 crore
        errors.push('Amount exceeds maximum limit');
    }
    
    // Category validation
    const validCategories = categories[transaction.type];
    if (!validCategories.includes(transaction.category)) {
        errors.push('Invalid category');
    }
    
    // Date validation
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) {
        errors.push('Invalid date');
    }
    if (date > new Date()) {
        errors.push('Future dates not allowed');
    }
    if (date < new Date('1900-01-01')) {
        errors.push('Date too far in past');
    }
    
    // Notes sanitization
    if (transaction.notes.length > 500) {
        errors.push('Notes too long (max 500 characters)');
    }
    transaction.notes = sanitizeHTML(transaction.notes);
    
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}
```

---

### 8. **Export/Import for New Features**

**Problem:** Your CSV export/import functions **won't automatically handle new fields**. Each feature requires manual CSV schema updates.

**Current Export (from AGENTS.md):**
```javascript
// exportToCSV() - line 881
// Only exports: Date, Category, Type, Amount, Notes, Currency
```

**Must Add:**
```javascript
function getExportColumns() {
    const baseColumns = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const enabledFields = getEnabledFields();
    const optionalColumns = [];
    
    if (enabledFields.paymentMethod) optionalColumns.push('PaymentMethod');
    if (enabledFields.merchant) optionalColumns.push('Merchant');
    if (enabledFields.account) optionalColumns.push('Account');
    // ... etc
    
    // Check if any transaction has tags
    if (transactions.some(t => t.tags && t.tags.length > 0)) {
        optionalColumns.push('Tags');
    }
    
    // Check if any transaction is split
    if (transactions.some(t => t.isSplit)) {
        optionalColumns.push('IsSplit', 'SplitDetails');
    }
    
    return [...baseColumns, ...optionalColumns, 'Currency'];
}

function exportToCSV() {
    const columns = getExportColumns();
    const header = columns.join(',');
    
    const rows = transactions.map(t => {
        const row = [];
        columns.forEach(col => {
            switch(col) {
                case 'Date': row.push(t.date); break;
                case 'Tags': row.push((t.tags || []).join(';')); break;
                case 'SplitDetails': row.push(JSON.stringify(t.splits || [])); break;
                // ... handle all columns dynamically
                default: row.push(t[col.toLowerCase()] || '');
            }
        });
        return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });
    
    return header + '\n' + rows.join('\n');
}
```

---

### 9. **Service Worker Cache Strategy for New Features**

**Problem:** Your roadmap doesn't specify which new files need caching. PWA apps must work offline.

**Current Cache (sw.js):**
```javascript
const CACHE_URLS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './css/tokens.css',
    './css/styles.css',
    './css/dark-mode.css',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/maskable-icon-512.png'
];
```

**What NOT to cache:**
- Receipt images (too large, user-generated)
- Export CSVs (temporary downloads)
- Backup files (temporary)

**What MUST be cached:**
- All HTML/CSS/JS changes
- Recurring transaction templates (in IndexedDB, not SW cache)
- Budget configurations (in IndexedDB)
- Reports and analytics (rendered client-side, no new files)

**Strategy:** Your current cache strategy is correct. NO changes needed for new features since they're all in app.js and index.html.

---

## 💡 **ACCOUNTING BEST PRACTICES**

### 10. **Split Transactions - Accounting Integrity**

**Problem:** Your split transaction design doesn't enforce debit/credit balance.

**Your Design:**
```javascript
{
    amount: 1000,
    isSplit: true,
    splits: [
        { category: 'Food', amount: 600, notes: 'Dinner' },
        { category: 'Transport', amount: 400, notes: 'Uber' }
    ]
}
```

**Issue:** What if splits don't add up to 1000? What if user enters 600 + 500 = 1100?

**Better Design:**
```javascript
// Validation function
function validateSplitTransaction(transaction) {
    if (!transaction.isSplit) return { valid: true };
    
    const totalSplit = transaction.splits.reduce((sum, s) => sum + s.amount, 0);
    const diff = Math.abs(transaction.amount - totalSplit);
    
    // Allow 0.01 difference for rounding errors
    if (diff > 0.01) {
        return {
            valid: false,
            error: `Split amounts (${totalSplit}) don't match transaction total (${transaction.amount})`
        };
    }
    
    return { valid: true };
}

// UI Helper - Auto-adjust last split
function autoBalanceSplits(totalAmount, splits) {
    if (splits.length === 0) return [];
    
    const manualTotal = splits.slice(0, -1).reduce((sum, s) => sum + s.amount, 0);
    const lastSplit = splits[splits.length - 1];
    
    lastSplit.amount = totalAmount - manualTotal;
    lastSplit.autoAdjusted = true;
    
    return splits;
}
```

---

### 11. **Savings Goals - Progress Tracking Integrity**

**Problem:** Your plan uses manual contributions but doesn't link to actual transaction data.

**Accounting Issue:** User can mark ₹10,000 as "saved for vacation" but actually spend it elsewhere. The goal progress becomes meaningless.

**Better Approach:**
```javascript
// Option A: Link to specific transactions
{
    id: 1,
    name: 'Vacation',
    targetAmount: 50000,
    savedAmount: 15000,  // Sum of linked transactions
    linkedTransactions: [101, 102, 103],  // IDs of transactions
    // ...
}

// Option B: Virtual envelope budgeting
{
    id: 1,
    name: 'Vacation',
    targetAmount: 50000,
    allocations: [
        { date: '2026-01-15', amount: 5000, fromCategory: 'Savings/Investments' },
        { date: '2026-02-15', amount: 5000, fromCategory: 'Salary' },
        // ...
    ]
}

// Option C: Category-based (simplest)
{
    id: 1,
    name: 'Vacation',
    targetAmount: 50000,
    trackingCategory: 'Savings/Investments',  // Auto-calculate from transactions
    startDate: '2026-01-01',
    // savedAmount calculated dynamically
}
```

---

## 🔒 **PWA-SPECIFIC CONCERNS**

### 12. **Background Sync for Recurring Transactions**

**Problem:** Your plan relies on app startup to check recurring transactions. If user doesn't open the app, rent never gets added.

**Better Solution - Use Background Sync API:**
```javascript
// Register background sync (if supported)
async function registerRecurringCheck() {
    if ('serviceWorker' in navigator && 'sync' in registration) {
        try {
            await registration.sync.register('check-recurring');
        } catch (err) {
            console.warn('Background sync not supported, using fallback');
            // Fallback: Show notification to open app
        }
    }
}

// In service worker (sw.js)
self.addEventListener('sync', event => {
    if (event.tag === 'check-recurring') {
        event.waitUntil(
            // Execute recurring transactions
            // Then notify app via postMessage
        );
    }
});
```

**Fallback for iOS (no Background Sync):**
- Show local notification: "FinChronicle: 3 recurring transactions pending"
- Use Web Push API (requires user permission)

---

### 13. **Offline Functionality for New Features**

**Must Verify:**
- ✅ Recurring transactions: Work offline (IndexedDB-based)
- ✅ Reports: Work offline (client-side calculations)
- ✅ Budgets: Work offline (IndexedDB-based)
- ✅ Tags & Search: Work offline (IndexedDB indexes)
- ✅ Split transactions: Work offline (no network needed)
- ✅ Savings goals: Work offline (IndexedDB-based)
- ⚠️ **Receipt photos: Must handle offline upload queue**

**Receipt Offline Strategy:**
```javascript
// Queue failed uploads
const uploadQueue = [];

async function uploadReceipt(transactionId, file) {
    if (!navigator.onLine) {
        // Store in IndexedDB immediately
        await saveReceiptLocally(transactionId, file);
        uploadQueue.push({ transactionId, file });
        showMessage('Receipt saved. Will sync when online.');
        return;
    }
    
    try {
        await compressAndSaveReceipt(transactionId, file);
    } catch (err) {
        uploadQueue.push({ transactionId, file });
        throw err;
    }
}

// Process queue when online
window.addEventListener('online', async () => {
    if (uploadQueue.length > 0) {
        showMessage(`Processing ${uploadQueue.length} pending receipts...`);
        // Process queue...
    }
});
```

---

## 📋 **RECOMMENDED CHANGES TO ROADMAP**

### **Version 3.11.0 - Recurring Transactions**
**Add:**
- Timezone handling
- Skip weekend/holiday options
- Paused template resume reminders
- Bulk edit/delete templates
- Template categories (rent, subscriptions, bills)

---

### **Version 3.12.0 - Optional Fields + Reports**
**Critical Changes:**
1. **Bump DB version to v3** (not v2)
2. **Store enabledFields in IndexedDB** (not localStorage)
3. Add **auto-detection** for fields with existing data
4. Add **field migration history** tracker
5. Implement **report caching** for performance
6. Add **date range presets** (Last Month, Last 3 Months, YTD, Last Year)
7. Add **export report as PDF/Image** option

**New Optional Fields to Consider:**
- `taxYear` - For tax-deductible expenses
- `projectCode` - For freelancers/contractors
- `receiptNumber` - For manual receipt tracking (before photo feature)
- `reimbursementStatus` - Pending/Approved/Paid/Rejected

---

### **Version 3.13.0 - Budget Limits & Alerts**
**Add:**
- Rollover budget option
- Budget templates (e.g., "50/30/20 Rule")
- Weekly budget view
- Budget vs. actual variance chart
- Multi-currency budget support
- Warn BEFORE exceeding budget (at 80%, 90%)

---

### **Version 3.14.0 - Tags & Search**
**Add:**
- Tag autocomplete (suggest existing tags)
- Tag hierarchy (parent tags: #work → #work-travel, #work-meals)
- Saved searches (e.g., "Business expenses last quarter")
- Search history
- Boolean search (AND, OR, NOT operators)
- Search by amount range (e.g., "₹500-₹5000")

---

### **Version 3.15.0 - Split Transactions**
**Add:**
- Percentage-based splits (e.g., 60/40 instead of absolute amounts)
- Template splits (e.g., "Rent + Utilities" always 70/30)
- Split by people (e.g., "Dinner with 3 friends, split equally")
- Split recurring transactions

---

### **Version 3.16.0 - Savings Goals**
**Add:**
- Multiple goal types (Emergency Fund, Debt Payoff, Purchase, Travel)
- Goal priority ranking
- Auto-allocation from income (e.g., "10% of salary to Emergency Fund")
- Goal milestones with notifications
- Goal deadline reminders
- Link goal to specific account (if account field enabled)

---

### **Version 3.17.0 - Receipt Photos**
**Add:**
- OCR for receipt text extraction (use ML Kit via CDN for offline PWA)
- Receipt categorization (auto-suggest category from OCR)
- Multi-receipt view (gallery mode)
- Receipt search by merchant/amount
- Receipt expiry warnings (for warranty/return items)
- Receipt sharing (generate shareable link)

---

## 🎯 **SUMMARY: TOP 10 ACTION ITEMS**

1. ✅ **Fix DB schema migration** - Bump version even for nullable fields
2. ✅ **Move enabledFields to IndexedDB** - Don't rely on localStorage
3. ✅ **Add transaction validation layer** - Before ANY new features
4. ✅ **Implement report caching** - Performance is critical
5. ✅ **Add timezone support to recurring** - Avoid date bugs
6. ✅ **Enforce split transaction balance** - Accounting integrity
7. ✅ **Add rollover budget option** - User expectation
8. ✅ **Implement storage quota management** - Before receipt photos
9. ✅ **Create dynamic CSV export/import** - Handle new fields automatically
10. ✅ **Add Background Sync for recurring** - PWA best practice

---

## 📊 **REVISED TIMELINE ESTIMATE**

| Version | Original Estimate | Revised Estimate | Reason |
|---------|------------------|------------------|---------|
| 3.11.0 | 2-3 weeks | **4-5 weeks** | +Timezone, +Background Sync |
| 3.12.0 | 4-5 weeks | **6-8 weeks** | +IDB config, +Caching, +Auto-detection |
| 3.13.0 | 6-7 weeks | **9-11 weeks** | +Rollover logic, +Templates |
| 3.14.0 | 8-9 weeks | **12-14 weeks** | +Hierarchy, +Saved searches |
| 3.15.0 | 10-11 weeks | **15-17 weeks** | +Percentage splits, +Templates |
| 3.16.0 | 12-13 weeks | **18-20 weeks** | +Auto-allocation, +Milestones |
| 3.17.0 | 14-15 weeks | **22-24 weeks** | +OCR, +Gallery, +Search |

**Total: ~6 months instead of ~4 months** (more realistic with proper architecture)
