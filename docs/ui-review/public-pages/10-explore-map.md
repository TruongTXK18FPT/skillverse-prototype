# Trang Explore Map

**URL:** https://skillverse.vn/explore  
**File:** `src/pages/ExploreMapPage.tsx`

---

## ✅ Điểm tốt

1. **Visual map đẹp mắt**: 4 zones với hình ảnh riêng biệt
2. **Theme space nhất quán**: Học Viện Chiến Binh, Phi Thuyền Mẹ, Khu Chợ Đen, Lỗ Sâu
3. **System status display**: UTC time, Data flow
4. **Interactive elements**

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 9.1 | **"[SONTUNGMTP]"** không rõ ý nghĩa | System log | `ExploreMapPage.tsx` | Loại bỏ hoặc thay username |
| 9.2 | **"SCANNING... [TARGET: LOW]"** confusing | Status bar | `ExploreMapPage.tsx` | Đơn giản hóa |
| 9.3 | **Thiếu legend/hướng dẫn** | Map area | `ExploreMapPage.tsx` | Thêm tooltip mô tả zone |
| 9.4 | **Zone names quá abstract** | Zone labels | `ExploreMapPage.tsx` | Thêm subtitle chức năng |
| 9.5 | **Responsive không rõ** | Toàn trang | CSS | Test và optimize mobile |

---

## 📝 Ghi chú

- Concept map rất creative
- Cần documentation để user hiểu từng zone
- Zones mapping:
  - Học Viện Chiến Binh → Courses
  - Phi Thuyền Mẹ → Dashboard
  - Khu Chợ Đen → Marketplace/Shop
  - Lỗ Sâu → Chatbot AI
