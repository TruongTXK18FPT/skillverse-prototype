/**
 * Professional markdown templates for short-term job descriptions.
 * These templates provide structured guidance for recruiters to write compelling job postings.
 */

export interface JobTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  markdown: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "software-development",
    name: "Phát triển phần mềm",
    category: "Công nghệ",
    description: "Template cho các dự án phát triển phần mềm, web app, mobile app, API...",
    markdown: `## Mục tiêu công việc

- Mô tả rõ ràng đầu ra mong đợi (sản phẩm, tính năng, API endpoint...)
- Nêu tiêu chuẩn chất lượng cần đạt

## Phạm vi công việc

### Yêu cầu kỹ thuật

- Ngôn ngữ / framework cụ thể
- Kiến trúc và design pattern
- Công cụ và infrastructure

### Tính năng chính

- [ ] Tính năng 1
- [ ] Tính năng 2
- [ ] Tính năng 3

## Deliverables

| STT | Hạng mục | Định dạng | Mô tả |
|-----|----------|-----------|--------|
| 1 | Source code | .zip / Git repo | Toàn bộ mã nguồn |
| 2 | Tài liệu | PDF / MD | Hướng dẫn cài đặt & sử dụng |
| 3 | Test coverage | Báo cáo | Tối thiểu 70% coverage |

## Tiêu chí hoàn thành

- Code clean, có comment
- Không có lỗi critical/high
- Unit test pass 100%
- Hướng dẫn deploy rõ ràng

## Ngân sách & Timeline

- **Ngân sách**: VNĐ
- **Hình thức thanh toán**: Theo giai đoạn / Cuối cùng
- **Timeline**:`,
  },
  {
    id: "design-creative",
    name: "Thiết kế sáng tạo",
    category: "Thiết kế",
    description: "Template cho các công việc thiết kế đồ họa, UI/UX, logo, banner...",
    markdown: `## Mục tiêu công việc

- Mô tả rõ sản phẩm thiết kế cần đạt được
- Xác định mood, phong cách và đối tượng mục tiêu

## Phạm vi công việc

### Yêu cầu thiết kế

- Loại thiết kế: Logo / Banner / UI / Icon / Print...
- Phong cách: Minimalist / Corporate / Playful / Luxury...
- Màu sắc: Palette cố định hoặc tự do sáng tạo

### Sản phẩm cần bàn giao

- [ ] Thiết kế chính (primary)
- [ ] Thiết kế phụ (alternative)
- [ ] Phiên bản mobile / desktop
- [ ] File nguồn đầy đủ

## Thông số kỹ thuật

| Hạng mục | Yêu cầu |
|-----------|----------|
| Định dạng | PNG / SVG / PSD / AI |
| Độ phân giải | 300 DPI (print) / 72 DPI (web) |
| Kích thước | Theo spec chi tiết |
| Màu sắc | CMYK / RGB |

## Tiêu chí hoàn thành

- Đúng brief và moodboard
- File xuất chuẩn, không bị vỡ
- Bàn giao đủ các format yêu cầu
- Hỗ trợ chỉnh sửa minor (${'{'}số lần${'}'} lần)

## Ngân sách & Timeline

- **Ngân sách**: VNĐ
- **Số lần chỉnh sửa**: ${'{'}số lần${'}'} lần (sau đó tính phí)
- **Timeline**:`,
  },
  {
    id: "content-writing",
    name: "Viết nội dung",
    category: "Viết lách",
    description: "Template cho các công việc viết bài, copywriter, content marketing...",
    markdown: `## Mục tiêu công việc

- Xác định mục đích của nội dung (tăng awareness / convert / educate...)
- Mô tả rõ người đọc mục tiêu (buyer persona)

## Phạm vi công việc

### Yêu cầu nội dung

- Chủ đề / lĩnh vực cụ thể
- Tone of voice: Formal / Casual / Technical / Friendly...
- Độ dài: ${'{'}số từ / ký tự${'}'} từ

### Cấu trúc bài viết

1. **Mở đầu** — Hook người đọc, dẫn dắt vào chủ đề
2. **Thân bài** — Các ý chính, arguments, evidence
3. **Kết luận** — Tóm tắt, call to action

## Tiêu chí hoàn thành

- Không đạo văn (sử dụng công cụ check đạo văn)
- SEO-friendly (keyword density hợp lý)
- Ngữ pháp, chính tả chính xác
- Có headline, subheadline, bullet points phù hợp
- Cung cấp ${'{'}số${'}'} hình ảnh minh họa đi kèm

## Deliverables

| STT | Hạng mục | Định dạng |
|-----|----------|-----------|
| 1 | Bài viết chính | DOCX / Google Docs |
| 2 | Hình ảnh minh họa | PNG / JPG |

## Ngân sách & Timeline

- **Ngân sách**: VNĐ
- **Số bài viết**: ${'{'}số bài${'}'} bài
- **Hình thức thanh toán**: Theo bài / Tổng lẻ
- **Timeline**:`,
  },
  {
    id: "video-production",
    name: "Sản xuất video",
    category: "Video & Animation",
    description: "Template cho các công việc quay, dựng video, motion graphics, animation...",
    markdown: `## Mục tiêu công việc

- Mô tả rõ mục đích video (quảng cáo / giới thiệu sản phẩm / tutorial...)
- Xác định nền tảng đích (YouTube / TikTok / Web / TVC...)

## Phạm vi công việc

### Yêu cầu sản xuất

- Loại video: Live-action / Animation / Motion graphics / Screencast...
- Độ dài: ${'{'}thời lượng${'}'}
- Chất lượng: 1080p / 4K / 8K
- Tỷ lệ khung hình: 16:9 / 9:16 / 1:1

### Nội dung video

- [ ] Script / kịch bản
- [ ] Quay / Record
- [ ] Dựng (Edit)
- [ ] Motion / VFX (nếu có)
- [ ] Phụ đề / Captions

## Deliverables

| STT | Hạng mục | Định dạng |
|-----|----------|-----------|
| 1 | Video hoàn chỉnh | MP4 (H.264) |
| 2 | File gốc | Project file (Premiere / AE...) |
| 3 | Script / Storyboard | DOCX / PDF |

## Tiêu chí hoàn thành

- Đúng brief và concept
- Chất lượng hình ảnh / âm thanh đạt chuẩn
- Bàn giao đủ các format theo yêu cầu
- Thời gian bàn giao đúng deadline

## Ngân sách & Timeline

- **Ngân sách**: VNĐ
- **Số lần chỉnh sửa**: ${'{'}số lần${'}'} lần
- **Timeline**:`,
  },
  {
    id: "marketing-digital",
    name: "Marketing số",
    category: "Marketing",
    description: "Template cho các công việc SEO, chạy quảng cáo, social media marketing...",
    markdown: `## Mục tiêu công việc

- Mô tả mục tiêu chiến dịch (tăng traffic / leads / sales / brand awareness...)
- Xác định KPI cụ thể và đo lường được

## Phạm vi công việc

### Yêu cầu chiến dịch

- Nền tảng: Google Ads / Facebook Ads / TikTok / SEO / Email...
- Ngân sách quảng cáo: VNĐ / tháng
- Đối tượng mục tiêu: Demo, interests, behavior...

### Deliverables

- [ ] Setup tài khoản / Pixel / Tracking
- [ ] Viết copy quảng cáo
- [ ] Thiết kế creative (nếu cần)
- [ ] A/B testing variants
- [ ] Báo cáo hiệu quả

## Tiêu chí hoàn thành

- Đạt KPI đề ra (ROAS / CPA / CTR / CPL...)
- Báo cáo chi tiết, minh bạch
- Hỗ trợ tối ưu trong thời gian chạy
- Tài liệu handover rõ ràng

## Ngân sách & Timeline

- **Ngân sách quảng cáo**: VNĐ
- **Phí dịch vụ**: VNĐ / tháng
- **Timeline**:`,
  },
  {
    id: "general-freelance",
    name: "Công việc tổng hợp",
    category: "Khác",
    description: "Template linh hoạt cho các công việc không thuộc danh mục trên.",
    markdown: `## Mục tiêu công việc

- Mô tả rõ ràng và cụ thể đầu ra mong đợi
- Xác định tiêu chuẩn "hoàn thành" là gì

## Phạm vi công việc

### Nhiệm vụ chính

- [ ] Nhiệm vụ 1
- [ ] Nhiệm vụ 2
- [ ] Nhiệm vụ 3

### Nhiệm vụ phụ (nếu có)

- [ ] Nhiệm vụ phụ 1
- [ ] Nhiệm vụ phụ 2

## Deliverables

| STT | Hạng mục | Định dạng | Mô tả |
|-----|----------|-----------|--------|
| 1 | | | |
| 2 | | | |

## Tiêu chí hoàn thành

- Đạt yêu cầu chất lượng đã nêu
- Bàn giao đúng deadline
- Hỗ trợ chỉnh sửa minor sau bàn giao

## Ngân sách & Timeline

- **Ngân sách**: VNĐ
- **Hình thức thanh toán**: Trả trước / Theo giai đoạn / Cuối cùng
- **Timeline**:`,
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): JobTemplate | undefined {
  return JOB_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): JobTemplate[] {
  return JOB_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(JOB_TEMPLATES.map((t) => t.category))];
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): JobTemplate[] {
  const q = query.toLowerCase();
  return JOB_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
}
