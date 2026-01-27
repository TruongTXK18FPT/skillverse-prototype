# Trang Đăng nhập, Đăng ký, Quên mật khẩu

---

## Login Page

**URL:** https://skillverse.vn/login  
**File:** `src/pages/auth/ElevatorLoginPage.tsx`

### ✅ Điểm tốt
1. **Theme nhất quán**: "HYPERION DECK" phù hợp theme space
2. **Form đầy đủ**: Email, Password, Remember me, Forgot password
3. **Có option đăng nhập Google**
4. **Link đăng ký rõ ràng**

### ⚠️ Vấn đề

| # | Vấn đề | Vị trí UI | Đề xuất |
|---|--------|-----------|---------|
| 2.1 | **"SYS:ONLINE v2.4.1..."** text kỹ thuật gây rối | Footer form | Ẩn hoặc simplify |
| 2.2 | **Không có password toggle** | Password field | Thêm icon eye |
| 2.3 | **Không có validation realtime** | Form fields | Hiển thị lỗi khi blur |
| 2.4 | **Logo Google nhỏ và mờ** | Nút Google | Tăng size và contrast |
| 2.5 | **"SKILLVERSE HYPERION"** lặp lại | Footer | Giữ 1 cái |

---

## Register Page

**URL:** https://skillverse.vn/register  
**File:** `src/pages/auth/ElevatorPersonalRegisterPage.tsx`

### ✅ Điểm tốt
1. **Form đầy đủ**: Họ tên, Email, Password, Confirm, SĐT, Khu vực, Bio
2. **Link đăng nhập có sẵn**
3. **Bio là optional** - rõ ràng

### ⚠️ Vấn đề

| # | Vấn đề | Vị trí UI | Đề xuất |
|---|--------|-----------|---------|
| 2b.1 | **Không có password strength indicator** | Password field | Thêm thanh strength |
| 2b.2 | **"KHU VỰC ĐỊA CHỈ"** không rõ ràng | Address field | Đổi thành "Thành phố/Tỉnh" |
| 2b.3 | **Thiếu terms acceptance checkbox** | Form bottom | Thêm checkbox |
| 2b.4 | **Không có step indicator** | Header | Thêm progress steps |

---

## Forgot Password Page

**URL:** https://skillverse.vn/forgot-password  
**File:** `src/pages/auth/ElevatorForgotPasswordPage.tsx`

### ✅ Điểm tốt
1. **Form đơn giản**: Chỉ cần email
2. **Có link quay lại login**
3. **Title rõ ràng**: "KHÔI PHỤC MẬT KHẨU"

### ⚠️ Vấn đề

| # | Vấn đề | Vị trí UI | Đề xuất |
|---|--------|-----------|---------|
| 2c.1 | **Technical footer** giống login | Footer | Ẩn hoặc simplify |
| 2c.2 | **Không có instructions** | Form | Thêm "Chúng tôi sẽ gửi link..." |
| 2c.3 | **"SKILLVERSE HYPERION"** lặp lại | Footer | Nhất quán với trang khác |

---

## 💡 Đề xuất chung cho Auth pages

1. Thêm password visibility toggle
2. Thêm realtime validation
3. Simplify technical footer text
4. Thêm password strength indicator cho register
5. Thêm terms checkbox trước khi register
