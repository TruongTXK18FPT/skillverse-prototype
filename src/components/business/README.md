# Bảng Điều Khiển Doanh Nghiệp - Nền Tảng SkillVerse

## Tổng Quan
Bảng Điều Khiển Doanh Nghiệp cung cấp giao diện toàn diện cho các doanh nghiệp quản lý MinJob và kết nối với freelancer trên nền tảng SkillVerse.

## Tính Năng

### 📝 Tab Đăng MinJob
- **Biểu Mẫu Tạo Công Việc**: Biểu mẫu sạch sẽ, được xác thực để tạo MinJob mới
- **Lựa Chọn Kỹ Năng Đa Dạng**: Dropdown tự động hoàn thành để chọn kỹ năng cần thiết
- **Xác Thực Biểu Mẫu**: Xác thực thời gian thực với thông báo trợ giúp hữu ích
- **Thiết Kế Responsive**: Hoạt động mượt mà trên tất cả thiết bị

#### Các Trường Biểu Mẫu:
- Tiêu Đề Công Việc (bắt buộc)
- Mô Tả Công Việc (bắt buộc, nhiều dòng)
- Kỹ Năng Yêu Cầu (bắt buộc, đa lựa chọn với tự động hoàn thành)
- Ngân Sách bằng VND (bắt buộc, xác thực số)
- Thời Hạn (bắt buộc, xác thực ngày tương lai)

### 📋 Tab Danh Sách MinJob
- **Bảng Quản Lý Công Việc**: Chế độ xem bảng sạch sẽ của tất cả công việc đã đăng
- **Lọc Trạng Thái**: Lọc công việc theo trạng thái (Mở, Đang Tiến Hành, Hoàn Thành, Đóng)
- **Hành Động Công Việc**: Xem chi tiết, chỉnh sửa hoặc đóng công việc
- **Chế Độ Xem Modal**: Thông tin công việc chi tiết trong cửa sổ popup
- **Huy Hiệu Trạng Thái**: Chỉ báo trạng thái có mã màu

#### Trạng Thái Công Việc:
- **Mở**: Đang chấp nhận đơn ứng tuyển
- **Đang Tiến Hành**: Công việc đã bắt đầu
- **Hoàn Thành**: Công việc hoàn thành thành công
- **Đóng**: Không còn chấp nhận đơn ứng tuyển

### 🔍 Tab Freelancer Được Đề Xuất
- **Thẻ Freelancer**: Bố cục thẻ đẹp mắt giới thiệu hồ sơ freelancer
- **Tìm Kiếm & Lọc**: Tìm kiếm theo tên/kỹ năng, lọc theo kỹ năng cụ thể
- **Tùy Chọn Sắp Xếp**: Sắp xếp theo đánh giá, giá theo giờ hoặc dự án đã hoàn thành
- **Đánh Giá Sao**: Hiển thị đánh giá trực quan bằng sao
- **Nút Hành Động**: Xem hồ sơ hoặc mời vào công việc

#### Thông Tin Freelancer:
- Tên và avatar/chữ cái đầu
- Đánh giá sao (trên 5)
- Kỹ năng hàng đầu (với chỉ báo tràn)
- Số dự án đã hoàn thành
- Giá theo giờ
- Hành động hồ sơ và lời mời

## Cấu Trúc Component

```
src/components/business/
├── PostMinJobTab.tsx          # Biểu mẫu tạo công việc
├── PostMinJobTab.css          # Styling cho biểu mẫu công việc
├── MinJobListTab.tsx          # Bảng quản lý công việc
├── MinJobListTab.css          # Styling cho danh sách công việc
├── SuggestedFreelancersTab.tsx # Khám phá freelancer
├── SuggestedFreelancersTab.css # Styling cho freelancer
└── index.ts                   # Export component
```

## Sử Dụng

### Import component BusinessPage:
```tsx
import BusinessPage from './pages/main/BusinessPage';
```

### Sử dụng trong routing:
```tsx
<Route path="/business" component={BusinessPage} />
```

## Tùy Chỉnh

### Styling
Mỗi component có file CSS riêng để dễ dàng tùy chỉnh:
- Màu sắc có thể điều chỉnh thông qua thuộc tính CSS custom
- Breakpoint responsive có thể được sửa đổi
- Khoảng cách layout có thể tùy chỉnh

### Tích Hợp Dữ Liệu
Các component được thiết kế để hoạt động với những interface này:
- `MinJob`: Cấu trúc dữ liệu đăng công việc
- `Freelancer`: Cấu trúc dữ liệu hồ sơ freelancer

### Tích Hợp API
Thay thế dữ liệu mẫu và handler bằng API calls thực tế:
- `handleCreateMinJob`: POST để tạo công việc mới
- `handleCloseJob`: PATCH để cập nhật trạng thái công việc  
- `handleViewProfile`: Điều hướng đến hồ sơ freelancer
- `handleInviteToJob`: POST để gửi lời mời công việc

## Thiết Kế Responsive
- **Desktop**: Layout đầy đủ tính năng với khoảng cách tối ưu
- **Tablet**: Điều chỉnh grid layout và khoảng cách
- **Mobile**: Layout xếp chồng và nút thân thiện với cảm ứng

## Tính Năng Khả Năng Tiếp Cận
- Cấu trúc HTML ngữ nghĩa
- Hỗ trợ điều hướng bàn phím
- Thân thiện với screen reader
- Nhãn và vai trò ARIA
- Tỷ lệ màu tương phản cao

## Hỗ Trợ Trình Duyệt
- Trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)
- Thiết kế responsive cho tất cả kích thước màn hình
- Layout CSS Grid và Flexbox
