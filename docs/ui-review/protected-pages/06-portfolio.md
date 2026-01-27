# Trang Portfolio (Protected)

**URL:** https://skillverse.vn/portfolio  
**File:** `src/pages/navbar/PortfolioPage.tsx` (957 lines)

---

## ✅ Điểm tốt

1. **5 Tabs đầy đủ**: About, Experience, Projects, Certifications, CV
2. **Theme "Phi Hành Gia"** với background cosmic
3. **CRUD operations** cho Experience, Projects, Skills, Languages
4. **Generate CV** tự động tạo PDF
5. **Achievement badges** visual
6. **Skill progress bars** với level tags

---

## 📊 Dữ liệu thực từ API (User ID: 6)

| Field | Value |
|-------|-------|
| Professional Title | "Full Stack Developer" |
| Location | "TP HCM" |
| Bio | 3 sentences |
| topSkills | "[]" (⚠️ String thay vì Array) |
| languagesSpoken | "[]" (⚠️ String thay vì Array) |
| Social Links | 2 links |

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Mức độ | Vị trí UI | File Code | Đề xuất |
|---|--------|--------|-----------|-----------|---------|
| 30.1 | **topSkills/languagesSpoken trả về string "[]"** | 🔴 Critical | API Response | Backend | Fix JSON serialization |
| 30.2 | **Native confirm() dialog** | 🟡 Medium | Delete actions | `PortfolioPage.tsx:236,290` | Dùng custom modal |
| 30.3 | **Hardcoded achievements** | 🟡 Medium | Achievement badges | `PortfolioPage.tsx:324-392` | Fetch từ API |
| 30.4 | **No loading state** cho tabs | 🟡 Medium | Tab switching | Component | Thêm skeleton |
| 30.5 | **Skills có levelTag hardcoded** | 🟡 Medium | Skills list | `PortfolioPage.tsx:477-490` | Tính từ experience |
| 30.6 | **CV generation lâu** | 🟢 Minor | Generate CV button | `PortfolioPage.tsx:612` | Thêm loading |
| 30.7 | **SkillProgress barColor** logic | 🟢 Minor | Progress bars | `PortfolioPage.tsx:517-524` | Verify thresholds |

---

## 💡 Code Fix

### Fix 30.1: Parse JSON String

```tsx
// src/pages/navbar/PortfolioPage.tsx
// Khi fetch portfolio data:
const topSkillsParsed = typeof data.topSkills === 'string' 
  ? JSON.parse(data.topSkills || '[]') 
  : data.topSkills || [];

const languagesParsed = typeof data.languagesSpoken === 'string'
  ? JSON.parse(data.languagesSpoken || '[]')
  : data.languagesSpoken || [];
```

### Fix 30.2: Replace Native confirm()

```tsx
// Thay thế:
// if (!confirm("Bạn có chắc chắn muốn xóa?")) return;

// Bằng:
const [deleteConfirm, setDeleteConfirm] = useState<{id: number, type: string} | null>(null);

// Trong JSX:
{deleteConfirm && (
  <ConfirmModal
    title="Xác nhận xóa"
    message="Bạn có chắc chắn muốn xóa mục này?"
    onConfirm={() => handleConfirmDelete(deleteConfirm)}
    onCancel={() => setDeleteConfirm(null)}
  />
)}
```

---

## Portfolio Tabs Structure

| Tab | Content | API Endpoints |
|-----|---------|---------------|
| About | Bio, Achievement badges | GET /portfolio |
| Experience | Work history (CRUD) | GET/POST/PUT/DELETE /portfolio/experiences |
| Projects | Project showcase (CRUD) | GET/POST/PUT/DELETE /portfolio/projects |
| Certifications | Uploaded certs | GET/POST/DELETE /portfolio/certifications |
| CV | Generate/Download PDF | POST /portfolio/generate-cv |

---

## 📝 Ghi chú

1. Component PortfolioPage.tsx có 957 dòng - có thể tách nhỏ theo tab
2. Achievements hardcoded 8 badges: "SPACE CADET", "DATA EXPLORER", etc.
3. SkillProgress component dùng Framer Motion animation
