# Performance Testing Guide

## How to Measure Performance After Modularization

### 1. Chrome DevTools - Performance Tab

**Steps:**
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Performance** tab
3. Click **Record** (or Cmd+E)
4. Reload the page (Cmd+R)
5. Stop recording after page loads

**Key Metrics to Look For:**
- **Scripting Time**: Time spent parsing/executing JavaScript
- **Rendering Time**: Time spent painting/layout
- **Loading Time**: Network requests
- **Total Blocking Time (TBT)**: Time main thread was blocked
- **First Contentful Paint (FCP)**: When first content appears
- **Largest Contentful Paint (LCP)**: When main content is visible
- **Time to Interactive (TTI)**: When page becomes fully interactive

**What to Compare:**
- Old version (monolithic): Single large script parse time
- New version (modular): Multiple smaller scripts parsed in parallel

### 2. Chrome DevTools - Coverage Tab

**Steps:**
1. Open DevTools → More tools → Coverage
2. Click **Record**
3. Interact with the app (add transaction, switch tabs, etc.)
4. Stop recording

**What to Check:**
- **Code Coverage %**: How much code is actually used
- Modular code should show better coverage (only load what's needed)
- Unused bytes should be minimal

### 3. Lighthouse Report

**Steps:**
1. Open DevTools → Lighthouse tab
2. Select:
   - ✅ Performance
   - ✅ Best Practices
   - Device: Desktop or Mobile
3. Click **Analyze page load**

**Key Scores (0-100):**
- **Performance Score**: Overall performance
- **First Contentful Paint**: < 1.8s (good)
- **Speed Index**: < 3.4s (good)
- **Largest Contentful Paint**: < 2.5s (good)
- **Total Blocking Time**: < 200ms (good)
- **Cumulative Layout Shift**: < 0.1 (good)

**Run Before/After:**
```bash
# Before: With monolithic inline script (git checkout to old version)
# After: With modular ES6 modules (current version)
```

### 4. Network Tab Analysis

**Steps:**
1. Open DevTools → Network tab
2. Check "Disable cache" (to measure first load)
3. Reload page
4. Check the following:

**Metrics:**
- **Total Size**: Sum of all JS files
- **Total Time**: Time to download all resources
- **Number of Requests**: More requests, but smaller files
- **Compressed Size**: Check gzip effectiveness

**Expected Changes:**
- ✅ More HTTP requests (15 modules vs 1 inline script)
- ✅ Better caching (only changed modules re-downloaded)
- ✅ Parallel downloads (HTTP/2 multiplexing)
- ✅ Smaller individual files (easier to cache)

### 5. Memory Profiling

**Steps:**
1. Open DevTools → Memory tab
2. Take **Heap Snapshot** after page load
3. Perform actions (add/edit/delete transactions)
4. Take another snapshot
5. Compare memory usage

**What to Check:**
- **Heap Size**: Should be similar or lower
- **Memory Leaks**: Should not grow unbounded
- **Garbage Collection**: Modular code can be GC'd better

### 6. JavaScript Profiler

**Steps:**
1. Open DevTools → Performance tab
2. Check "Enable advanced paint instrumentation"
3. Record a session while interacting with the app
4. Analyze:
   - **Bottom-Up**: Where time is spent
   - **Call Tree**: Function call hierarchy
   - **Event Log**: Timeline of events

**Expected Improvements:**
- ✅ Faster initial parse (smaller modules)
- ✅ Better code splitting
- ✅ Reduced main thread blocking

### 7. Real User Monitoring (RUM)

Add performance marks to measure actual user experience:

```javascript
// Add to js/app.js
performance.mark('app-init-start');
// ... initialization code ...
performance.mark('app-init-end');
performance.measure('app-initialization', 'app-init-start', 'app-init-end');

// Log results
const measures = performance.getEntriesByType('measure');
console.table(measures.map(m => ({
  name: m.name,
  duration: `${m.duration.toFixed(2)}ms`
})));
```

## Expected Performance Gains

### ✅ Modular Architecture Benefits

1. **Better Caching**
   - Individual modules cached separately
   - Updates only require re-downloading changed files
   - Cache hit rate improves over time

2. **Parallel Loading**
   - Modules can be downloaded in parallel (HTTP/2)
   - Faster initial load on fast connections

3. **Faster Parse/Compile**
   - Smaller files parse faster
   - Browser can parse modules in parallel
   - Better for low-end devices

4. **Code Splitting**
   - Only load what's needed (future improvement)
   - Lazy load features on demand

5. **Developer Experience**
   - Faster hot reload during development
   - Better IDE performance
   - Easier debugging

### 📊 Benchmark Example

Create a simple benchmark script:

```javascript
// benchmark.js - Run in browser console
async function benchmark() {
  const runs = 10;
  const times = [];

  for (let i = 0; i < runs; i++) {
    const start = performance.now();

    // Clear and reload
    await new Promise(resolve => {
      location.reload();
      window.addEventListener('load', resolve, { once: true });
    });

    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  console.log(`Average load time: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${Math.min(...times).toFixed(2)}ms`);
  console.log(`Max: ${Math.max(...times).toFixed(2)}ms`);
}

benchmark();
```

## Comparison Table Template

| Metric | Before (Monolithic) | After (Modular) | Change |
|--------|---------------------|-----------------|--------|
| Total JS Size | ~80 KB | ~82 KB | +2 KB |
| Number of JS Files | 1 (inline) | 15 files | +14 |
| First Load Time | ? ms | ? ms | ? |
| Parse Time | ? ms | ? ms | ? |
| Time to Interactive | ? ms | ? ms | ? |
| Lighthouse Score | ? | ? | ? |
| Cache Hit Rate | Low | High | ✅ |
| Bundle Size (gzip) | ? KB | ? KB | ? |

## Testing Checklist

- [ ] Run Lighthouse before/after comparison
- [ ] Measure load time with DevTools Performance
- [ ] Check code coverage
- [ ] Test on slow 3G network
- [ ] Test on mobile device
- [ ] Measure memory usage
- [ ] Check service worker caching efficiency
- [ ] Test subsequent page loads (cache hit rate)
- [ ] Measure Time to Interactive (TTI)
- [ ] Check Total Blocking Time (TBT)

## Tips for Fair Comparison

1. **Clear cache** between tests
2. **Use same network conditions** (throttle to 3G for consistency)
3. **Test multiple times** and average results
4. **Use incognito mode** to avoid extensions
5. **Close other tabs** to reduce interference
6. **Test on multiple devices** (desktop, mobile, tablet)

## Long-Term Performance Benefits

The real gains come over time:

1. **Update Performance**: When you update 1 module, users only re-download that module
2. **Development Speed**: Faster builds, better DX leads to more optimizations
3. **Maintainability**: Easier to identify and fix performance bottlenecks
4. **Code Splitting**: Easy to add lazy loading in the future
5. **Tree Shaking**: Ready for build tools to remove unused code

## Next Steps for Optimization

1. Add **dynamic imports** for rarely-used features
2. Implement **code splitting** at route level
3. Add **preload hints** for critical modules
4. Use **Web Workers** for heavy computations
5. Implement **virtual scrolling** for large transaction lists
6. Add **service worker caching strategies** (cache-first, network-first)
