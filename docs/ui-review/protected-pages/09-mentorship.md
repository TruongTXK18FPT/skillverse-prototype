# Trang Mentorship (Protected)

**URL:** https://skillverse.vn/mentorship  
**File:** `src/pages/navbar/MentorshipPage.tsx` (391 lines)

---

## ✅ Điểm tốt

1. **"LIÊN MINH MENTOR"** - Space theme header
2. **Search + Filter** mentors
3. **Mentor cards** với avatar, rating, skills
4. **Pagination** cho mentor list
5. **Star ratings** visual
6. **Skills tags** với colors

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Mức độ | Vị trí UI | File Code | Đề xuất |
|---|--------|--------|-----------|-----------|---------|
| 33.1 | **mockMentors fallback** 🔴 | Mentor list | `MentorshipPage.tsx:94-118` | Hiện error nếu API fail |
| 33.2 | **Fallback hourlyRate calculation** | Price display | `MentorshipPage.tsx:248-249` | `(totalEarnings / totalBookings) || 0` |
| 33.3 | **No online status** | Mentor cards | Component | Thêm availability indicator |
| 33.4 | **Booking flow unclear** | Book button | `MentorshipPage.tsx:330` | Verify navigation target |
| 33.5 | **Filter by availability** missing | Filter dropdown | `MentorshipPage.tsx` | Thêm time slot filter |
| 33.6 | **Rating system** | Star display | `MentorshipPage.tsx:265` | Verify decimal handling |

---

## 💡 Code Fix

### Fix 33.1: Remove Mock Data Fallback

```tsx
// src/pages/navbar/MentorshipPage.tsx
// Thay vì dùng mockMentors khi API fail:

const [error, setError] = useState<string | null>(null);

const fetchMentors = async () => {
  try {
    const data = await mentorService.getMentors();
    setMentors(data);
    setError(null);
  } catch (err) {
    setError('Không thể tải danh sách mentor. Vui lòng thử lại.');
    // KHÔNG dùng: setMentors(mockMentors);
  }
};

// Trong render:
{error && (
  <ErrorState 
    message={error} 
    onRetry={fetchMentors} 
  />
)}
```

### Fix 33.2: Safe hourlyRate Calculation

```tsx
// Thay:
// hourlyRate: mentor.hourlyRate || (mentor.totalEarnings / mentor.totalBookings)

// Thành:
hourlyRate: mentor.hourlyRate || 
  (mentor.totalBookings > 0 
    ? Math.round(mentor.totalEarnings / mentor.totalBookings) 
    : 150000) // Default rate
```

---

## Mentor Card Fields

| Field | Source | Notes |
|-------|--------|-------|
| Avatar | `mentor.avatarUrl` | Fallback to initials |
| Name | `mentor.fullName` | Required |
| Title | `mentor.professionalTitle` | Optional |
| Rating | `mentor.averageRating` | 0-5 stars |
| Total Reviews | `mentor.totalReviews` | Count |
| Hourly Rate | `mentor.hourlyRate` | VND |
| Skills | `mentor.expertise` | Array of strings |

---

## 📝 Ghi chú

1. mockMentors có 6 mentors hardcoded
2. Pagination hiện 6 mentors/page
3. Booking button navigate to `/mentor/{id}`
