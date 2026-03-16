# Phân Tích Luồng Đặt Lịch Mentor (Mentor Booking Flow)

Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về luồng kỹ thuật của tính năng đặt lịch mentor trong hệ thống SkillVerse, bao gồm Frontend, Backend API integration, và Business Logic.

## 1. Kiến Trúc Tổng Quan (Architecture Overview)

Hệ thống sử dụng kiến trúc Client-Server với React Frontend và Backend API (giả định là Spring Boot hoặc Node.js dựa trên cấu trúc API endpoint).

### Các Thành Phần Chính (Key Components)

| Layer | Component | Mô tả | File Path |
|-------|-----------|-------|-----------|
| **UI (Student)** | `MentorshipPage` | Trang tìm kiếm và hiển thị danh sách mentor. | `src/pages/navbar/MentorshipPage.tsx` |
| **UI (Student)** | `BookingModal` | Modal xử lý chọn giờ và thanh toán. | `src/components/mentorship-hud/BookingModal.tsx` |
| **UI (Mentor)** | `MentoringHistoryTab` | Dashboard quản lý lịch sử booking của mentor. | `src/components/mentor/MentoringHistoryTab.tsx` |
| **Service** | `bookingService` | Xử lý logic gọi API liên quan đến booking. | `src/services/bookingService.ts` |
| **Service** | `availabilityService` | Quản lý thời gian rảnh của mentor. | `src/services/availabilityService.ts` |
| **Service** | `walletService` | Xử lý thanh toán qua ví nội bộ. | `src/services/walletService.ts` |
| **Service** | `mentorProfileService` | Lấy thông tin mentor. | `src/services/mentorProfileService.ts` |

---

## 2. Luồng Dữ Liệu Chi Tiết (Detailed Data Flow)

### Bước 1: Tìm Kiếm và Chọn Mentor (Search & Selection)

Người dùng (Student) truy cập trang Mentorship để tìm kiếm mentor phù hợp.

*   **UI Component:** `MentorshipPage.tsx`, `UplinkGrid.tsx`, `MasterProfileCard.tsx`
*   **API Endpoint:** `GET /api/mentors` (thông qua `getAllMentors()`)
*   **Logic:**
    1.  `MentorshipPage` gọi `mentorProfileService.getAllMentors()` khi mount.
    2.  Đồng thời gọi `getMyFavoriteMentors()` để đánh dấu mentor yêu thích.
    3.  **Frontend Processing:**
        *   Dữ liệu trả về được map sang object `Mentor` (xử lý fallback avatar, rating, hourlyRate).
        *   Tính toán danh mục (Categories) động dựa trên kỹ năng (skills) của mentor.
        *   Nếu mentor chưa có rating, hệ thống gọi thêm `getPublicBookingReviewsByMentor` để enrich dữ liệu (Client-side enrichment).
    4.  **Filter:** User lọc theo category hoặc search text (client-side filter).

### Bước 2: Kiểm Tra Availability (Check Availability)

Khi User nhấn "Đặt lịch" trên card mentor, `BookingModal` được mở ra.

*   **UI Component:** `BookingModal.tsx`
*   **API Endpoint:** `GET /mentor-availability/{mentorId}?from={date}&to={date}`
*   **Service Method:** `availabilityService.getAvailability(mentorId, from, to)`
*   **Logic:**
    1.  Modal mở, gọi API lấy lịch rảnh trong 30 ngày tới.
    2.  **Data Processing:**
        *   Backend trả về các slot availability (start, end).
        *   Frontend (`BookingModal`) chia nhỏ các slot này thành các khung giờ 1 tiếng (1-hour chunks).
        *   Loại bỏ các slot trong quá khứ.
    3.  User chọn một slot (ngày, giờ).

### Bước 3: Tạo Booking Request & Payment (Booking & Payment)

User xác nhận slot và tiến hành thanh toán.

*   **UI Component:** `BookingModal.tsx`
*   **API Endpoint:** `POST /api/mentor-bookings/wallet`
*   **Service Method:** `bookingService.createBookingWithWallet(request)`
*   **Payment Flow (Internal Wallet):**
    1.  **Check Balance:** Gọi `walletService.getMyWallet()` để lấy số dư hiện tại (`cashBalance`).
    2.  **Validation:**
        *   Nếu `walletBalance < hourlyRate`: Hiển thị lỗi, yêu cầu nạp tiền.
        *   Nếu đủ tiền: Cho phép tiếp tục.
    3.  **Create Booking:** Gửi request `createBookingWithWallet` với payload:
        ```json
        {
          "mentorId": 123,
          "startTime": "2025-07-03T14:00:00Z",
          "durationMinutes": 60,
          "priceVnd": 500000,
          "paymentMethod": "WALLET"
        }
        ```
    4.  **Success Handling:**
        *   Backend trừ tiền trong ví Student.
        *   Backend tạo bản ghi Booking với trạng thái `PENDING` hoặc `CONFIRMED`.
        *   Backend trả về `meetingLink` (nếu auto-confirm) hoặc thông báo chờ duyệt.
        *   Frontend hiển thị Toast success và link phòng họp (nếu có).

### Bước 4: Xử Lý Phía Mentor (Mentor Action)

Mentor nhận được yêu cầu và xử lý.

*   **UI Component:** `MentoringHistoryTab.tsx` (Xem danh sách), `MyScheduleTab.tsx` (UI Mockup - chưa hoàn thiện logic connect API).
*   **API Endpoints:**
    *   `GET /api/mentor-bookings/me?mentorView=true`: Lấy danh sách booking.
    *   `PUT /api/mentor-bookings/{id}/approve`: Chấp nhận.
    *   `PUT /api/mentor-bookings/{id}/reject`: Từ chối.
*   **Logic:**
    1.  Mentor xem danh sách booking trong `MentoringHistoryTab`.
    2.  Trạng thái booking hiển thị: `PENDING`, `CONFIRMED`, `REJECTED`, `COMPLETED`.
    3.  **Action (Logic Backend/Service có hỗ trợ):**
        *   **Approve:** Chuyển trạng thái sang `CONFIRMED`, tạo meeting link (nếu chưa có).
        *   **Reject:** Chuyển trạng thái sang `REJECTED`, hoàn tiền cho Student (Backend logic).

### Bước 5: Kết Thúc & Review (Completion & Rating)

Sau khi buổi học kết thúc.

*   **API Endpoints:**
    *   `PUT /api/mentor-bookings/{id}/complete`: Đánh dấu hoàn thành.
    *   `POST /api/mentor-bookings/{id}/rating`: Đánh giá mentor.
*   **Logic:**
    1.  Booking được đánh dấu `COMPLETED` (có thể do Mentor click hoặc auto-job).
    2.  Student có thể gửi đánh giá (stars, comment) thông qua `rateBooking`.
    3.  Tiền được chuyển vào ví Mentor (sau khi trừ phí nền tảng - logic backend 80/20).

### Bước 6: Hệ Thống Thông Báo (Notification System)

Hệ thống thông báo cho User về trạng thái Booking.

*   **Component:** `NotificationDropdown.tsx`
*   **Mechanism:** **Polling** (Mỗi 60 giây gọi API kiểm tra tin mới).
*   **API Endpoints:**
    *   `GET /api/notifications/unread-count`: Lấy số lượng tin chưa đọc.
    *   `GET /api/notifications`: Lấy danh sách tin.
*   **Notification Types:**
    *   `BOOKING_CONFIRMED`: Khi Mentor chấp nhận.
    *   `BOOKING_CANCELLED`: Khi bị hủy/từ chối.
    *   `BOOKING_REMINDER`: Nhắc nhở trước giờ học.
*   **Navigation:** Click vào thông báo sẽ điều hướng User đến trang `/my-bookings` (Student) hoặc Dashboard (Mentor).

---

## 3. Data Models & Database Operations (Inferred)

Dựa trên Interface TypeScript, cấu trúc Database (Entity) dự kiến như sau:

### Booking Entity
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary Key |
| `mentorId` | Long | FK to User (Mentor) |
| `learnerId` | Long | FK to User (Student) |
| `startTime` | Timestamp | Thời gian bắt đầu |
| `endTime` | Timestamp | Thời gian kết thúc |
| `status` | Enum | `PENDING`, `CONFIRMED`, `REJECTED`, `COMPLETED`, `CANCELLED` |
| `priceVnd` | Decimal | Giá tiền giao dịch |
| `paymentMethod` | Enum | `WALLET`, `PAYOS` |
| `meetingLink` | String | Link Google Meet/Zoom |

### Availability Entity
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary Key |
| `mentorId` | Long | FK to User |
| `startTime` | Timestamp | Bắt đầu slot rảnh |
| `endTime` | Timestamp | Kết thúc slot rảnh |
| `isRecurring` | Boolean | Lặp lại hay không |

---

## 4. State Management & Security

### State Management
*   **Local State (React `useState`):** Quản lý UI state (modal open/close, loading flags, form inputs).
*   **Context API:** `AuthContext` dùng để lấy thông tin User hiện tại (`isAuthenticated`, user details).
*   **Custom Hooks:** `usePaymentToast` để hiển thị thông báo thanh toán.

### Security Measures
1.  **Authentication:**
    *   Tất cả API gọi qua `axiosInstance` đều đính kèm JWT Token (`Authorization: Bearer ...`).
    *   `BookingModal` kiểm tra `walletBalance` trước khi gọi API, nhưng Backend **BẮT BUỘC** phải validate lại số dư server-side để tránh hack.
2.  **Authorization:**
    *   API `/api/mentor-bookings/me` có tham số `mentorView=true` để phân quyền xem (Backend cần check Role Mentor).
3.  **Validation:**
    *   Frontend validate: Slot phải ở tương lai, Wallet phải đủ tiền.
    *   Backend validate (Inferred): Slot chưa được book, User sở hữu ví.

## 5. Các Vấn Đề Cần Lưu Ý (Notes/TODOs)

1.  **UI Mentor Schedule:** Hiện tại `MyScheduleTab.tsx` đang dùng mock data. Cần kết nối với `bookingService.getMyBookings` và `availabilityService`.
2.  **Approval UI:** Chưa thấy nút "Approve/Reject" rõ ràng trên giao diện `MentoringHistoryTab`. Cần bổ sung action button gọi `approveBooking/rejectBooking`.
3.  **Real-time Update:** Chưa thấy cơ chế WebSocket/Polling để cập nhật trạng thái booking realtime (ví dụ: khi Mentor approve, Student nhận thông báo ngay lập tức). Hiện tại dựa vào reload trang hoặc User check lại.
