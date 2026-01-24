# 📋 FinChronicle - Detailed Implementation Plan

**Version**: 3.3.0 - 4.0.0
**Timeline**: Q1 2026 - Q2 2026
**Owner**: Kiren Labs

---

## 🎯 Top 5 Priority Features

1. [Budget Tracking](#1-budget-tracking-v330)
2. [Recurring Transactions](#2-recurring-transactions-v330)
3. [Search & Better Filters](#3-search--better-filters-v330)
4. [Charts & Visualizations](#4-charts--visualizations-v340)
5. [CSV Import](#5-csv-import-v340)

---

## 1. Budget Tracking (v3.3.0)

**Priority**: 🔴 High
**Effort**: Medium (3-5 days)
**Impact**: High - Users' #1 requested feature

### 📊 Feature Overview

Allow users to set monthly budgets per category and track spending against those budgets with visual progress indicators and alerts.

### 🎨 UI Components

```
┌─────────────────────────────────────┐
│  Budget Overview                    │
│  ────────────────────────────       │
│  Food: ₹2,350 / ₹5,000 (47%)      │
│  ▓▓▓▓▓▓▓░░░░░░░░░░ 🟢             │
│                                     │
│  Transport: ₹1,800 / ₹2,000 (90%) │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 🟡            │
│                                     │
│  + Add Budget                       │
└─────────────────────────────────────┘
```

### 🗄️ Data Structure

```javascript
// Add to localStorage
const budgets = {
  version: 1,
  lastUpdated: '2026-01-16T12:00:00Z',
  budgets: [
    {
      id: 1,
      category: 'Food',
      limit: 5000,
      period: 'monthly', // or 'weekly', 'yearly'
      startDate: '2026-01-01', // Period start
      rollover: false, // Carry unused budget to next period
      alertThresholds: [80, 90, 100], // Alert at 80%, 90%, 100%
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 2,
      category: 'Transport',
      limit: 2000,
      period: 'monthly',
      startDate: '2026-01-01',
      rollover: false,
      alertThresholds: [80, 90, 100],
      createdAt: '2026-01-01T00:00:00Z'
    }
  ]
};
```

### 📝 Implementation Steps

#### Step 1: Data Layer (1 day)

**File**: `index.html` (Add after line 1133 - currency definitions)

```javascript
// ==================== BUDGET MANAGEMENT ====================

// Budget storage key
const BUDGETS_KEY = 'budgets';

// Load budgets from localStorage
function loadBudgets() {
    const stored = localStorage.getItem(BUDGETS_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        return data.budgets || [];
    }
    return [];
}

// Save budgets to localStorage
function saveBudgets(budgets) {
    const data = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        budgets: budgets
    };
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(data));
}

// Get budget for category
function getBudgetForCategory(category) {
    const budgets = loadBudgets();
    return budgets.find(b => b.category === category);
}

// Calculate spent amount for budget period
function getSpentForBudget(budget) {
    const now = new Date();
    const startDate = new Date(budget.startDate);

    // Calculate period dates
    let periodStart, periodEnd;

    if (budget.period === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (budget.period === 'weekly') {
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
    }

    // Filter transactions in period
    const spent = transactions
        .filter(t => {
            const txDate = new Date(t.date);
            return t.category === budget.category &&
                   t.type === 'expense' &&
                   txDate >= periodStart &&
                   txDate <= periodEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    return spent;
}

// Check if budget alert should be shown
function checkBudgetAlert(budget) {
    const spent = getSpentForBudget(budget);
    const percentage = (spent / budget.limit) * 100;

    for (const threshold of budget.alertThresholds) {
        if (percentage >= threshold && percentage < threshold + 5) {
            return {
                show: true,
                level: threshold,
                percentage: percentage.toFixed(0),
                spent: spent,
                limit: budget.limit,
                remaining: budget.limit - spent
            };
        }
    }

    return { show: false };
}

// Add or update budget
function saveBudget(budget) {
    const budgets = loadBudgets();
    const existing = budgets.findIndex(b => b.id === budget.id);

    if (existing >= 0) {
        budgets[existing] = budget;
    } else {
        budget.id = Date.now();
        budget.createdAt = new Date().toISOString();
        budgets.push(budget);
    }

    saveBudgets(budgets);
    updateUI();
}

// Delete budget
function deleteBudget(id) {
    const budgets = loadBudgets();
    const filtered = budgets.filter(b => b.id !== id);
    saveBudgets(filtered);
    updateUI();
}
```

#### Step 2: UI Components (1-2 days)

**File**: `index.html` (Add new tab after Groups tab ~line 1003)

```html
<!-- Budget Tab Button -->
<button id="budget-tab" class="tab" onclick="switchTab('budget')" role="tab" aria-selected="false" aria-controls="budgetTab">
    <i class="ri-pie-chart-line"></i> Budget
</button>

<!-- Budget Tab Content (after line 1075) -->
<div id="budgetTab" class="tab-content" role="tabpanel" aria-labelledby="budget-tab">
    <!-- Budget Overview -->
    <div class="card" id="budgetOverview">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 20px; margin: 0;">Monthly Budgets</h2>
            <button class="toolbar-btn" onclick="showAddBudgetModal()">
                <i class="ri-add-line"></i> Add Budget
            </button>
        </div>
        <div id="budgetList"></div>
    </div>

    <!-- Budget Alerts -->
    <div id="budgetAlerts" style="margin-top: 16px;"></div>
</div>

<!-- Add Budget Modal (after currency modal ~line 992) -->
<div id="budgetModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="budgetModalTitle">Add Budget</h3>
            <button class="close-btn" onclick="closeBudgetModal()" aria-label="Close">
                <i class="ri-close-line"></i>
            </button>
        </div>
        <form id="budgetForm" onsubmit="submitBudget(event)">
            <div class="form-group">
                <label for="budgetCategory">Category</label>
                <select id="budgetCategory" required>
                    <!-- Populated dynamically with expense categories -->
                </select>
            </div>
            <div class="form-group">
                <label for="budgetLimit">Budget Limit</label>
                <input type="number" id="budgetLimit" placeholder="5000" required min="0" step="0.01">
            </div>
            <div class="form-group">
                <label for="budgetPeriod">Period</label>
                <select id="budgetPeriod" required>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                </select>
            </div>
            <input type="hidden" id="editBudgetId" value="">
            <button type="submit" class="primary">Save Budget</button>
        </form>
    </div>
</div>
```

**CSS Additions** (in `<style>` section after line 893):

```css
/* Budget Progress Bars */
.budget-item {
    padding: 16px;
    border-bottom: 1px solid #f5f5f7;
}

.budget-item:last-child {
    border-bottom: none;
}

.budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.budget-category {
    font-size: 16px;
    font-weight: 600;
    color: #1d1d1f;
}

.budget-amount {
    font-size: 14px;
    color: #6e6e73;
}

.budget-progress-bar {
    height: 8px;
    background: #f5f5f7;
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
}

.budget-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.budget-progress-fill.safe {
    background: #34c759;
}

.budget-progress-fill.warning {
    background: #fdcb6e;
}

.budget-progress-fill.danger {
    background: #ff3b30;
}

.budget-details {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #6e6e73;
    margin-top: 4px;
}

.budget-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

/* Budget Alerts */
.budget-alert {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.budget-alert.warning {
    background: #fff9e6;
    border-left: 4px solid #fdcb6e;
}

.budget-alert.danger {
    background: #ffe5e5;
    border-left: 4px solid #ff3b30;
}

.budget-alert-icon {
    font-size: 24px;
}

.budget-alert-content {
    flex: 1;
}

.budget-alert-title {
    font-weight: 600;
    margin-bottom: 4px;
}

.budget-alert-text {
    font-size: 14px;
    color: #6e6e73;
}

/* Dark mode adjustments */
body.dark-mode .budget-item {
    border-bottom-color: #38383a;
}

body.dark-mode .budget-category {
    color: #ffffff;
}

body.dark-mode .budget-progress-bar {
    background: #2c2c2e;
}

body.dark-mode .budget-alert.warning {
    background: #3a3520;
}

body.dark-mode .budget-alert.danger {
    background: #3a2020;
}
```

#### Step 3: Business Logic (1 day)

**JavaScript Functions** (add after budget data layer):

```javascript
// Update budget list UI
function updateBudgetList() {
    const budgets = loadBudgets();
    const list = document.getElementById('budgetList');
    const alerts = document.getElementById('budgetAlerts');

    if (budgets.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div>No budgets set yet</div>
                <p style="font-size: 14px; margin-top: 8px;">Start by adding a budget for your categories</p>
            </div>
        `;
        alerts.innerHTML = '';
        return;
    }

    // Render budget items
    list.innerHTML = budgets.map(budget => {
        const spent = getSpentForBudget(budget);
        const remaining = budget.limit - spent;
        const percentage = Math.min((spent / budget.limit) * 100, 100);

        let statusClass = 'safe';
        let statusIcon = '🟢';
        if (percentage >= 90) {
            statusClass = 'danger';
            statusIcon = '🔴';
        } else if (percentage >= 80) {
            statusClass = 'warning';
            statusIcon = '🟡';
        }

        return `
            <div class="budget-item">
                <div class="budget-header">
                    <div class="budget-category">${budget.category}</div>
                    <div class="budget-amount">
                        ${formatCurrency(spent)} / ${formatCurrency(budget.limit)}
                    </div>
                </div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill ${statusClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="budget-details">
                    <span>${percentage.toFixed(0)}% used ${statusIcon}</span>
                    <span>${remaining >= 0 ? formatCurrency(remaining) + ' remaining' : 'Over by ' + formatCurrency(Math.abs(remaining))}</span>
                </div>
                <div class="budget-actions">
                    <button class="action-btn edit-btn" onclick="editBudget(${budget.id})">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteBudgetWithConfirm(${budget.id})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Render alerts
    const alertsHTML = [];
    budgets.forEach(budget => {
        const alert = checkBudgetAlert(budget);
        if (alert.show) {
            const isWarning = alert.level < 100;
            alertsHTML.push(`
                <div class="budget-alert ${isWarning ? 'warning' : 'danger'}">
                    <div class="budget-alert-icon">${isWarning ? '⚠️' : '🚨'}</div>
                    <div class="budget-alert-content">
                        <div class="budget-alert-title">
                            ${budget.category} Budget ${alert.level >= 100 ? 'Exceeded' : 'Alert'}
                        </div>
                        <div class="budget-alert-text">
                            You've spent ${formatCurrency(alert.spent)} of ${formatCurrency(alert.limit)} (${alert.percentage}%)
                            ${alert.remaining > 0 ? ` - ${formatCurrency(alert.remaining)} remaining` : ''}
                        </div>
                    </div>
                </div>
            `);
        }
    });
    alerts.innerHTML = alertsHTML.join('');
}

// Show add budget modal
function showAddBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const form = document.getElementById('budgetForm');
    const categorySelect = document.getElementById('budgetCategory');

    // Reset form
    form.reset();
    document.getElementById('editBudgetId').value = '';
    document.getElementById('budgetModalTitle').textContent = 'Add Budget';

    // Populate categories (expense categories only)
    const existingBudgets = loadBudgets().map(b => b.category);
    const availableCategories = categories.expense.filter(cat => !existingBudgets.includes(cat));

    categorySelect.innerHTML = availableCategories.map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('');

    modal.style.display = 'flex';
}

// Close budget modal
function closeBudgetModal() {
    document.getElementById('budgetModal').style.display = 'none';
}

// Submit budget form
function submitBudget(event) {
    event.preventDefault();

    const id = document.getElementById('editBudgetId').value;
    const budget = {
        id: id ? parseInt(id) : null,
        category: document.getElementById('budgetCategory').value,
        limit: parseFloat(document.getElementById('budgetLimit').value),
        period: document.getElementById('budgetPeriod').value,
        startDate: new Date().toISOString().slice(0, 10),
        rollover: false,
        alertThresholds: [80, 90, 100]
    };

    saveBudget(budget);
    closeBudgetModal();
    showMessage(id ? 'Budget updated!' : 'Budget added!');
}

// Edit budget
function editBudget(id) {
    const budgets = loadBudgets();
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;

    document.getElementById('editBudgetId').value = budget.id;
    document.getElementById('budgetCategory').value = budget.category;
    document.getElementById('budgetLimit').value = budget.limit;
    document.getElementById('budgetPeriod').value = budget.period;
    document.getElementById('budgetModalTitle').textContent = 'Edit Budget';

    // Disable category change when editing
    document.getElementById('budgetCategory').disabled = true;

    document.getElementById('budgetModal').style.display = 'flex';
}

// Delete budget with confirmation
function deleteBudgetWithConfirm(id) {
    if (confirm('Delete this budget?')) {
        deleteBudget(id);
        showMessage('Budget deleted!');
    }
}

// Update the main updateUI function to include budgets
// Find the existing updateUI function and add this line:
// updateBudgetList();
```

#### Step 4: Integration (0.5 days)

1. **Update `updateUI()` function** to include `updateBudgetList()`:

```javascript
function updateUI() {
    updateSummary();
    updateTransactionsList();
    updateMonthFilters();
    updateCategoryFilter();
    updateGroupedView();
    updateBudgetList(); // ADD THIS LINE
}
```

2. **Check budgets when adding transactions**:

```javascript
// In the form submission handler (line ~1261), after saveData():
// Check for budget alerts
const budgets = loadBudgets();
budgets.forEach(budget => {
    if (transaction.category === budget.category && transaction.type === 'expense') {
        const alert = checkBudgetAlert(budget);
        if (alert.show && alert.level >= 90) {
            showMessage(`⚠️ ${budget.category} budget at ${alert.percentage}%!`, 'warning');
        }
    }
});
```

#### Step 5: Testing Checklist

- [ ] Add budget for existing category
- [ ] Add multiple budgets
- [ ] Edit budget limit
- [ ] Delete budget
- [ ] Alert appears at 80% threshold
- [ ] Alert appears at 90% threshold
- [ ] Alert appears at 100% (over budget)
- [ ] Budget resets monthly
- [ ] Progress bar colors change correctly
- [ ] Dark mode compatibility
- [ ] Mobile responsiveness
- [ ] Data persists after refresh
- [ ] Works offline

---

## 2. Recurring Transactions (v3.3.0)

**Priority**: 🔴 High
**Effort**: Medium-High (4-6 days)
**Impact**: High - Saves time for regular expenses

### 📊 Feature Overview

Allow users to create transaction templates that repeat on a schedule (daily, weekly, monthly, yearly) with smart notifications.

### 🎨 UI Components

```
┌─────────────────────────────────────┐
│  Recurring Transactions             │
│  ────────────────────────────────   │
│  📅 Rent - Monthly                  │
│  ₹12,000 • Bills                    │
│  Next: Feb 1, 2026                  │
│  [Skip] [Add Now]                   │
│  ────────────────────────────────   │
│  📅 Gym - Monthly                   │
│  ₹2,000 • Health                    │
│  Next: Feb 5, 2026                  │
│  [Skip] [Add Now]                   │
└─────────────────────────────────────┘
```

### 🗄️ Data Structure

```javascript
const recurringTransactions = {
    version: 1,
    recurring: [
        {
            id: 1,
            template: {
                type: 'expense',
                amount: 12000,
                category: 'Bills',
                notes: 'Monthly rent'
            },
            frequency: 'monthly', // daily, weekly, monthly, yearly
            startDate: '2026-01-01',
            endDate: null, // null = indefinite
            dayOfMonth: 1, // For monthly: 1-31
            dayOfWeek: null, // For weekly: 0-6
            lastAdded: '2026-01-01',
            nextDue: '2026-02-01',
            autoAdd: false, // Auto-add or require confirmation
            skipCount: 0,
            createdAt: '2026-01-01T00:00:00Z'
        }
    ]
};
```

### 📝 Implementation Steps

#### Step 1: Data Layer (1 day)

```javascript
// ==================== RECURRING TRANSACTIONS ====================

const RECURRING_KEY = 'recurring_transactions';

// Load recurring transactions
function loadRecurring() {
    const stored = localStorage.getItem(RECURRING_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        return data.recurring || [];
    }
    return [];
}

// Save recurring transactions
function saveRecurring(recurring) {
    const data = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        recurring: recurring
    };
    localStorage.setItem(RECURRING_KEY, JSON.stringify(data));
}

// Calculate next due date
function calculateNextDue(recurring) {
    const lastDate = new Date(recurring.lastAdded || recurring.startDate);
    let nextDate = new Date(lastDate);

    switch (recurring.frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            if (recurring.dayOfMonth) {
                nextDate.setDate(recurring.dayOfMonth);
            }
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return nextDate.toISOString().slice(0, 10);
}

// Check for due recurring transactions
function getDueRecurring() {
    const recurring = loadRecurring();
    const today = new Date().toISOString().slice(0, 10);

    return recurring.filter(r => {
        const nextDue = new Date(r.nextDue);
        const todayDate = new Date(today);

        // Check if due or overdue
        return nextDue <= todayDate &&
               (!r.endDate || new Date(r.endDate) >= todayDate);
    });
}

// Add recurring transaction now
function addRecurringNow(recurringId) {
    const recurring = loadRecurring();
    const item = recurring.find(r => r.id === recurringId);
    if (!item) return;

    // Create transaction from template
    const transaction = {
        id: Date.now(),
        ...item.template,
        date: new Date().toISOString().slice(0, 10),
        recurring: true,
        recurringId: item.id,
        createdAt: new Date().toISOString()
    };

    transactions.unshift(transaction);
    saveData();

    // Update recurring - set next due date
    item.lastAdded = transaction.date;
    item.nextDue = calculateNextDue(item);
    saveRecurring(recurring);

    updateUI();
    showMessage('Recurring transaction added!');
}

// Skip recurring transaction
function skipRecurring(recurringId) {
    const recurring = loadRecurring();
    const item = recurring.find(r => r.id === recurringId);
    if (!item) return;

    // Calculate next due without adding transaction
    item.lastAdded = item.nextDue;
    item.nextDue = calculateNextDue(item);
    item.skipCount++;

    saveRecurring(recurring);
    updateUI();
    showMessage('Skipped until ' + formatDate(item.nextDue));
}

// Save or update recurring transaction
function saveRecurringTransaction(recurring) {
    const list = loadRecurring();
    const existing = list.findIndex(r => r.id === recurring.id);

    if (existing >= 0) {
        list[existing] = recurring;
    } else {
        recurring.id = Date.now();
        recurring.createdAt = new Date().toISOString();
        recurring.lastAdded = recurring.startDate;
        recurring.nextDue = calculateNextDue(recurring);
        recurring.skipCount = 0;
        list.push(recurring);
    }

    saveRecurring(list);
    updateUI();
}

// Delete recurring transaction
function deleteRecurring(id) {
    const list = loadRecurring();
    const filtered = list.filter(r => r.id !== id);
    saveRecurring(filtered);
    updateUI();
}

// Check for auto-add recurring transactions (run on app load)
function checkAutoAddRecurring() {
    const due = getDueRecurring();

    due.forEach(item => {
        if (item.autoAdd) {
            addRecurringNow(item.id);
        }
    });
}
```

#### Step 2: UI Components (2 days)

**HTML** (add new tab):

```html
<!-- Recurring Tab Button -->
<button id="recurring-tab" class="tab" onclick="switchTab('recurring')" role="tab" aria-selected="false" aria-controls="recurringTab">
    <i class="ri-repeat-line"></i> Recurring
</button>

<!-- Recurring Tab Content -->
<div id="recurringTab" class="tab-content" role="tabpanel" aria-labelledby="recurring-tab">
    <!-- Due Now Section -->
    <div id="dueRecurring"></div>

    <!-- All Recurring Transactions -->
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 20px; margin: 0;">Recurring Transactions</h2>
            <button class="toolbar-btn" onclick="showAddRecurringModal()">
                <i class="ri-add-line"></i> Add Recurring
            </button>
        </div>
        <div id="recurringList"></div>
    </div>
</div>

<!-- Add Recurring Modal -->
<div id="recurringModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="recurringModalTitle">Add Recurring Transaction</h3>
            <button class="close-btn" onclick="closeRecurringModal()" aria-label="Close">
                <i class="ri-close-line"></i>
            </button>
        </div>
        <form id="recurringForm" onsubmit="submitRecurring(event)">
            <div class="form-group">
                <label>Type</label>
                <div class="type-toggle" role="radiogroup">
                    <button type="button" class="type-option active" data-type="expense" onclick="selectRecurringType('expense')">
                        <i class="ri-arrow-down-circle-line"></i> Expense
                    </button>
                    <button type="button" class="type-option" data-type="income" onclick="selectRecurringType('income')">
                        <i class="ri-arrow-up-circle-line"></i> Income
                    </button>
                </div>
                <input type="hidden" id="recurringType" value="expense">
            </div>

            <div class="form-group">
                <label for="recurringAmount">Amount</label>
                <input type="number" id="recurringAmount" placeholder="1000" required min="0" step="0.01">
            </div>

            <div class="form-group">
                <label for="recurringCategory">Category</label>
                <select id="recurringCategory" required>
                    <!-- Populated dynamically -->
                </select>
            </div>

            <div class="form-group">
                <label for="recurringNotes">Description</label>
                <input type="text" id="recurringNotes" placeholder="Monthly rent" required>
            </div>

            <div class="form-group">
                <label for="recurringFrequency">Frequency</label>
                <select id="recurringFrequency" required onchange="updateFrequencyOptions()">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly" selected>Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>

            <div class="form-group" id="dayOfMonthGroup">
                <label for="recurringDayOfMonth">Day of Month</label>
                <input type="number" id="recurringDayOfMonth" min="1" max="31" value="1">
            </div>

            <div class="form-group" id="dayOfWeekGroup" style="display: none;">
                <label for="recurringDayOfWeek">Day of Week</label>
                <select id="recurringDayOfWeek">
                    <option value="0">Sunday</option>
                    <option value="1" selected>Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                </select>
            </div>

            <div class="form-group">
                <label for="recurringStartDate">Start Date</label>
                <input type="date" id="recurringStartDate" required>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="recurringAutoAdd" style="width: auto; margin-right: 8px;">
                    Auto-add (no confirmation needed)
                </label>
            </div>

            <input type="hidden" id="editRecurringId" value="">
            <button type="submit" class="primary">Save Recurring Transaction</button>
        </form>
    </div>
</div>
```

**CSS** (add to styles):

```css
/* Recurring transaction items */
.recurring-item {
    padding: 16px;
    border-bottom: 1px solid #f5f5f7;
    display: flex;
    align-items: center;
    gap: 12px;
}

.recurring-item:last-child {
    border-bottom: none;
}

.recurring-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: #e6f0ff;
    color: #0051D5;
}

.recurring-details {
    flex: 1;
}

.recurring-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
}

.recurring-meta {
    font-size: 14px;
    color: #6e6e73;
}

.recurring-amount {
    font-size: 18px;
    font-weight: 600;
    text-align: right;
}

.recurring-actions {
    display: flex;
    gap: 8px;
}

/* Due recurring alert */
.due-recurring {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
}

.due-recurring h3 {
    margin-bottom: 12px;
}

.due-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.due-item-info {
    flex: 1;
}

.due-item-actions {
    display: flex;
    gap: 8px;
}

.due-item-actions button {
    background: white;
    color: #667eea;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
}

.due-item-actions button:hover {
    opacity: 0.9;
}

/* Dark mode */
body.dark-mode .recurring-item {
    border-bottom-color: #38383a;
}

body.dark-mode .recurring-icon {
    background: #1a2a3a;
}
```

#### Step 3: Business Logic (1-2 days)

```javascript
// Update recurring list UI
function updateRecurringList() {
    const recurring = loadRecurring();
    const list = document.getElementById('recurringList');
    const dueSection = document.getElementById('dueRecurring');

    // Show due recurring transactions
    const due = getDueRecurring();
    if (due.length > 0) {
        dueSection.innerHTML = `
            <div class="due-recurring">
                <h3><i class="ri-notification-line"></i> Due Now (${due.length})</h3>
                ${due.map(item => `
                    <div class="due-item">
                        <div class="due-item-info">
                            <div style="font-weight: 600; margin-bottom: 4px;">
                                ${item.template.notes}
                            </div>
                            <div style="font-size: 14px; opacity: 0.9;">
                                ${formatCurrency(item.template.amount)} • ${item.template.category}
                            </div>
                        </div>
                        <div class="due-item-actions">
                            <button onclick="skipRecurring(${item.id})">Skip</button>
                            <button onclick="addRecurringNow(${item.id})">Add Now</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        dueSection.innerHTML = '';
    }

    // Show all recurring transactions
    if (recurring.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔄</div>
                <div>No recurring transactions yet</div>
                <p style="font-size: 14px; margin-top: 8px;">Set up regular transactions to save time</p>
            </div>
        `;
        return;
    }

    list.innerHTML = recurring.map(item => {
        const isIncome = item.template.type === 'income';
        const icon = isIncome ? '<i class="ri-arrow-up-circle-fill"></i>' : '<i class="ri-arrow-down-circle-fill"></i>';
        const amountClass = isIncome ? 'positive' : 'negative';
        const sign = isIncome ? '+' : '-';

        let frequencyText = item.frequency;
        if (item.frequency === 'monthly' && item.dayOfMonth) {
            frequencyText += ` (${item.dayOfMonth}${getDaySuffix(item.dayOfMonth)})`;
        }

        return `
            <div class="recurring-item">
                <div class="recurring-icon">
                    ${icon}
                </div>
                <div class="recurring-details">
                    <div class="recurring-title">${item.template.notes}</div>
                    <div class="recurring-meta">
                        ${item.template.category} • ${capitalize(frequencyText)}
                        ${item.autoAdd ? ' • Auto-add' : ''}
                        <br>Next: ${formatDate(item.nextDue)}
                    </div>
                </div>
                <div class="recurring-amount ${amountClass}">
                    ${sign}${formatCurrency(item.template.amount)}
                </div>
                <div class="recurring-actions">
                    <button class="action-btn edit-btn" onclick="editRecurring(${item.id})">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteRecurringWithConfirm(${item.id})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper functions
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateFrequencyOptions() {
    const frequency = document.getElementById('recurringFrequency').value;
    const dayOfMonthGroup = document.getElementById('dayOfMonthGroup');
    const dayOfWeekGroup = document.getElementById('dayOfWeekGroup');

    if (frequency === 'monthly' || frequency === 'yearly') {
        dayOfMonthGroup.style.display = 'block';
        dayOfWeekGroup.style.display = 'none';
    } else if (frequency === 'weekly') {
        dayOfMonthGroup.style.display = 'none';
        dayOfWeekGroup.style.display = 'block';
    } else {
        dayOfMonthGroup.style.display = 'none';
        dayOfWeekGroup.style.display = 'none';
    }
}

// Modal functions
function showAddRecurringModal() {
    const modal = document.getElementById('recurringModal');
    const form = document.getElementById('recurringForm');

    form.reset();
    document.getElementById('editRecurringId').value = '';
    document.getElementById('recurringModalTitle').textContent = 'Add Recurring Transaction';
    document.getElementById('recurringStartDate').valueAsDate = new Date();

    selectRecurringType('expense');
    updateFrequencyOptions();

    modal.style.display = 'flex';
}

function closeRecurringModal() {
    document.getElementById('recurringModal').style.display = 'none';
}

function selectRecurringType(type) {
    document.getElementById('recurringType').value = type;

    document.querySelectorAll('#recurringForm .type-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    const categorySelect = document.getElementById('recurringCategory');
    categorySelect.innerHTML = categories[type].map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('');
}

function submitRecurring(event) {
    event.preventDefault();

    const id = document.getElementById('editRecurringId').value;
    const frequency = document.getElementById('recurringFrequency').value;

    const recurring = {
        id: id ? parseInt(id) : null,
        template: {
            type: document.getElementById('recurringType').value,
            amount: parseFloat(document.getElementById('recurringAmount').value),
            category: document.getElementById('recurringCategory').value,
            notes: document.getElementById('recurringNotes').value
        },
        frequency: frequency,
        startDate: document.getElementById('recurringStartDate').value,
        endDate: null,
        dayOfMonth: frequency === 'monthly' || frequency === 'yearly' ?
            parseInt(document.getElementById('recurringDayOfMonth').value) : null,
        dayOfWeek: frequency === 'weekly' ?
            parseInt(document.getElementById('recurringDayOfWeek').value) : null,
        autoAdd: document.getElementById('recurringAutoAdd').checked
    };

    saveRecurringTransaction(recurring);
    closeRecurringModal();
    showMessage(id ? 'Recurring transaction updated!' : 'Recurring transaction added!');
}

function editRecurring(id) {
    const recurring = loadRecurring();
    const item = recurring.find(r => r.id === id);
    if (!item) return;

    document.getElementById('editRecurringId').value = item.id;
    selectRecurringType(item.template.type);
    document.getElementById('recurringAmount').value = item.template.amount;
    document.getElementById('recurringCategory').value = item.template.category;
    document.getElementById('recurringNotes').value = item.template.notes;
    document.getElementById('recurringFrequency').value = item.frequency;
    document.getElementById('recurringStartDate').value = item.startDate;
    document.getElementById('recurringAutoAdd').checked = item.autoAdd;

    if (item.dayOfMonth) {
        document.getElementById('recurringDayOfMonth').value = item.dayOfMonth;
    }
    if (item.dayOfWeek !== null) {
        document.getElementById('recurringDayOfWeek').value = item.dayOfWeek;
    }

    updateFrequencyOptions();
    document.getElementById('recurringModalTitle').textContent = 'Edit Recurring Transaction';
    document.getElementById('recurringModal').style.display = 'flex';
}

function deleteRecurringWithConfirm(id) {
    if (confirm('Delete this recurring transaction?')) {
        deleteRecurring(id);
        showMessage('Recurring transaction deleted!');
    }
}
```

#### Step 4: Integration (0.5 days)

1. **Update `updateUI()`**:
```javascript
function updateUI() {
    updateSummary();
    updateTransactionsList();
    updateMonthFilters();
    updateCategoryFilter();
    updateGroupedView();
    updateBudgetList();
    updateRecurringList(); // ADD THIS
}
```

2. **Check on app load**:
```javascript
// In window.addEventListener('load') function (line ~1863):
checkAutoAddRecurring();
```

3. **Mark recurring transactions in list**:
```javascript
// In updateTransactionsList(), add badge if transaction.recurring:
${t.recurring ? '<span style="font-size: 12px; color: #0051D5;">🔄 Recurring</span>' : ''}
```

#### Step 5: Testing Checklist

- [ ] Add daily recurring transaction
- [ ] Add weekly recurring transaction
- [ ] Add monthly recurring transaction (specific day)
- [ ] Add yearly recurring transaction
- [ ] Edit recurring transaction
- [ ] Delete recurring transaction
- [ ] "Add Now" button works
- [ ] "Skip" button updates next due date
- [ ] Auto-add works on app load
- [ ] Due transactions show alert
- [ ] Next due date calculates correctly
- [ ] Recurring transactions marked in list
- [ ] Dark mode compatibility
- [ ] Mobile responsiveness

---

## 3. Search & Better Filters (v3.3.0)

**Priority**: 🟡 Medium-High
**Effort**: Low-Medium (2-3 days)
**Impact**: Medium - Quality of life improvement

### 📊 Feature Overview

Add a search bar to find transactions by notes, category, amount, or date with quick filter presets.

### 🎨 UI Components

```
┌─────────────────────────────────────┐
│  🔍 Search transactions...          │
│  [Last 7 days] [Last 30 days] [All]│
│  ────────────────────────────────   │
│  Results (5)                        │
│  ...transactions...                 │
└─────────────────────────────────────┘
```

### 📝 Implementation Steps

#### Step 1: UI Components (0.5 days)

**HTML** (add to List tab, before filters):

```html
<!-- Search Bar -->
<div style="margin-bottom: 16px;">
    <div style="position: relative;">
        <input type="text"
               id="searchInput"
               class="search-input"
               placeholder="🔍 Search by notes, category, or amount..."
               oninput="handleSearch()">
        <button class="search-clear-btn"
                id="searchClearBtn"
                onclick="clearSearch()"
                style="display: none;">
            <i class="ri-close-line"></i>
        </button>
    </div>

    <!-- Quick filters -->
    <div class="quick-filters">
        <button class="filter-chip" onclick="applyQuickFilter('week')">Last 7 days</button>
        <button class="filter-chip" onclick="applyQuickFilter('month')">Last 30 days</button>
        <button class="filter-chip" onclick="applyQuickFilter('today')">Today</button>
        <button class="filter-chip" onclick="applyQuickFilter('all')">All Time</button>
    </div>
</div>
```

**CSS**:

```css
/* Search Input */
.search-input {
    width: 100%;
    padding: 12px 40px 12px 12px;
    border: 2px solid #e5e5e7;
    border-radius: 8px;
    font-size: 16px;
    font-family: inherit;
}

.search-input:focus {
    outline: none;
    border-color: #0051D5;
}

.search-clear-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #f5f5f7;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.search-clear-btn:hover {
    background: #e5e5e7;
}

/* Quick Filters */
.quick-filters {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
}

.filter-chip {
    padding: 8px 16px;
    border: 2px solid #e5e5e7;
    border-radius: 20px;
    background: white;
    font-size: 14px;
    color: #1d1d1f;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-chip:hover {
    background: #f5f5f7;
}

.filter-chip.active {
    background: #0051D5;
    color: white;
    border-color: #0051D5;
}

/* Dark mode */
body.dark-mode .search-input {
    background: #1c1c1e;
    color: white;
    border-color: #38383a;
}

body.dark-mode .search-clear-btn {
    background: #2c2c2e;
    color: white;
}

body.dark-mode .filter-chip {
    background: #1c1c1e;
    border-color: #38383a;
    color: white;
}

body.dark-mode .filter-chip:hover {
    background: #2c2c2e;
}
```

#### Step 2: Search Logic (1 day)

```javascript
// ==================== SEARCH & FILTERS ====================

let searchQuery = '';
let quickFilterActive = 'all';

// Handle search input
function handleSearch() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const clearBtn = document.getElementById('searchClearBtn');
    clearBtn.style.display = searchQuery ? 'flex' : 'none';
    updateTransactionsList();
}

// Clear search
function clearSearch() {
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClearBtn').style.display = 'none';
    updateTransactionsList();
}

// Apply quick filter
function applyQuickFilter(filter) {
    quickFilterActive = filter;

    // Update button states
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    updateTransactionsList();
}

// Filter transactions by search and quick filters
function filterTransactions(transactions) {
    let filtered = [...transactions];

    // Apply search query
    if (searchQuery) {
        filtered = filtered.filter(t => {
            const notes = (t.notes || '').toLowerCase();
            const category = t.category.toLowerCase();
            const amount = t.amount.toString();
            const date = t.date;

            return notes.includes(searchQuery) ||
                   category.includes(searchQuery) ||
                   amount.includes(searchQuery) ||
                   date.includes(searchQuery);
        });
    }

    // Apply quick filter
    if (quickFilterActive !== 'all') {
        const now = new Date();
        const filterDate = new Date();

        switch (quickFilterActive) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setDate(now.getDate() - 30);
                break;
        }

        filtered = filtered.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= filterDate;
        });
    }

    // Apply month filter (existing)
    if (selectedMonth !== 'all') {
        filtered = filtered.filter(t => t.date.startsWith(selectedMonth));
    }

    // Apply category filter (existing)
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(t => t.category === selectedCategory);
    }

    return filtered;
}

// Update existing updateTransactionsList function
function updateTransactionsList() {
    const list = document.getElementById('transactionsList');
    let filtered = filterTransactions(transactions);

    // Show search results count
    if (searchQuery || quickFilterActive !== 'all') {
        const resultText = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
        // Add result count UI...
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div>No transactions found</div>
                ${searchQuery ? '<p style="font-size: 14px; margin-top: 8px;">Try a different search term</p>' : ''}
            </div>
        `;
        return;
    }

    // ... rest of existing code
}
```

#### Step 3: Advanced Search (Optional - 1 day)

Add filters for:
- Amount range (min/max)
- Date range picker
- Transaction type (income/expense)

```javascript
// Advanced filters object
const advancedFilters = {
    minAmount: null,
    maxAmount: null,
    startDate: null,
    endDate: null,
    type: 'all' // 'income', 'expense', 'all'
};

// Apply advanced filters
function applyAdvancedFilters(transactions) {
    return transactions.filter(t => {
        // Amount range
        if (advancedFilters.minAmount !== null && t.amount < advancedFilters.minAmount) {
            return false;
        }
        if (advancedFilters.maxAmount !== null && t.amount > advancedFilters.maxAmount) {
            return false;
        }

        // Date range
        if (advancedFilters.startDate && t.date < advancedFilters.startDate) {
            return false;
        }
        if (advancedFilters.endDate && t.date > advancedFilters.endDate) {
            return false;
        }

        // Type
        if (advancedFilters.type !== 'all' && t.type !== advancedFilters.type) {
            return false;
        }

        return true;
    });
}
```

#### Step 4: Testing Checklist

- [ ] Search by notes
- [ ] Search by category
- [ ] Search by amount
- [ ] Search by date
- [ ] Clear search button works
- [ ] Quick filter: Today
- [ ] Quick filter: Last 7 days
- [ ] Quick filter: Last 30 days
- [ ] Quick filter: All time
- [ ] Combine search + filters
- [ ] Empty state shows correct message
- [ ] Result count updates
- [ ] Dark mode compatibility

---

## 4. Charts & Visualizations (v3.4.0)

**Priority**: 🟡 Medium
**Effort**: Medium-High (4-5 days)
**Impact**: High - Visual insights

### 📊 Feature Overview

Add lightweight charts to visualize spending trends, category breakdown, and income vs. expense over time.

### 🎨 UI Components

```
┌─────────────────────────────────────┐
│  Monthly Overview                   │
│  ────────────────────────────────   │
│  ┌───────────────────────────────┐ │
│  │         📊 Bar Chart          │ │
│  │  Income vs Expense            │ │
│  └───────────────────────────────┘ │
│                                     │
│  Category Breakdown                 │
│  ┌───────────────────────────────┐ │
│  │         🥧 Pie Chart          │ │
│  │  Spending by Category         │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 🛠️ Technology Choice

**Option 1: Chart.js** (Recommended)
- Size: ~60KB (gzipped)
- Pros: Feature-rich, easy to use
- Cons: Adds to bundle size

**Option 2: Custom SVG Charts** (Lightweight)
- Size: 0KB (no dependency)
- Pros: Full control, smaller bundle
- Cons: More code to maintain

**Recommendation**: Use Chart.js for v4.0, but start with custom SVG for v3.4 to keep it lightweight.

### 📝 Implementation Steps

#### Step 1: Custom SVG Chart Components (2 days)

```javascript
// ==================== CHART UTILITIES ====================

// Create simple bar chart (SVG)
function createBarChart(data, width = 400, height = 200) {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = width / data.length;
    const padding = 10;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Draw bars
    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const x = index * barWidth + padding;
        const y = height - barHeight - 20;

        svg += `
            <rect x="${x}" y="${y}" width="${barWidth - padding * 2}" height="${barHeight}"
                  fill="${item.color || '#0051D5'}" rx="4"/>
            <text x="${x + (barWidth - padding * 2) / 2}" y="${y - 5}"
                  text-anchor="middle" font-size="12" fill="#6e6e73">
                ${formatCurrency(item.value)}
            </text>
            <text x="${x + (barWidth - padding * 2) / 2}" y="${height - 5}"
                  text-anchor="middle" font-size="12" fill="#1d1d1f">
                ${item.label}
            </text>
        `;
    });

    svg += '</svg>';
    return svg;
}

// Create simple pie chart (SVG)
function createPieChart(data, size = 200) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90; // Start at top

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Draw pie slices
    data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;

        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;

        svg += `
            <path d="M ${centerX},${centerY} L ${startX},${startY}
                     A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z"
                  fill="${item.color || getColorForIndex(index)}"
                  stroke="white" stroke-width="2"/>
        `;

        currentAngle = endAngle;
    });

    svg += '</svg>';
    return svg;
}

// Generate colors for charts
function getColorForIndex(index) {
    const colors = [
        '#0051D5', '#34c759', '#ff3b30', '#fdcb6e',
        '#00b894', '#d63031', '#6c5ce7', '#a29bfe'
    ];
    return colors[index % colors.length];
}

// Create line chart (trend)
function createLineChart(data, width = 400, height = 200) {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const xStep = width / (data.length - 1 || 1);
    const padding = 20;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Draw grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i * (height - padding * 2) / 4);
        svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}"
                      stroke="#e5e5e7" stroke-width="1"/>`;
    }

    // Build path
    let pathData = '';
    data.forEach((point, index) => {
        const x = padding + index * xStep;
        const y = height - padding - ((point.value - minValue) / range) * (height - padding * 2);

        pathData += index === 0 ? `M ${x},${y}` : ` L ${x},${y}`;

        // Draw point
        svg += `<circle cx="${x}" cy="${y}" r="4" fill="#0051D5"/>`;
    });

    // Draw line
    svg += `<path d="${pathData}" stroke="#0051D5" stroke-width="2" fill="none"/>`;

    svg += '</svg>';
    return svg;
}
```

#### Step 2: Chart Data Preparation (1 day)

```javascript
// Prepare data for charts
function getChartData() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));

    // Income vs Expense by month
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);

        const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        last6Months.push({
            month: date.toLocaleDateString('en-IN', { month: 'short' }),
            income,
            expense
        });
    }

    // Category breakdown (current month)
    const categoryData = {};
    monthTxs
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

    const categoryChartData = Object.entries(categoryData)
        .map(([category, value]) => ({ label: category, value }))
        .sort((a, b) => b.value - a.value);

    // Spending trend (last 30 days)
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().slice(0, 10);

        const dayExpense = transactions
            .filter(t => t.date === dateKey && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        trendData.push({
            label: date.getDate(),
            value: dayExpense
        });
    }

    return {
        incomeVsExpense: last6Months,
        categoryBreakdown: categoryChartData,
        spendingTrend: trendData
    };
}
```

#### Step 3: Charts Tab UI (1 day)

```html
<!-- Charts Tab Button -->
<button id="charts-tab" class="tab" onclick="switchTab('charts')" role="tab" aria-selected="false" aria-controls="chartsTab">
    <i class="ri-bar-chart-line"></i> Charts
</button>

<!-- Charts Tab Content -->
<div id="chartsTab" class="tab-content" role="tabpanel" aria-labelledby="charts-tab">
    <!-- Income vs Expense -->
    <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px;">Income vs Expense (Last 6 Months)</h3>
        <div id="incomeVsExpenseChart"></div>
    </div>

    <!-- Category Breakdown -->
    <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px;">Spending by Category (This Month)</h3>
        <div id="categoryBreakdownChart" style="text-align: center;"></div>
        <div id="categoryLegend" style="margin-top: 16px;"></div>
    </div>

    <!-- Spending Trend -->
    <div class="card">
        <h3 style="margin-bottom: 16px;">Daily Spending Trend (Last 30 Days)</h3>
        <div id="spendingTrendChart"></div>
    </div>
</div>
```

#### Step 4: Render Charts (0.5 days)

```javascript
// Update charts
function updateCharts() {
    const data = getChartData();

    // Income vs Expense chart
    const incomeExpenseData = data.incomeVsExpense.flatMap(m => [
        { label: m.month, value: m.income, color: '#34c759' },
        { label: '', value: m.expense, color: '#ff3b30' }
    ]);
    document.getElementById('incomeVsExpenseChart').innerHTML =
        createBarChart(incomeExpenseData, 600, 250);

    // Category breakdown pie chart
    const categoryData = data.categoryBreakdown.slice(0, 8); // Top 8 categories
    document.getElementById('categoryBreakdownChart').innerHTML =
        createPieChart(categoryData, 300);

    // Category legend
    const legendHTML = categoryData.map((item, index) => {
        const percentage = (item.value / categoryData.reduce((s, d) => s + d.value, 0) * 100).toFixed(1);
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; margin: 8px 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background: ${getColorForIndex(index)};"></div>
                    <span>${item.label}</span>
                </div>
                <span style="font-weight: 600;">${formatCurrency(item.value)} (${percentage}%)</span>
            </div>
        `;
    }).join('');
    document.getElementById('categoryLegend').innerHTML = legendHTML;

    // Spending trend
    document.getElementById('spendingTrendChart').innerHTML =
        createLineChart(data.spendingTrend, 600, 200);
}

// Update updateUI to include charts
function updateUI() {
    updateSummary();
    updateTransactionsList();
    updateMonthFilters();
    updateCategoryFilter();
    updateGroupedView();
    updateBudgetList();
    updateRecurringList();
    if (currentTab === 'charts') {
        updateCharts(); // Only update when charts tab is active
    }
}
```

#### Step 5: Testing Checklist

- [ ] Income vs Expense chart renders
- [ ] Category pie chart renders
- [ ] Spending trend line chart renders
- [ ] Charts update with new transactions
- [ ] Legend shows correct percentages
- [ ] Charts responsive on mobile
- [ ] Dark mode compatibility
- [ ] No chart shown when no data
- [ ] Performance acceptable with 100+ transactions

---

## 5. CSV Import (v3.4.0)

**Priority**: 🟡 Medium
**Effort**: Medium (3-4 days)
**Impact**: Medium-High - User migration tool

### 📊 Feature Overview

Allow users to import transactions from CSV files with column mapping support.

### 🎨 UI Flow

```
1. Choose File → 2. Preview & Map Columns → 3. Import → 4. Success
```

### 📝 Implementation Steps

#### Step 1: File Upload UI (0.5 days)

```html
<!-- Import Modal -->
<div id="importModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
            <h3>Import Transactions from CSV</h3>
            <button class="close-btn" onclick="closeImportModal()">
                <i class="ri-close-line"></i>
            </button>
        </div>

        <!-- Step 1: Upload -->
        <div id="importStep1">
            <p style="color: #6e6e73; margin-bottom: 16px;">
                Upload a CSV file with your transactions. Required columns: Date, Amount, Category
            </p>
            <input type="file" id="csvFile" accept=".csv" onchange="handleCSVUpload(event)">
            <div style="margin-top: 16px; font-size: 14px; color: #6e6e73;">
                <strong>Expected format:</strong><br>
                Date,Type,Amount,Category,Notes<br>
                2026-01-15,expense,500,Food,Lunch
            </div>
        </div>

        <!-- Step 2: Column Mapping -->
        <div id="importStep2" style="display: none;">
            <h4>Map CSV Columns</h4>
            <p style="color: #6e6e73; margin-bottom: 16px;">
                Match your CSV columns to FinChronicle fields
            </p>
            <table id="columnMappingTable" style="width: 100%;"></table>
            <div style="margin-top: 16px;">
                <button class="primary" onclick="processImport()">Import Transactions</button>
                <button class="primary" style="background: #6e6e73;" onclick="cancelImport()">Cancel</button>
            </div>
        </div>

        <!-- Step 3: Results -->
        <div id="importStep3" style="display: none;">
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h3>Import Complete!</h3>
                <p id="importResults" style="color: #6e6e73; margin-top: 8px;"></p>
                <button class="primary" style="margin-top: 16px;" onclick="closeImportModal()">Done</button>
            </div>
        </div>
    </div>
</div>

<!-- Add Import Button to toolbar -->
<button class="toolbar-btn" onclick="showImportModal()">
    <i class="ri-upload-line"></i> Import
</button>
```

#### Step 2: CSV Parsing (1 day)

```javascript
// ==================== CSV IMPORT ====================

let csvData = [];
let csvHeaders = [];
let columnMapping = {};

// Show import modal
function showImportModal() {
    document.getElementById('importModal').style.display = 'flex';
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importStep3').style.display = 'none';
}

// Close import modal
function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
    csvData = [];
    csvHeaders = [];
    columnMapping = {};
}

// Handle CSV file upload
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

// Parse CSV text
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
    }

    // Parse header
    csvHeaders = parseCSVLine(lines[0]);

    // Parse data rows
    csvData = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        csvHeaders.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        return row;
    });

    // Auto-detect column mapping
    autoMapColumns();

    // Show preview
    showColumnMapping();
}

// Parse CSV line (handle quoted values)
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

// Auto-detect column mapping
function autoMapColumns() {
    columnMapping = {
        date: null,
        type: null,
        amount: null,
        category: null,
        notes: null
    };

    const patterns = {
        date: /date|day|when/i,
        type: /type|kind|transaction.*type/i,
        amount: /amount|value|sum|price|cost/i,
        category: /category|type|class/i,
        notes: /note|desc|comment|memo|detail/i
    };

    csvHeaders.forEach((header, index) => {
        for (const [field, pattern] of Object.entries(patterns)) {
            if (pattern.test(header)) {
                columnMapping[field] = index;
                break;
            }
        }
    });
}

// Show column mapping UI
function showColumnMapping() {
    const table = document.getElementById('columnMappingTable');

    const fields = [
        { key: 'date', label: 'Date', required: true },
        { key: 'type', label: 'Type (Income/Expense)', required: false },
        { key: 'amount', label: 'Amount', required: true },
        { key: 'category', label: 'Category', required: true },
        { key: 'notes', label: 'Notes', required: false }
    ];

    let html = `
        <thead>
            <tr>
                <th style="text-align: left; padding: 8px;">Field</th>
                <th style="text-align: left; padding: 8px;">CSV Column</th>
                <th style="text-align: left; padding: 8px;">Preview</th>
            </tr>
        </thead>
        <tbody>
    `;

    fields.forEach(field => {
        const preview = columnMapping[field.key] !== null ?
            csvData[0][csvHeaders[columnMapping[field.key]]] : '';

        html += `
            <tr>
                <td style="padding: 8px;">
                    ${field.label}
                    ${field.required ? '<span style="color: #ff3b30;">*</span>' : ''}
                </td>
                <td style="padding: 8px;">
                    <select onchange="updateColumnMapping('${field.key}', this.value)" style="width: 100%;">
                        <option value="">-- Skip --</option>
                        ${csvHeaders.map((header, index) => `
                            <option value="${index}" ${columnMapping[field.key] === index ? 'selected' : ''}>
                                ${header}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td style="padding: 8px; color: #6e6e73; font-size: 14px;">
                    ${preview}
                </td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;

    document.getElementById('importStep1').style.display = 'none';
    document.getElementById('importStep2').style.display = 'block';
}

// Update column mapping
function updateColumnMapping(field, columnIndex) {
    columnMapping[field] = columnIndex === '' ? null : parseInt(columnIndex);
}

// Process import
function processImport() {
    // Validate required fields
    if (columnMapping.date === null || columnMapping.amount === null || columnMapping.category === null) {
        alert('Please map required fields: Date, Amount, and Category');
        return;
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    csvData.forEach((row, index) => {
        try {
            // Extract values
            const date = row[csvHeaders[columnMapping.date]];
            const amount = parseFloat(row[csvHeaders[columnMapping.amount]]);
            const category = row[csvHeaders[columnMapping.category]];
            const type = columnMapping.type !== null ?
                row[csvHeaders[columnMapping.type]].toLowerCase() : 'expense';
            const notes = columnMapping.notes !== null ?
                row[csvHeaders[columnMapping.notes]] : '';

            // Validate
            if (!date || !amount || !category) {
                skipped++;
                errors.push(`Row ${index + 2}: Missing required fields`);
                return;
            }

            if (isNaN(amount)) {
                skipped++;
                errors.push(`Row ${index + 2}: Invalid amount`);
                return;
            }

            // Create transaction
            const transaction = {
                id: Date.now() + index,
                type: type === 'income' ? 'income' : 'expense',
                amount: amount,
                category: category,
                date: date,
                notes: notes,
                createdAt: new Date().toISOString(),
                imported: true
            };

            transactions.unshift(transaction);
            imported++;
        } catch (error) {
            skipped++;
            errors.push(`Row ${index + 2}: ${error.message}`);
        }
    });

    // Save
    saveData();
    updateUI();

    // Show results
    const resultsText = `
        ${imported} transaction${imported !== 1 ? 's' : ''} imported successfully!
        ${skipped > 0 ? `<br>${skipped} row${skipped !== 1 ? 's' : ''} skipped` : ''}
        ${errors.length > 0 ? `<br><br><strong>Errors:</strong><br>${errors.slice(0, 5).join('<br>')}` : ''}
    `;

    document.getElementById('importResults').innerHTML = resultsText;
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importStep3').style.display = 'block';
}

// Cancel import
function cancelImport() {
    closeImportModal();
}
```

#### Step 3: CSV Export Enhancement (0.5 days)

Improve existing export to include type column:

```javascript
// Update existing exportToCSV function
function exportToCSV() {
    if (transactions.length === 0) {
        showMessage('No transactions to export!');
        return;
    }

    const currencyCode = getCurrency();
    const headers = ['Date', 'Type', 'Category', `Amount (${currencyCode})`, 'Notes'];
    const rows = transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.amount,
        t.notes || ''
    ]);

    let csv = headers.join(',') + '\n';
    csv += rows.map(row => row.map(cell =>
        `"${String(cell).replace(/"/g, '""')}"`
    ).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finchronicle-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showMessage('Export successful!');
}
```

#### Step 4: Testing Checklist

- [ ] Upload valid CSV file
- [ ] Auto-detect columns correctly
- [ ] Manual column mapping works
- [ ] Import creates transactions
- [ ] Handle missing required fields
- [ ] Handle invalid amounts
- [ ] Handle different date formats
- [ ] Skip rows with errors
- [ ] Show import results
- [ ] Large files (1000+ rows) import successfully
- [ ] CSV with quotes/commas parsed correctly
- [ ] Export → Import round-trip works

---

## 📅 Release Timeline

### v3.3.0 - Budget & Recurring Features (Week 1-2)
- Budget Tracking (5 days)
- Recurring Transactions (6 days)
- Search & Filters (3 days)
- Testing & Bug Fixes (2 days)
**Total: ~3 weeks**

### v3.4.0 - Insights & Import (Week 3-4)
- Charts & Visualizations (5 days)
- CSV Import (4 days)
- UI Polish (2 days)
- Testing & Bug Fixes (2 days)
**Total: ~2-3 weeks**

---

## 🧪 Testing Strategy

### Unit Testing
- Test each function individually
- Edge cases (empty data, invalid input)
- Data persistence

### Integration Testing
- Multiple features working together
- Budget + Recurring interactions
- Search + Filters combinations

### Manual Testing
- Test on different browsers (Chrome, Safari, Firefox)
- Test on mobile devices (iOS, Android)
- Test PWA installation
- Test offline functionality
- Test dark mode
- Performance with large datasets

### User Testing
- Beta test with 5-10 users
- Collect feedback on GitHub Discussions
- Iterate based on feedback

---

## 📊 Success Metrics

### Quantitative
- [ ] All features pass testing checklist
- [ ] No performance degradation (< 100ms UI updates)
- [ ] App size stays under 100KB (excluding icons)
- [ ] Lighthouse score remains 95+

### Qualitative
- [ ] Positive user feedback on new features
- [ ] Feature requests decrease (users are satisfied)
- [ ] GitHub stars increase
- [ ] Active discussions on new features

---

## 🚀 Deployment Checklist

Before each release:

- [ ] Update version numbers (index.html, sw.js, manifest.json, README.md)
- [ ] Update CHANGELOG.md
- [ ] Test on staging environment
- [ ] Create git tag (`git tag v3.3.0`)
- [ ] Create GitHub release with notes
- [ ] Deploy to GitHub Pages
- [ ] Test live deployment
- [ ] Announce on README and Discussions
- [ ] Monitor for issues

---

## 📝 Documentation Updates

For each feature, update:

- [ ] README.md - Features list
- [ ] CHANGELOG.md - Version history
- [ ] VERSION.md - Detailed changes
- [ ] Code comments - Inline documentation
- [ ] GitHub Discussions - Feature announcement

---

## 🎓 Learning Resources

### For Budget Tracking
- localStorage best practices
- Date manipulation in JavaScript
- Progress bar animations

### For Recurring Transactions
- Date calculations (frequency, next due)
- Notification API
- Background sync

### For Charts
- SVG path syntax
- Canvas API (alternative)
- Chart.js documentation

### For CSV Import
- File API
- CSV parsing algorithms
- Data validation

---

## 💡 Tips for Implementation

1. **Start Small**: Implement one feature at a time, test thoroughly
2. **Code Review**: Review your own code after a day
3. **User Feedback**: Get feedback early and often
4. **Performance**: Profile with Chrome DevTools
5. **Accessibility**: Test with screen readers
6. **Mobile First**: Design for mobile, enhance for desktop
7. **Offline First**: Test with network throttling
8. **Version Control**: Commit frequently with clear messages

---

## 🔄 Maintenance Plan

### Weekly
- Monitor GitHub issues
- Respond to user feedback
- Small bug fixes

### Monthly
- Review analytics (if implemented)
- Plan next features
- Update dependencies

### Quarterly
- Major feature releases
- Performance audits
- Security reviews

---

**Next Steps**: Which feature would you like to implement first? I can help you get started with detailed code!
