# UI Review - Skillverse Student Role

**Ngày review:** 27/01/2026  
**Reviewer:** AI Assistant  
**Tài khoản test:** cattpbse184684@fpt.edu.vn  
**Role:** Student  
**Website:** https://skillverse.vn

---

## 📊 Tổng quan

| Metric | Số lượng |
|--------|----------|
| Tổng số trang đã review | 38 |
| Tổng số issues | ~180+ |
| Critical Issues | ~15 |
| Medium Issues | ~70 |
| Minor Issues | ~95 |

---

## 📁 Cấu trúc thư mục

```
docs/ui-review/
├── README.md                    # File này
├── SUMMARY.md                   # Tổng hợp quick fixes
├── public-pages/                # Review các trang public
│   ├── 01-homepage.md
│   ├── 02-login.md
│   ├── 03-register.md
│   ├── 04-courses.md
│   ├── 05-jobs.md
│   ├── 06-community.md
│   ├── 07-seminar.md
│   ├── 08-premium.md
│   ├── 09-about.md
│   ├── 10-explore-map.md
│   ├── 11-gamification.md
│   ├── 12-help-center.md
│   ├── 13-user-guide.md
│   ├── 14-choose-role.md
│   ├── 15-terms-privacy.md
│   └── 16-meowl-shop.md
├── protected-pages/             # Review các trang cần đăng nhập
│   ├── 01-dashboard.md
│   ├── 02-wallet.md
│   ├── 03-profile.md
│   ├── 04-notifications.md
│   ├── 05-ai-roadmap.md
│   ├── 06-portfolio.md
│   ├── 07-chatbot.md
│   ├── 08-study-planner.md
│   ├── 09-mentorship.md
│   └── 10-bookings.md
└── appendix/                    # Phụ lục
    ├── file-paths.md
    ├── quick-fixes.md
    ├── code-snippets.md
    └── api-reference.md
```

---

## 🔴 Top 10 Critical Issues

1. **Footer copyright "2025"** → `src/components/layout/Footer.tsx:197`
2. **Typo "Constantsly"** → `src/pages/about/AboutPage.tsx:181`
3. **"Bạn đang dẫn đầu!"** sai logic → `src/pages/navbar/Gamification.tsx:403`
4. **Hardcoded achievements 2024** → `MothershipDashboard.tsx:114-156`
5. **Store items hardcoded** → `MyWalletCosmic.tsx:122-179`
6. **UTF-8 encoding** → Backend API responses
7. **Features array malformed** → Premium subscription API
8. **Welcome message năm 2024-2025** → `CareerChatPage.tsx:30-56`
9. **Native alert()** calls → Multiple files
10. **confirm()** native calls → `PortfolioPage.tsx:145`

---

## 🚀 Quick Start

1. Xem tổng quan issues: [SUMMARY.md](./SUMMARY.md)
2. Review từng trang: Xem thư mục `public-pages/` và `protected-pages/`
3. Code snippets để fix: [appendix/code-snippets.md](./appendix/code-snippets.md)
4. File paths chính xác: [appendix/file-paths.md](./appendix/file-paths.md)

---

## 📝 Ghi chú

- Review dựa trên giao diện thực tế và code analysis
- Các trang protected được review qua API data + code
- Backend cần fix UTF-8 encoding cho tiếng Việt
- Một số API endpoints trả về 500 error cần kiểm tra
