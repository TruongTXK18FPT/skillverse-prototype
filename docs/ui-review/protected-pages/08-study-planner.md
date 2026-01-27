# Trang Study Planner (Protected)

**URL:** https://skillverse.vn/study-planner  
**File:** `src/pages/study-planner/StudyPlannerPage.tsx` (246 lines)

---

## ✅ Điểm tốt

1. **2 Views**: Calendar + Task Board
2. **Space theme** icons (Rocket, Calendar, etc.)
3. **Task Board** kiểu Kanban 6 columns
4. **Animated transitions** giữa views
5. **Responsive design** với tabs

---

## 📊 Dữ liệu thực từ API (User ID: 6)

| Field | Value |
|-------|-------|
| Total Columns | 6 |
| Total Tasks | 9 |
| Columns | Backlog, Planned, In Progress, On Hold, Review, Completed |
| In Progress Task | "H\u1ecdc v\u1ec1 Git Basics" (50% progress) |

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Mức độ | Vị trí UI | File Code | Đề xuất |
|---|--------|--------|-----------|-----------|---------|
| 32.1 | **Footer bị ẩn** hardcoded | 🟡 Medium | Layout | `StudyPlannerPage.tsx:28` | Cho user toggle |
| 32.2 | **useEffect set footer** | 🟡 Medium | Mount/Unmount | `StudyPlannerPage.tsx:30-38` | Context-based |
| 32.3 | **UTF-8 encoding** trong API | 🔴 Critical | Task titles | API Backend | Fix encoding |
| 32.4 | **No sync indicator** | 🟢 Minor | Header | Component | Thêm sync status |
| 32.5 | **Calendar view empty** | 🟡 Medium | Calendar tab | `CalendarView` component | Verify data loading |
| 32.6 | **Task priority colors** | 🟢 Minor | Task cards | TaskCard | Thêm visual priority |

---

## 💡 Code Fix

### Fix 32.1 & 32.2: Footer Context

```tsx
// src/context/LayoutContext.tsx (new or existing)
interface LayoutContextValue {
  showFooter: boolean;
  setShowFooter: (show: boolean) => void;
}

// StudyPlannerPage.tsx - Sử dụng context thay vì DOM manipulation
const { setShowFooter } = useLayout();

useEffect(() => {
  setShowFooter(false);
  return () => setShowFooter(true);
}, [setShowFooter]);
```

---

## Task Board Columns

| Column | Color | Tasks (User 6) |
|--------|-------|----------------|
| BACKLOG | Gray | 3 tasks |
| PLANNED | Blue | 2 tasks |
| IN_PROGRESS | Yellow | 1 task (50%) |
| ON_HOLD | Orange | 0 tasks |
| REVIEW | Purple | 2 tasks |
| COMPLETED | Green | 1 task |

---

## Components

| Component | File | Notes |
|-----------|------|-------|
| CalendarView | `study-planner/CalendarView.tsx` | FullCalendar integration |
| SpaceTaskBoard | `study-planner/SpaceTaskBoard.tsx` | Kanban board |
| TaskCard | `study-planner/TaskCard.tsx` | Individual task |
| AddTaskModal | `study-planner/AddTaskModal.tsx` | Create task form |

---

## 📝 Ghi chú

1. Footer hidden bằng DOM selector - Anti-pattern
2. Calendar view có thể cần separate data fetch
3. Drag & drop giữa columns cần verify API call
