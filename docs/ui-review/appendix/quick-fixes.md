# Quick Fixes

Các fix nhanh có thể thực hiện ngay không cần thay đổi kiến trúc.

---

## 🔴 Critical Fixes (Ưu tiên cao)

### 1. Thay thế Native Dialogs

**Files affected:**
- `src/pages/navbar/PortfolioPage.tsx`
- `src/pages/user/UserBookingsPage.tsx`
- Various other files

**Pattern:**
```tsx
// ❌ Trước
if (!confirm("Bạn có chắc?")) return;
alert("Có lỗi xảy ra");

// ✅ Sau
// Dùng custom modal hoặc toast
const { showToast } = useToast();
showToast('Có lỗi xảy ra', 'error');
```

---

### 2. Fix UTF-8 Encoding

**Files affected:** Backend API responses

**Issues:**
- Task titles: `"H\u1ecdc v\u1ec1 Git Basics"` 
- Roadmap titles: `"L\u00e0m Game..."`

**Fix:** Ensure proper Content-Type header và JSON encoding

---

### 3. Fix JSON String vs Array

**API Response:**
```json
{
  "topSkills": "[]",
  "languagesSpoken": "[]"
}
```

**Should be:**
```json
{
  "topSkills": [],
  "languagesSpoken": []
}
```

**Frontend workaround:**
```tsx
const parsed = typeof data.topSkills === 'string' 
  ? JSON.parse(data.topSkills || '[]') 
  : data.topSkills || [];
```

---

## 🟡 Medium Priority Fixes

### 4. Dynamic Year Display

**Files affected:**
- `src/pages/navbar/CareerChatPage.tsx:67`
- `src/pages/footer/PrivacyPolicyPage.tsx`
- `src/pages/footer/TermsOfServicePage.tsx`

**Pattern:**
```tsx
// ❌ Trước
"SkillVerse 2024-2025"
"Cập nhật: 25/10/2024"

// ✅ Sau
`SkillVerse ${new Date().getFullYear()}`
```

---

### 5. Add Loading States

**Files affected:** Multiple pages

**Pattern:**
```tsx
// ❌ Trước
if (loading) return <div>Đang tải...</div>;

// ✅ Sau
if (loading) return <MeowlKuruLoader size="medium" />;
```

---

### 6. Fix Footer DOM Manipulation

**File:** `src/pages/study-planner/StudyPlannerPage.tsx:28-38`

**Pattern:**
```tsx
// ❌ Trước
useEffect(() => {
  const footer = document.querySelector(".footer-container");
  if (footer) footer.style.display = "none";
  return () => { footer.style.display = "flex"; };
}, []);

// ✅ Sau
const { setShowFooter } = useLayout();
useEffect(() => {
  setShowFooter(false);
  return () => setShowFooter(true);
}, []);
```

---

### 7. Enable/Disable Feature Flags

**Create:** `src/config/features.ts`

```tsx
export const FEATURE_FLAGS = {
  ENABLE_TTS: import.meta.env.VITE_ENABLE_TTS === 'true',
  ENABLE_VOICE_INPUT: import.meta.env.VITE_ENABLE_VOICE === 'true',
  SHOW_BETA_FEATURES: import.meta.env.VITE_SHOW_BETA === 'true',
};
```

---

## 🟢 Minor Fixes

### 8. Fix Leaderboard Logic

**File:** `src/components/game/MiniGamesHub.tsx:232-234`

```tsx
// ❌ Trước
{myRank === 1 && <span>Bạn đang dẫn đầu!</span>}

// ✅ Sau (luôn hiển thị rank)
<span>
  {myRank === 1 
    ? "🏆 Bạn đang dẫn đầu!" 
    : `Xếp hạng của bạn: #${myRank}`}
</span>
```

---

### 9. Add Retry Buttons

**Pattern:**
```tsx
// ❌ Trước
if (error) return <div>Có lỗi xảy ra</div>;

// ✅ Sau
if (error) return (
  <ErrorState 
    message={error.message}
    onRetry={() => fetchData()}
  />
);
```

---

### 10. Consistent Empty States

**Pattern:**
```tsx
// ❌ Trước
{items.length === 0 && <p>Không có dữ liệu</p>}

// ✅ Sau
{items.length === 0 && (
  <EmptyState
    icon={<Inbox size={48} />}
    title="Chưa có dữ liệu"
    description="Hãy thêm mới để bắt đầu"
    action={<Button onClick={openAddModal}>Thêm mới</Button>}
  />
)}
```

---

## Checklist

- [ ] Replace all `confirm()` calls
- [ ] Replace all `alert()` calls  
- [ ] Fix hardcoded years
- [ ] Add MeowlKuruLoader to loading states
- [ ] Create feature flags config
- [ ] Fix footer DOM manipulation
- [ ] Add retry buttons to error states
- [ ] Improve empty states with CTAs
