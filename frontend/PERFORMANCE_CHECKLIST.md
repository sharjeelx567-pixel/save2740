# Performance Optimization Checklist

## ✅ Completed Optimizations

### API Request Optimization
- [x] **Notifications**: Reduced polling from 5s to 60s (92% reduction)
- [x] **Profile Data**: Disabled auto-refetch, increased staleTime to 5min
- [x] **Wallet Data**: Disabled polling, increased staleTime to 60s
- [x] **Dashboard Data**: Parallelized 5 API calls with Promise.all()
- [x] **React Query Config**: Optimized global defaults (2min staleTime, no auto-refetch)

### Caching & State Management
- [x] **React Query Hooks**: All data fetching uses React Query
- [x] **StaleTime Optimization**: Increased across all hooks
- [x] **Cache Duration**: Increased gcTime from 5min to 10min
- [x] **Refetch Triggers**: Disabled window focus, mount, and reconnect refetching

### Code Splitting & Lazy Loading
- [x] **Dashboard Components**: SavingsBreakdown, Achievements, Streak (already done)
- [x] **Lazy Component Library**: Created centralized lazy loading config
- [ ] **Profile Page**: Apply lazy loading to EditProfile, KYC, Settings
- [ ] **Wallet Modals**: Lazy load AddMoney, PaymentMethods modals

### Performance Utilities
- [x] **Debounce/Throttle**: Created utility functions
- [x] **Request Deduplication**: Prevent duplicate concurrent requests
- [x] **Memoization**: Cache expensive computations
- [x] **Fetch Timeout**: Automatic request timeout wrapper

### Documentation
- [x] **Performance Guide**: Comprehensive PERFORMANCE.md
- [x] **Implementation Summary**: PERFORMANCE_IMPLEMENTATION.md
- [x] **Best Practices**: Documented in guides

---

## 🔄 Remaining Tasks (Priority Order)

### High Priority (Do Next)

#### 1. Apply Lazy Loading to Profile Components
```typescript
// In frontend/app/profile/page.tsx
import { LazyEditProfile, LazyKYCStatus, LazyAccountSettings } from '@/lib/lazy-components';

// Replace direct imports with lazy versions
```

#### 2. Implement Transaction Pagination
```typescript
// In frontend/components/wallet/transaction-history.tsx
- Load all transactions at once
+ Load 20 transactions initially
+ Implement infinite scroll or "Load More" button
```

#### 3. Debounce Search Inputs
```typescript
// In search/filter components
import { debounce } from '@/lib/performance-utils';

const handleSearch = debounce((query: string) => {
  // search logic
}, 300);
```

### Medium Priority

#### 4. Image Optimization
- [ ] Replace `<img>` tags with Next.js `<Image>` component
- [ ] Add lazy loading to avatar images
- [ ] Optimize image sizes (use srcset)
- [ ] Convert PNGs to WebP where possible

#### 5. Component Code Splitting
- [ ] Run `npm run build -- --analyze` to check bundle size
- [ ] Split components >100KB into separate chunks
- [ ] Lazy load heavy third-party libraries

#### 6. Remove Duplicate API Calls
- [ ] Audit all components for duplicate fetch calls
- [ ] Ensure single source of truth for wallet/profile data
- [ ] Use React Query's query deduplication

### Low Priority

#### 7. Optimize Heavy Renderings
- [ ] Add `React.memo()` to heavy components
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize chart rendering (canvas vs SVG)

#### 8. Bundle Size Optimization
- [ ] Remove unused dependencies
- [ ] Tree-shake lodash imports (`import get from 'lodash/get'` instead of `import _ from 'lodash'`)
- [ ] Analyze and optimize CSS bundle

---

## 📊 Performance Metrics to Track

### Current Metrics (After Optimization)
- Dashboard load: **1-2 seconds**
- API requests/minute: **~3-5**
- Notification polling: **60s interval**
- Profile refetch: **On-demand only**

### Target Metrics
- Dashboard load: **<1.5 seconds**
- First Contentful Paint: **<1.5s**
- Time to Interactive: **<3s**
- Lighthouse Performance Score: **>90**
- API requests/minute: **<3**

### How to Measure
1. **Chrome DevTools**:
   - Network tab: Check API waterfall
   - Performance tab: Record load time
   - Lighthouse: Run performance audit

2. **React Query DevTools**:
   - Check active queries count
   - Verify cache hit rate
   - Monitor refetch frequency

3. **Real User Monitoring**:
   - Consider adding Sentry or similar
   - Track actual user load times
   - Monitor error rates

---

## 🚀 Deployment Checklist

Before deploying to production:

- [x] All optimizations tested locally
- [ ] Run full test suite (`npm test`)
- [ ] Performance audit with Lighthouse (score >90)
- [ ] Bundle size check (`npm run build`)
- [ ] No console errors in production build
- [ ] React Query DevTools disabled in production
- [ ] Monitor production metrics for 24 hours post-deploy

---

## 💡 Best Practices Going Forward

### When Adding New Features:

1. **Always use React Query for data fetching**
   - Don't use raw `fetch` in components
   - Set appropriate `staleTime` based on data mutability

2. **Lazy load heavy components**
   - Components >50KB should be lazy loaded
   - Use `dynamic()` from Next.js

3. **Debounce user inputs**
   - Search fields, filters, autocomplete

4. **Avoid unnecessary re-renders**
   - Use `React.memo()` for expensive components
   - Memoize callbacks with `useCallback`
   - Memoize computed values with `useMemo`

5. **Test performance impact**
   - Use Chrome DevTools Performance tab
   - Check bundle size after adding dependencies

---

## 🎯 Success Criteria

Performance optimization is successful if:
- ✅ Dashboard loads in <2 seconds
- ✅ Navigation feels instant (<300ms perceived)
- ✅ API requests reduced by >70%
- ✅ No frozen UI or loading spinners during navigation
- ✅ Lighthouse score >85
- ✅ Production bundle size <500KB (gzipped)

---

## 📞 Support

For questions or issues:
- Check `PERFORMANCE.md` for detailed guide
- Review `PERFORMANCE_IMPLEMENTATION.md` for what was done
- Test locally before deploying changes
