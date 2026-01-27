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

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 5.1 | **"Mã Hóa: Tắt Kênh: Mở..."** text kỹ thuật | Header status | Component | Ẩn hoặc đơn giản hóa |
| 5.2 | **Nút "Đăng bài viết"** không rõ cần login | Header | Component | Hiển thị tooltip |
| 5.3 | **Thiếu search box** | Header | Component | Thêm search |
| 5.4 | **Ngày đăng format không nhất quán** | Post card | Component | Thống nhất format |
| 5.5 | **Thiếu like/comment count preview** | Post card | Component | Thêm icon và số |
| 5.6 | **Tags hiển thị lạ** - "skillmistake2030" | Post card | Component | Format dễ đọc hơn |
| 5.7 | **Thumbnail bị crop** | Post card | CSS | Dùng object-fit: contain |

---

## 📝 Ghi chú

- Nội dung bài viết chất lượng, hữu ích
- Theme "KÊNH CỘNG ĐỒNG" phù hợp
- Cần test trang chi tiết bài viết
