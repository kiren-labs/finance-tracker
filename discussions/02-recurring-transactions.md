# 🔄 Recurring Transactions - Auto-add regular expenses

**Vote with 👍 if you want this feature!**

---

## 📊 Feature Overview

Set up transaction templates for regular expenses (rent, subscriptions, salary) that repeat automatically on a schedule.

## 💡 What You'll Get

### Recurring Templates
- Create templates for repeating transactions
- Set frequency: Daily, Weekly, Monthly, Yearly
- Choose specific dates (e.g., "1st of every month")
- Add notes and categories

### Smart Notifications
```
📅 Due Now (2)
────────────────
Rent - ₹12,000
Due: Today
[Skip] [Add Now]

Netflix - ₹500
Due: Today
[Skip] [Add Now]
```

### Flexible Options
- **Auto-add**: Transactions added automatically
- **Manual confirm**: Review before adding
- **Skip once**: Skip this occurrence without deleting
- **Edit future**: Modify upcoming transactions

## 🎯 Use Cases

**Monthly Bills**: "Auto-add rent on 1st of every month"
**Subscriptions**: "Track Netflix, Spotify, gym membership"
**Income**: "Add salary on last working day"
**Weekly**: "Add groceries every Sunday"

## ✨ Example Scenarios

1. **Rent Payment**
   - Amount: ₹12,000
   - Category: Bills
   - Frequency: Monthly (1st day)
   - Auto-add: Yes

2. **Streaming Services**
   - Netflix: ₹500/month
   - Spotify: ₹120/month
   - Prime: ₹1,500/year
   - Auto-add: No (review first)

3. **Salary**
   - Amount: ₹50,000
   - Category: Salary
   - Frequency: Monthly (last day)
   - Type: Income

## 📈 Benefits

- ✅ **Save time** - No manual entry for regular transactions
- ✅ **Never forget** - Notifications for due transactions
- ✅ **Track subscriptions** - See all recurring expenses
- ✅ **Plan ahead** - Know upcoming expenses
- ✅ **Historical accuracy** - Complete transaction history

## 🔧 Technical Details

- **Storage**: Uses localStorage
- **Notifications**: Visual alerts in app
- **Size**: ~8KB additional code
- **Smart dates**: Handles month-end variations (28-31 days)

## 📅 Frequency Options

- **Daily**: Coffee, parking, etc.
- **Weekly**: Groceries, gym class
- **Monthly**: Rent, subscriptions, salary
- **Yearly**: Insurance, renewals

## 🎨 UI Preview

```
┌─────────────────────────────────────┐
│  Recurring Transactions             │
│  ────────────────────────────────   │
│  🔄 Rent - Monthly                  │
│  ₹12,000 • Bills                    │
│  Next: Feb 1, 2026                  │
│  [Edit] [Delete]                    │
│  ────────────────────────────────   │
│  🔄 Netflix - Monthly               │
│  ₹500 • Entertainment               │
│  Next: Feb 15, 2026                 │
│  [Edit] [Delete]                    │
└─────────────────────────────────────┘
```

## 📅 Estimated Timeline

- **Development**: 4-6 days
- **Testing**: 2 days
- **Release**: v3.3.0

## 🤔 Questions for the Community

1. Should we support bi-weekly (every 2 weeks)?
2. Do you need reminders via browser notifications?
3. Should recurring transactions be marked differently in the list?
4. End date support (e.g., "Netflix until December 2026")?

## 💬 Your Feedback

**Please comment:**
- What recurring expenses do you have?
- Would you use auto-add or prefer manual confirmation?
- Any other recurring features you'd want?

---

**👍 Vote above if you want this feature!**

**Status**: 📋 Planned for v3.3.0
