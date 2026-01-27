# Trang Profile (Protected)

**URL:** https://skillverse.vn/profile  
**File:** `src/pages/profile/ProfilePageCosmic.tsx`

---

## ✅ Điểm tốt

1. **"PILOT" theme** - Gọi user là "Pilot"
2. **Multiple sections**: Header, Identity Form, Companion Pod, Skin Selector
3. **Avatar upload** có sẵn
4. **Premium badge** hiển thị subscription
5. **Parent Requests** section cho kết nối phụ huynh

---

## 📊 Dữ liệu thực từ API (User ID: 6)

| Field | Value |
|-------|-------|
| Full Name | Tran Pham Bach Cat (K18 HCM) |
| Email | cattpbse184684@fpt.edu.vn |
| Phone | 0347419730 |
| Bio | "SkillVerse..." |
| Avatar | Google photo |

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 22.1 | **Inline styles** cho messages | Success/Error | `ProfilePageCosmic.tsx:127-128` | Dùng CSS classes |
| 22.2 | **"Đang tải hồ sơ..."** no animation | Loading state | `ProfilePageCosmic.tsx:119` | Thêm MeowlKuruLoader |
| 22.3 | **Error message** quá đơn giản | Error state | `ProfilePageCosmic.tsx:120` | Thêm retry button |
| 22.4 | **Skin selector** cho tất cả users | Companion Pod | Component | Verify premium lock |
| 22.5 | **StudentReviews** component | Below profile | `ProfilePageCosmic.tsx:142` | Verify student role |

---

## 💡 Code Fix

### Fix 22.2: Better Loading State

```tsx
// src/pages/profile/ProfilePageCosmic.tsx:119
if (loading) return (
  <div className="pilot-container" style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '60vh' 
  }}>
    <MeowlKuruLoader size="medium" text="Đang tải hồ sơ..." />
  </div>
);
```

---

## Profile Components

| Component | File | Notes |
|-----------|------|-------|
| PilotHeader | `profile-hud/user/PilotHeader.tsx` | Avatar + Premium badge |
| PilotIdentityForm | `profile-hud/user/PilotIdentityForm.tsx` | Edit form |
| CompanionPod | `profile-hud/user/CompanionPod.tsx` | Meowl pet toggle |
| PilotSkinSelector | `profile-hud/user/PilotSkinSelector.tsx` | Skin selection |
| ParentRequests | `profile-hud/user/ParentRequests.tsx` | Parent connection |
