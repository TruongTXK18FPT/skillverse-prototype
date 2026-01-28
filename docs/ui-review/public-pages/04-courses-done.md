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

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 3.1 | **"INSTRUCTOR: Unknown"** cho tất cả courses | Card course | Component | Hiển thị "Đang cập nhật" | ✅ **Đã sửa** |
| 3.2 | **"0 ENROLLED"** tất cả courses | Card course | Component | Ẩn hoặc hiển thị "Mới" | ✅ **Đã sửa** - Hiển thị "MỚI" khi 0 |
| 3.3 | **Thiếu filter theo giá** | Sidebar | Component | Thêm filter khoảng giá | ⏭️ **Bỏ qua** - Đã có sẵn (Tất cả/Miễn phí/Có phí) |
| 3.4 | **Thiếu search box** | Header | Component | Thêm input search | ⏭️ **Bỏ qua** - Đã có sẵn |
| 3.5 | **"SCAN RESULT:3 MODULES DETECTED"** quá kỹ thuật | Header | `CoursesPage.tsx` | Đổi thành "Tìm thấy 3 khóa học" | ✅ **Đã sửa** - "KẾT QUẢ: X KHÓA HỌC" |
| 3.6 | **Hình ảnh default** cho tất cả | Thumbnail | Component | Tạo placeholder đẹp hơn | ⏭️ **Bỏ qua** - Cần design asset |
| 3.7 | **Giá không format**: "499000 VND" | Card price | `CoursesPage.tsx:64` | Dùng `formatPrice()` | ✅ **Đã sửa** - Format với toLocaleString |
| 3.8 | **"KHỞI ĐỘNG" button** không rõ nghĩa | Card CTA | Component | Đổi thành "Xem chi tiết" | ✅ **Đã sửa** |
| 3.9 | **Thiếu sort options** | Header | Component | Thêm dropdown sort | ⏭️ **Bỏ qua** - Đã có sẵn trong filter panel |

---

## 💡 Code Fix Đã Thực Hiện

### Fix 3.1 & 3.2: Instructor và Enrolled

```tsx
// Instructor: Unknown → Đang cập nhật
{course.instructor === 'Unknown' || course.instructor === 'Unknown Instructor' ? 'Đang cập nhật' : course.instructor}

// 0 enrolled → MỚI
{course.students === 0 ? 'MỚI' : `${course.students} HỌC VIÊN`}
```

### Fix 3.5: Scan Result Text

```tsx
// Từ "SCAN RESULT: X MODULES DETECTED"
// Thành "KẾT QUẢ: X KHÓA HỌC"
```

### Fix 3.7: Format Price

```tsx
// Từ: course.price (499000 VND)
// Thành: numPrice.toLocaleString('vi-VN') + ' VND' (499.000 VND)
```

### Fix 3.8: Button Text

```tsx
// Từ: KHỞI ĐỘNG
// Thành: XEM CHI TIẾT
```

---

## 📝 Ghi chú

- Hiện chỉ có 3 courses: React, Spring Boot, Java
- Theme "THIÊN HÀ TRI THỨC" phù hợp
- Cần kiểm tra pagination khi có nhiều courses

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 3.10 | Card course có nhiều thông tin ngang nhau | Khó lướt nhanh để chọn khóa | Tạo phân cấp: Title/Price/CTA nổi bật; meta (modules/enrolled/instructor) nhỏ hơn | Medium |
| 3.11 | CTA “XEM CHI TIẾT”/“XEM TRƯỚC” nếu quá giống nhau | Người dùng không rõ khác nhau | Dùng icon + đổi style: preview là secondary (outline), detail là primary | High |
| 3.12 | Filter panel dễ tạo cảm giác “nhiều nút” | Nhìn hơi rối khi data ít | Gom filter theo nhóm + mặc định thu gọn (accordion) trên mobile | Medium |
| 3.13 | Thumbnail placeholder lặp lại | Trông “demo” và kém tin | Tối thiểu: gradient placeholder + icon theo category để nhìn đỡ nhàm | Low |

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết:** 5/9 issues đã fix, 4/9 bỏ qua (đã có sẵn hoặc cần assets)
