# Trang My Bookings (Protected)

**URL:** https://skillverse.vn/user/bookings  
**File:** `src/pages/user/UserBookingsPage.tsx` (498 lines)

---

## ✅ Điểm tốt

1. **2 Tabs**: Lịch hẹn (Bookings) + Vé tham dự (Tickets)
2. **Status tabs**: Tất cả, Chờ xác nhận, Đã xác nhận, Đã hoàn thành, Đã hủy
3. **Booking cards** với thông tin chi tiết
4. **Review modal** sau khi hoàn thành
5. **Actions**: Cancel, Review, Re-book

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Mức độ | Vị trí UI | File Code | Đề xuất |
|---|--------|--------|-----------|-----------|---------|
| 34.1 | **API bookings trả về 500** | 🔴 Critical | Booking list | API Backend | Fix backend |
| 34.2 | **Native alert() calls** | 🟡 Medium | Actions | `UserBookingsPage.tsx:117,127,etc.` | Dùng toast/modal |
| 34.3 | **Review modal** chỉ client-side | 🟡 Medium | Submit review | `UserBookingsPage.tsx:199-214` | Verify API call |
| 34.4 | **No loading state** khi cancel | 🟡 Medium | Cancel button | `UserBookingsPage.tsx` | Thêm loading |
| 34.5 | **Empty state** thiếu CTA | 🟢 Minor | No bookings | `UserBookingsPage.tsx:419` | Thêm "Tìm mentor" button |
| 34.6 | **Re-book flow** | 🟢 Minor | Re-book button | `UserBookingsPage.tsx` | Verify pre-fill |

---

## 💡 Code Fix

### Fix 34.2: Replace Native alert()

```tsx
// src/pages/user/UserBookingsPage.tsx
// Thay tất cả:
// alert("Có lỗi xảy ra...");

// Bằng toast:
import { useToast } from '@/hooks/useToast';

const { showToast } = useToast();

// Trong catch blocks:
showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
```

### Fix 34.5: Better Empty State

```tsx
// Thay:
// <p>Chưa có lịch hẹn nào</p>

// Thành:
<div className="empty-state">
  <CalendarX size={64} className="text-gray-400 mx-auto mb-4" />
  <p className="text-lg mb-2">Chưa có lịch hẹn nào</p>
  <p className="text-gray-500 mb-4">Hãy đặt lịch hẹn với mentor để bắt đầu học!</p>
  <button 
    onClick={() => navigate('/mentorship')}
    className="btn-primary"
  >
    Tìm Mentor
  </button>
</div>
```

---

## Booking Status Flow

```
PENDING → CONFIRMED → COMPLETED
    ↓         ↓
  CANCELLED  CANCELLED
```

| Status | Color | Actions Available |
|--------|-------|-------------------|
| PENDING | Yellow | Cancel |
| CONFIRMED | Blue | Cancel, Join (if near time) |
| COMPLETED | Green | Review, Re-book |
| CANCELLED | Red | Re-book |

---

## Review Modal Fields

| Field | Type | Required |
|-------|------|----------|
| Rating | 1-5 stars | ✅ Yes |
| Comment | Textarea | ❌ No |
| Would Recommend | Toggle | ❌ No |

---

## 📝 Ghi chú

1. Component có 498 dòng - Nên tách thành:
   - `BookingList.tsx`
   - `BookingCard.tsx`
   - `TicketList.tsx`
   - `ReviewModal.tsx`
2. API bookings đang lỗi 500 - Backend cần fix
3. Native alert() được dùng 5+ lần
