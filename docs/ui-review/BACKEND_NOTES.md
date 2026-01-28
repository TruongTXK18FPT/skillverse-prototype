# Backend Notes - UI Review

Danh sách các issues từ UI Review cần xử lý ở Backend.

---

## 📋 Danh sách Issues

### Từ trang Login/Register (02-login.md)

| # | Vấn đề | Mô tả | Đề xuất |
|---|--------|-------|---------|
| 2b.3 | **Thiếu terms acceptance checkbox** | Form đăng ký cần có checkbox đồng ý điều khoản | Cần API lưu trữ trạng thái đồng ý terms, có thể là field `termsAccepted` trong User entity |

### Từ trang Premium (08-premium.md)

| # | Vấn đề | Mô tả | Đề xuất |
|---|--------|-------|---------|
| 7.3 | **Features viết tắt** | "(Limited)", "(Unlimited)" không rõ ràng | Update feature text trong Premium Plan data: "5 lượt/tháng" thay vì "(Limited)" |
| 7.8 | **"(4 meetings)"** không rõ timeframe | Mentor booking feature text | Update thành "4 buổi/tháng" |

### Từ trang Gamification (11-gamification.md) - Round 2

| # | Vấn đề | Mô tả | Đề xuất |
|---|--------|-------|---------|
| G.1 | **100% Mock Data** | Trang Gamification hoàn toàn dùng hardcoded mock data | Cần API endpoints: `/api/gamification/leaderboard`, `/api/gamification/badges`, `/api/gamification/achievements`, `/api/gamification/mini-games` |
| G.2 | **Leaderboard Filters** | Filters (week/month/all, coins/learning) không hoạt động | Cần API hỗ trợ query params cho period và type |

### Từ trang Seminar (07-seminar.md) - Round 2

| # | Vấn đề | Mô tả | Đề xuất |
|---|--------|-------|---------|
| S.1 | **Category Filter không hoạt động** | Filter category chỉ hoạt động với 'all' | Cần API hỗ trợ field `tags` hoặc `category` cho seminar |

### Từ trang User Guide - Round 2

| # | Vấn đề | Mô tả | Đề xuất |
|---|--------|-------|---------|
| UG.1 | **Broken Routes** | Nhiều links có thể không tồn tại | Verify routes: `/roadmap`, `/study-planner`, `/chatbot/expert`, `/mentor-profile`, `/candidates` |

### Từ các trang Public (Guest) - 2026-01-28

| # | Vấn đề | Mô tả | Đề xuất |
|---|--------|-------|---------|
| AUTH.1 | **Guest bị 401 spam từ Premium/Skins endpoints** | Guest session (clear storage) vẫn gọi `GET /api/premium/status` và `GET /api/skins/my-skins` → trả `401 {"code":1401,"message":"Unauthenticated"}` lặp lại, gây noise và có thể trigger auth handling không mong muốn | Cân nhắc cho phép guest call trả `200` với default (premium=false, skins=[]), hoặc tách public endpoint riêng (vd: `/api/premium/status/public`) |

---

## 🔄 Cập nhật

| Ngày | Người cập nhật | Nội dung |
|------|----------------|----------|
| 2026-01-27 | AI Assistant | Khởi tạo file, thêm issue từ trang 02-login |
| 2026-01-27 | AI Assistant | Thêm issues từ trang 08-premium |
| 2026-01-27 | AI Assistant | **Round 2**: Thêm issues Gamification, Seminar, User Guide |
| 2026-01-28 | AI Assistant | Thêm AUTH.1 (guest 401 spam premium/skins) |

