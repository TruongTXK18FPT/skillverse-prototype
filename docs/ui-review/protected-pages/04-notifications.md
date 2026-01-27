# Trang Notifications (Protected)

**URL:** https://skillverse.vn/notifications  
**File:** `src/pages/NotificationPage.tsx`

---

## ✅ Điểm tốt

1. **"TRUNG TÂM TRUYỀN TIN VŨ TRỤ"** - Theme space
2. **Tabs**: Tất cả, Chưa đọc, Đã đọc
3. **Mark all as read** button
4. **Icon mapping** theo loại thông báo
5. **Search box** lọc thông báo

---

## 📊 Dữ liệu thực từ API (User ID: 6)

| Field | Value |
|-------|-------|
| Total notifications | 17 |
| Unread | 10 |
| Loại | PAYMENT, REFERRAL, PREMIUM, WALLET, etc. |
| Mới nhất | "Thanh toán thành công 131,000đ" |

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 23.1 | **Text tiếng Anh lẫn** | Filter tabs | `NotificationPage.tsx:73` | Đồng bộ language |
| 23.2 | **No pagination** | List | `NotificationPage.tsx` | Thêm infinite scroll |
| 23.3 | **Search không highlight** | Search box | `NotificationPage.tsx` | Highlight match text |
| 23.4 | **Click action unclear** | Notification item | `NotificationPage.tsx` | Navigate or expand? |
| 23.5 | **Bulk delete** missing | Actions | `NotificationPage.tsx` | Thêm bulk delete |

---

## 💡 Code Fix

### Fix 23.2: Add Pagination

```tsx
// src/pages/NotificationPage.tsx
const [page, setPage] = useState(1);
const ITEMS_PER_PAGE = 10;

const paginatedNotifications = useMemo(() => {
  const filtered = filteredNotifications;
  return {
    items: filtered.slice(0, page * ITEMS_PER_PAGE),
    hasMore: filtered.length > page * ITEMS_PER_PAGE
  };
}, [filteredNotifications, page]);

// Thêm infinite scroll trigger
const loadMore = () => setPage(p => p + 1);
```

---

## Notification Types Mapping

| Type | Icon | Color |
|------|------|-------|
| PAYMENT | DollarSign | Green |
| REFERRAL | Gift | Purple |
| PREMIUM | Crown | Gold |
| WALLET | Wallet | Blue |
| SYSTEM | Bell | Gray |
