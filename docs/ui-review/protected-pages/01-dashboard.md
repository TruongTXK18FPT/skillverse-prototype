# Trang Dashboard (Protected)

**URL:** https://skillverse.vn/dashboard  
**Files:** 
- `src/pages/navbar/DashboardPage.tsx`
- `src/components/dashboard-hud/MothershipDashboard.tsx`

---

## ✅ Điểm tốt

1. **"MOTHERSHIP DASHBOARD"** - Theme space nhất quán
2. **System Status**: Hiển thị streak, weekly goal
3. **Stats Grid**: 4 thẻ thống kê (Modules, Missions, Badges, Energy)
4. **Active Simulations**: Hiển thị courses đang học
5. **Analyst Track**: Roadmaps progress
6. **Favorite Mentors**: Danh sách mentor yêu thích

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 20.1 | **Hardcoded achievements** 🔴 | MissionLog | `MothershipDashboard.tsx:114-132` | Fetch từ API |
| 20.2 | **Dates 2024** trong achievements 🔴 | Proximity Alerts | `MothershipDashboard.tsx:134-156` | Fetch từ API |
| 20.3 | **"Tiếp tục học"** không rõ target | Active Simulations | `MothershipDashboard.tsx:241` | Verify navigation |
| 20.4 | **Empty state** Favorite Mentors | Sidebar | `MothershipDashboard.tsx:245-247` | Thêm suggestion |
| 20.5 | **"+3 this cycle"** hardcoded | Stats cards | `MothershipDashboard.tsx:61-94` | Tính từ actual data |

---

## 💡 Code Fix

### Fix 20.1: Remove Hardcoded Achievements

```tsx
// src/components/dashboard-hud/MothershipDashboard.tsx
// Thay đổi từ hardcoded achievements array thành props:

interface MothershipDashboardProps {
  // ... existing props
  achievements?: Achievement[];
  upcomingDeadlines?: Deadline[];
}

// Trong render:
{achievements && achievements.length > 0 && (
  <MissionLog achievements={achievements} deadlines={upcomingDeadlines} ... />
)}
```

---

## Components

| Component | File | Notes |
|-----------|------|-------|
| CommanderWelcome | `dashboard-hud/CommanderWelcome.tsx` | Verify button targets |
| SystemStatus | `dashboard-hud/SystemStatus.tsx` | weeklyGoal hardcoded = 5 |
| StatUnit | `dashboard-hud/StatUnit.tsx` | OK |
| ActiveModules | `dashboard-hud/ActiveModules.tsx` | OK |
| MissionLog | `dashboard-hud/MissionLog.tsx` | Uses hardcoded data |
| FavoriteMentors | `dashboard-hud/FavoriteMentors.tsx` | OK |
| AnalystTrack | `dashboard-hud/AnalystTrack.tsx` | OK |
| SystemLimits | `dashboard-hud/SystemLimits.tsx` | Verify limits display |
