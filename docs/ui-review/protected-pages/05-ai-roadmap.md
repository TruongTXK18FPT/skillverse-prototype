# Trang AI Roadmap (Protected)

**URL:** https://skillverse.vn/roadmap (sau khi login + /ai-roadmap)  
**Files:** 
- `src/pages/roadmap/RoadmapAIPage.tsx`
- `src/pages/roadmap/RoadmapDetailPage.tsx`
- `src/components/ai-roadmap/RoadmapPreview.tsx`

---

## ✅ Điểm tốt

1. **Step wizard 3 bước**: Create → Learn → Apply
2. **Chat với AI** tạo roadmap
3. **Categories**: Development, Business, Design...
4. **Roadmap tree** visualization
5. **Editable nodes**: Right-click menu

---

## 📊 Dữ liệu thực từ API (User ID: 6)

| Field | Value |
|-------|-------|
| Total roadmaps | 2 |
| Roadmap 1 | "Lộ Trình Fullstack Developer Sử Dụng React và Node.js" |
| Roadmap 2 | "Lộ Trình L\u00e0m Game..." (UTF-8 issue) |
| Progress | 40%, 0% |

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 24.1 | **UTF-8 encoding** trong API response 🔴 | Roadmap titles | API Backend | Fix encoding |
| 24.2 | **Hardcoded categories** 🔴 | Step 1 | `RoadmapAIPage.tsx` | Fetch từ API |
| 24.3 | **Chat streaming** có thể fail | AI Chat | `RoadmapAIPage.tsx` | Retry mechanism |
| 24.4 | **Tree node edit** không save | Edit modal | `RoadmapPreview.tsx` | Verify save API |
| 24.5 | **No progress bar** on list | My Roadmaps | `RoadmapDetailPage.tsx` | Thêm visual progress |
| 24.6 | **Clone roadmap** không hoạt động | Clone button | `RoadmapDetailPage.tsx` | Fix API call |

---

## 💡 Code Fix

### Fix 24.2: Fetch Categories

```tsx
// src/pages/roadmap/RoadmapAIPage.tsx
const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const result = await roadmapService.getCategories();
      setCategories(result);
    } catch {
      // Fallback to hardcoded if API fails
      setCategories(DEFAULT_CATEGORIES);
    }
  };
  fetchCategories();
}, []);
```

---

## Components

| Component | File | Notes |
|-----------|------|-------|
| RoadmapChat | `ai-roadmap/RoadmapChat.tsx` | Streaming chat |
| RoadmapPreview | `ai-roadmap/RoadmapPreview.tsx` | Tree visualization |
| RoadmapNode | `ai-roadmap/RoadmapNode.tsx` | Individual nodes |
| NodeEditModal | `ai-roadmap/NodeEditModal.tsx` | Edit dialog |
