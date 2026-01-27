# Extra Enhancement Round 2 - UI Review Fixes

**Date:** January 27, 2026  
**Reviewer:** GitHub Copilot (Claude Opus 4.5)  
**Scope:** Deep review of all public pages - button flows, modals, components, interactions

---

## 📋 Tổng Quan

Đợt review thứ 2 tập trung vào:
- Kiểm tra luồng nút bấm (button flows)
- Modal và dialog interactions
- Component behaviors
- English/Vietnamese consistency
- Debug code cleanup
- Accessibility issues

---

## ✅ CÁC FIX ĐÃ THỰC HIỆN

### 1. Explore Map - Typo Fix
**File:** `src/components/explore/ExploreMap.tsx`
**Issue:** Typo "DI CHUỖT" thay vì "DI CHUỘT"
**Fix:** Sửa thành "DI CHUỘT ĐỂ KHÁM PHÁ"
**Priority:** Medium

### 2. Seminar - Recruiter Fallback
**Files:** 
- `src/pages/navbar/SeminarPage.tsx`
- `src/pages/navbar/SeminarDetailPage.tsx`

**Issue:** English text "Recruiter" hiện khi không có creatorName
**Fix:** Đổi thành "Chưa cập nhật" (Vietnamese)
**Priority:** Medium

### 3. Seminar - Random Sector Number
**Files:**
- `src/components/seminar-hud/BriefingRow.tsx`
- `src/components/seminar-hud/BriefingCard.tsx`

**Issue:** Sector number random mỗi lần render gây UI không ổn định
**Fix:** Dùng `(seminar.id % 9) + 1` để có số sector stable
**Priority:** Medium

### 4. Premium - English Tags
**File:** `src/components/premium-hud/RankCard.tsx`
**Issue:** Tags "STUDENT" và "POPULAR" bằng tiếng Anh
**Fix:** Đổi thành "SINH VIÊN" và "PHỔ BIẾN"
**Priority:** Low

### 5. Seminar - Category Filter Comment
**File:** `src/pages/navbar/SeminarPage.tsx`
**Issue:** Comment code không rõ ràng về lý do filter chỉ hoạt động với 'all'
**Fix:** Cập nhật comment rõ ràng hơn về TODO backend
**Priority:** Low

---

## 📝 ISSUES MỚI PHÁT HIỆN (Chưa Fix)

### 🔴 CRITICAL

#### C1. Gamification - 100% Mock Data
**File:** `src/pages/navbar/Gamification.tsx`
**Issue:** Toàn bộ dữ liệu (leaderboard, badges, mini games, achievements) đều hardcoded mock data. Không có API integration.
**Impact:** Trang không có dữ liệu thực
**Status:** Cần Backend Integration

#### C2. User Guide - Broken Links
**File:** `src/pages/user-guide/UserGuidePage.tsx`
**Issue:** Nhiều links có thể không tồn tại: `/roadmap`, `/study-planner`, `/chatbot/expert`, `/mentor-profile`, `/candidates`
**Impact:** Users click vào sẽ gặp 404
**Status:** Cần verify routes

---

### 🟠 MEDIUM

#### M1. Help Center - Native confirm()
**File:** `src/pages/footer/HelpCenter.tsx` (line 160)
**Issue:** Dùng native `confirm()` thay vì custom modal
**Fix Required:** Tạo confirmation modal component
**Status:** Cần development

#### M2. Premium - Native alert()
**File:** `src/pages/payment/PremiumPageCosmic.tsx` (line 127)
**Issue:** Dùng native `alert()` khi student đã có premium
**Fix Required:** Dùng toast notification hoặc modal
**Status:** Cần development

#### M3. Seminar - Category Filter Không Hoạt Động
**File:** `src/pages/navbar/SeminarPage.tsx` (line 196)
**Issue:** Category filter chỉ return true khi `filterCategory === 'all'`
**Root Cause:** Backend chưa hỗ trợ tags/categories cho seminar
**Status:** Chờ Backend API

#### M4. Help Center - 24/7 Claim Inconsistent
**File:** `src/pages/footer/HelpCenter.tsx`
**Issue:** Tagline nói "HỖ TRỢ 24/7" nhưng FAQ nói hỗ trợ "8h-22h"
**Fix Required:** Clarify AI 24/7 vs human 8h-22h
**Status:** Cần content decision

#### M5. Gamification - "Xem quy tắc" Button
**File:** `src/pages/navbar/Gamification.tsx`
**Issue:** Button không có onClick handler
**Status:** Cần development

#### M6. Accessibility - Missing aria-labels
**Files:** Multiple (ChooseRolePage, UserGuidePage, HelpCenter)
**Issue:** Interactive elements thiếu aria-label cho screen readers
**Status:** Cần accessibility review

---

### 🟡 LOW

#### L1. Homepage - English HUD Text (Intentional?)
**File:** `src/pages/main/HomePage.tsx`
**Issue:** "SYS ONLINE", "Data Upgrade Modules", etc. in English
**Note:** Có thể là intentional cho sci-fi theme

#### L2. Courses - "SYS ONLINE" English
**File:** `src/pages/navbar/CoursesPage.tsx` (line 207)
**Issue:** System indicator text in English
**Note:** Có thể là intentional

#### L3. Multiple Pages - Console.log/error
**Files:** HelpCenter, SeminarPage, CommunityDashboard
**Issue:** Console statements in production code
**Fix:** Remove hoặc wrap in NODE_ENV check

#### L4. Terms/Privacy - Hardcoded Dates
**Files:** TermOfService.tsx, Privacy&Policy.tsx
**Issue:** Update dates hardcoded (18/06/2025, 27/11/2025)
**Fix:** Consider using configurable constant

#### L5. Placeholder Images - External
**Files:** BriefingRow.tsx, BriefingCard.tsx
**Issue:** Using via.placeholder.com for fallbacks
**Fix:** Use local placeholder images

#### L6. Seminar - "ĐANG DIỄN RA" for Ended
**File:** `src/components/seminar-hud/BriefingRow.tsx`
**Issue:** Countdown shows "ĐANG DIỄN RA" for ended seminars too
**Fix:** Add check for CLOSED status

#### L7. User Guide - "INITIALIZE PROJECT" Button
**File:** `src/pages/user-guide/UserGuidePage.tsx`
**Issue:** English technical jargon
**Fix:** Change to "Bắt Đầu Ngay"

---

## 📊 THỐNG KÊ

| Category | Count |
|----------|-------|
| **Fixed trong đợt này** | 5 |
| **Critical (cần backend)** | 2 |
| **Medium (cần development)** | 6 |
| **Low (minor)** | 7 |
| **Total Issues Mới** | 15 |

---

## 🔧 BACKEND NOTES (Thêm vào BACKEND_NOTES.md)

1. **Gamification API**: Cần API endpoints cho leaderboard, badges, achievements, mini games
2. **Seminar Categories**: Cần API hỗ trợ tags/categories cho seminar
3. **User Guide Routes**: Verify tất cả routes exist trong router config

---

## 📁 FILES MODIFIED

1. `src/components/explore/ExploreMap.tsx` - Typo fix
2. `src/pages/navbar/SeminarPage.tsx` - Recruiter fallback, comment update
3. `src/pages/navbar/SeminarDetailPage.tsx` - Recruiter fallback
4. `src/components/seminar-hud/BriefingRow.tsx` - Stable sector number
5. `src/components/seminar-hud/BriefingCard.tsx` - Stable sector number
6. `src/components/premium-hud/RankCard.tsx` - Vietnamese tags
