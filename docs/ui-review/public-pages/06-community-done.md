# Trang Community

**URL:** https://skillverse.vn/community  
**File:** `src/components/community-hud/CommunityHUD.tsx`

---

## ✅ Điểm tốt

1. **Có nội dung phong phú**: 12 bài viết với chủ đề hữu ích cho dev
2. **Filter theo category**: Tất Cả, Mẹo hay, Thảo luận, Hướng dẫn, Tin tức, Tuyển dụng
3. **Hiển thị author info**: Avatar, tên, ngày đăng
4. **Có thumbnail cho mỗi bài**
5. **Pagination**: Page 1 of 2

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 5.1 | **"Mã Hóa: Tắt Kênh: Mở..."** text kỹ thuật | Header status | Component | Ẩn hoặc đơn giản hóa | ✅ **Đã sửa** - Đổi thành "🟢 Đang hoạt động" |
| 5.2 | **Nút "Đăng bài viết"** không rõ cần login | Header | Component | Hiển thị tooltip | ⏭️ **Bỏ qua** - Đã có redirect to login khi click |
| 5.3 | **Thiếu search box** | Header | Component | Thêm search | ⏭️ **Bỏ qua** - Improvement feature |
| 5.4 | **Ngày đăng format không nhất quán** | Post card | Component | Thống nhất format | ⏭️ **Bỏ qua** - Đã có formatTimestamp xử lý |
| 5.5 | **Thiếu like/comment count preview** | Post card | Component | Thêm icon và số | ⏭️ **Bỏ qua** - Đã có sẵn |
| 5.6 | **Tags hiển thị lạ** - "skillmistake2030" | Post card | Component | Format dễ đọc hơn | ⏭️ **Bỏ qua** - Data từ backend |
| 5.7 | **Thumbnail bị crop** | Post card | CSS | Dùng object-fit: contain | ⏭️ **Bỏ qua** - Đã dùng object-fit: cover (phù hợp) |
| 5.8 | **Guest bị redirect sang /login khi vào Community** 🔴 CRITICAL | On load | (Global) | Community là public page: không được auto-redirect | 🆕 **New (2026-01-28)** |

---

## 📝 Ghi chú

- Nội dung bài viết chất lượng, hữu ích
- Theme "KÊNH CỘNG ĐỒNG" phù hợp
- Cần test trang chi tiết bài viết
- Repro 5.8: Guest (xóa localStorage/sessionStorage) mở `/community` → bị chuyển sang `/login`

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 5.9 | Card post nhìn hơi “đều đều” khi lướt nhiều bài | Ít điểm nhấn → khó chọn bài để đọc | Tăng phân cấp: title lớn hơn, excerpt 2 dòng, meta (author/date) nhỏ hơn; hover shadow nhẹ | Medium |
| 5.10 | Category filter nếu dài sẽ gây chật trên mobile | Dễ “kẹt” layout | Chuyển sang horizontal scroll chips + indicator “kéo ngang” | Medium |
| 5.11 | Pagination “Page 1 of 2” hơi máy móc | Cảm giác không thân thiện | Dùng nút “Trang trước / Trang sau” + hiển thị tổng bài (vd: 12 bài) | Low |

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết:** 1/7 issues đã fix, 6/7 bỏ qua (đã có sẵn hoặc improvement)
