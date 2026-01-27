# Trang Courses

**URL:** https://skillverse.vn/courses  
**File:** `src/pages/navbar/CoursesPage.tsx`

---

## ✅ Điểm tốt

1. **Layout rõ ràng**: Card grid hiển thị courses
2. **Có bộ lọc theo category**: Tất Cả, Công Nghệ, Thiết Kế, Kinh Doanh, Marketing, Ngoại Ngữ, Kỹ Năng Mềm
3. **Hiển thị thông tin course**: Instructor, Modules, Enrolled, Price
4. **Có preview button**: "XEM TRƯỚC" cho mỗi course

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 3.1 | **"INSTRUCTOR: Unknown"** cho tất cả courses | Card course | Component | Hiển thị "Đang cập nhật" |
| 3.2 | **"0 ENROLLED"** tất cả courses | Card course | Component | Ẩn hoặc hiển thị "Mới" |
| 3.3 | **Thiếu filter theo giá** | Sidebar | Component | Thêm filter khoảng giá |
| 3.4 | **Thiếu search box** | Header | Component | Thêm input search |
| 3.5 | **"SCAN RESULT:3 MODULES DETECTED"** quá kỹ thuật | Header | `CoursesPage.tsx` | Đổi thành "Tìm thấy 3 khóa học" |
| 3.6 | **Hình ảnh default** cho tất cả | Thumbnail | Component | Tạo placeholder đẹp hơn |
| 3.7 | **Giá không format**: "499000 VND" | Card price | `CoursesPage.tsx:64` | Dùng `formatPrice()` |
| 3.8 | **"KHỞI ĐỘNG" button** không rõ nghĩa | Card CTA | Component | Đổi thành "Xem chi tiết" |
| 3.9 | **Thiếu sort options** | Header | Component | Thêm dropdown sort |

---

## 💡 Code Fix

### Fix 3.7: Format Price

```tsx
// src/pages/navbar/CoursesPage.tsx
// Thêm import:
import { formatPrice } from '../../utils/formatters';

// Line 63-65, thay đổi từ:
price: (actualPrice !== null && actualPrice !== undefined && actualPrice !== 0)
  ? `${actualPrice} ${actualCurrency}`
  : '0',

// Thành:
price: (actualPrice !== null && actualPrice !== undefined && actualPrice !== 0)
  ? `${formatPrice(actualPrice)} ${actualCurrency}`
  : 'Miễn phí',
```

---

## 📝 Ghi chú

- Hiện chỉ có 3 courses: React, Spring Boot, Java
- Theme "THIÊN HÀ TRI THỨC" phù hợp
- Cần kiểm tra pagination khi có nhiều courses
