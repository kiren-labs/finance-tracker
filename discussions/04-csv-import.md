# 📥 CSV Import - Import transactions from other apps

**Vote with 👍 if you want this feature!**

---

## 📊 Feature Overview

Import your existing transactions from CSV files - migrate from other finance apps or import bank statements easily.

## 💡 What You'll Get

### Simple 3-Step Process

**Step 1: Upload**
```
Choose your CSV file
📄 transactions.csv
```

**Step 2: Map Columns**
```
FinChronicle Field  →  Your CSV Column
─────────────────────────────────────
Date                →  Transaction Date
Amount              →  Amount
Category            →  Category
Type                →  Type
Notes               →  Description
```

**Step 3: Import**
```
✅ 150 transactions imported
⚠️ 3 rows skipped (invalid data)
```

### Smart Column Detection
- Auto-detects common column names
- Suggests mappings
- Preview before import
- Error handling

### Supported Formats
- ✅ Standard CSV (Date, Amount, Category, Notes)
- ✅ Bank statements (with column mapping)
- ✅ Mint.com exports
- ✅ YNAB exports
- ✅ Custom formats (map your columns)

## 🎯 Use Cases

**Switching Apps**: "I used Mint before, want to import 2 years of data"
**Bank Statements**: "Import monthly CSV from my bank"
**Bulk Entry**: "Add 100 transactions from a spreadsheet"
**Migration**: "Moving from Excel to FinChronicle"

## ✨ Example Scenarios

1. **From Mint**
   ```csv
   Date,Description,Original Description,Amount,Transaction Type,Category
   01/15/2026,Coffee,Starbucks,-5.50,debit,Food & Dining
   ```
   → Maps to FinChronicle format

2. **Bank Statement**
   ```csv
   Transaction Date,Narration,Debit,Credit,Balance
   15-01-2026,ATM Withdrawal,500.00,,45000.00
   ```
   → Maps amount from Debit/Credit columns

3. **Simple Format**
   ```csv
   Date,Amount,Category,Notes
   2026-01-15,500,Food,Lunch with team
   ```
   → Direct import

## 📈 Benefits

- ✅ **Quick migration** - Move from other apps in minutes
- ✅ **Bulk import** - Add hundreds of transactions at once
- ✅ **Historical data** - Import past years
- ✅ **Bank integration** - Use bank's CSV exports
- ✅ **No manual entry** - Save hours of typing

## 🔧 Technical Details

- **File size**: Up to 5MB (~10,000 transactions)
- **Processing**: Client-side only (privacy preserved)
- **Validation**: Checks for required fields
- **Duplicates**: Warns about potential duplicates
- **Size**: ~6KB additional code

## 📋 CSV Format Requirements

### Required Columns:
- **Date** (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
- **Amount** (number, with or without currency symbol)
- **Category** (text)

### Optional Columns:
- **Type** (income/expense)
- **Notes** (text)

### Sample CSV:
```csv
Date,Type,Amount,Category,Notes
2026-01-15,expense,500,Food,Team lunch
2026-01-16,income,50000,Salary,Monthly salary
2026-01-17,expense,200,Transport,Uber to office
```

## 🎨 UI Flow

```
1. 📤 Upload File
   └─ Drag & drop or click to browse

2. 🔄 Preview & Map
   ├─ Shows first 5 rows
   ├─ Column mapping dropdowns
   └─ Validation warnings

3. ✅ Import
   ├─ Progress bar
   ├─ Success/error count
   └─ Review imported transactions
```

## 📅 Estimated Timeline

- **Development**: 3-4 days
- **Testing**: 2 days (various CSV formats)
- **Release**: v3.4.0

## 🛡️ Privacy & Security

- ✅ **No upload** - File parsed in browser only
- ✅ **No server** - Never leaves your device
- ✅ **No storage** - CSV not saved after import
- ✅ **Full control** - Review before committing

## 🤔 Questions for the Community

1. What apps/banks do you want to import from?
2. Should we detect and skip duplicates automatically?
3. Do you need import from other formats (Excel, JSON)?
4. Should imported transactions be marked differently?
5. Undo import option?

## 💬 Your Feedback

**Please comment:**
- What format are your current transactions in?
- Have you tried importing from other apps before?
- What challenges did you face?
- Share sample CSV format (remove sensitive data!)

---

**👍 Vote above if you want this feature!**

**Status**: 📋 Planned for v3.4.0

## 📎 Bonus: Export Enhancement

Along with import, we'll enhance export to include:
- ✅ Type column (income/expense)
- ✅ Select date range
- ✅ Filter by category
- ✅ Custom column order
