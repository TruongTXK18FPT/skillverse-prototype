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

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 9.1 | **"[SONTUNGMTP]"** không rõ ý nghĩa | System log | `ExploreMapPage.tsx` | Loại bỏ hoặc thay username | ✅ **Đã sửa** - Đổi thành "[ĐÃ KẾT NỐI]" |
| 9.2 | **"SCANNING... [TARGET: LOW]"** confusing | Status bar | `ExploreMapPage.tsx` | Đơn giản hóa | ✅ **Đã sửa** - "DI CHUỘT ĐỂ KHÁM PHÁ" |
| 9.3 | **Thiếu legend/hướng dẫn** | Map area | `ExploreMapPage.tsx` | Thêm tooltip mô tả zone | ⏭️ **Bỏ qua** - Improvement feature |
| 9.4 | **Zone names quá abstract** | Zone labels | `ExploreMapPage.tsx` | Thêm subtitle chức năng | ⏭️ **Bỏ qua** - Design choice |
| 9.5 | **Responsive không rõ** | Toàn trang | CSS | Test và optimize mobile | ⏭️ **Bỏ qua** - Cần test riêng |

### 🆕 Round 2 Issues (2026-01-27)

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 9.6 | **Typo "DI CHUỖT"** | Bottom-right HUD | `ExploreMap.tsx:187` | Sửa thành "DI CHUỘT" | ✅ **Đã sửa Round 2** |
| 9.7 | **UTC label sai** | Top-left HUD | `ExploreMap.tsx:170` | Label "[UTC: ...]" nhưng hiển thị Vietnam time | 📝 **Low** - Consider đổi "[VN TIME:]" |
| 9.8 | **English HUD text** | Various | `ExploreMap.tsx` | "DATA FLOW: OPTIMAL", "SYS.READY" | 📝 **Low** - Có thể intentional cho sci-fi theme |

---

## 📝 Ghi chú

- Concept map rất creative
- Cần documentation để user hiểu từng zone
- Zones mapping:
  - Học Viện Chiến Binh → Courses
  - Phi Thuyền Mẹ → Dashboard
  - Khu Chợ Đen → Marketplace/Shop
  - Lỗ Sâu → Chatbot AI

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết:** 2/5 issues đã fix, 3/5 bỏ qua
