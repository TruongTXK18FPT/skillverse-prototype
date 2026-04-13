# Đánh Giá Sản Phẩm SkillVerse Prototype — Luồng Tuyển Dụng

> **Ngày đánh giá:** 2026-04-08
> **Vai trò đánh giá:** Doanh nghiệp tuyển dụng (Recruiter / Employer)
> **Phạm vi:** Full-time Jobs + Short-term / Gig Jobs

---

## Mục lục

1. [Tổng quan hệ thống hiện tại](#1-tổng-quan-hệ-thống-hiện-tại)
2. [Full-time Jobs — Thiếu nghiệp vụ](#2-full-time-jobs--thiếu-nghiệp-vụ)
3. [Short-term / Gig Jobs — Thiếu nghiệp vụ](#3-short-term--gig-jobs--thiếu-nghiệp-vụ)
4. [Platform-wide — Thiếu nghiệp vụ chung](#4-platform-wide--thiếu-nghiệp-vụ-chung)
5. [Ưu tiên triển khai](#5-ưu-tiên-triển-khai)

---

## 1. Tổng quan hệ thống hiện tại

### 1.1 File cấu trúc chính

| File | Mô tả |
|---|---|
| `src/types/ShortTermJob.ts` | Type definitions + enum cho short-term jobs, escrow, disputes, trust scores |
| `src/data/jobDTOs.ts` | DTOs cho full-time jobs: JobPosting, JobApplication, JobBoost |
| `src/services/jobService.ts` | API service cho full-time jobs |
| `src/services/shortTermJobService.ts` | API service cho short-term jobs (CRUD, escrow, disputes) |
| `src/services/jobReviewService.ts` | API service cho reviews |
| `src/components/jobs-odyssey/` | Giao diện Odyssey — duyệt + detail cho cả 2 loại job |
| `src/components/business-hud/` | Giao diện recruiter — quản lý job, candidate search, job boost |
| `src/components/short-term-job/` | Gig components — form, escrow, dispute, review |
| `src/components/business/ApplicantsModal.tsx` | Recruiter pipeline cho full-time jobs |
| `src/pages/business/ShortTermJobDetailPage.tsx` | Chi tiết short-term job + applicant management |

### 1.2 Luồng hiện tại — Full-time Jobs

```
ĐĂNG JOB
  └─ Tạo job → IN_PROGRESS / DRAFT
  └─ Đổi status → OPEN (accepting applications)
  └─ EDIT / DELETE (chỉ nếu IN_PROGRESS)

DUYỆT JOB (Candidate)
  └─ /jobs → JobsOdysseyPage → FateDetailPage
  └─ Xem mô tả, budget, skills, recruiter info

ỨNG TUYỂN (Candidate)
  └─ Nhấn "Ứng tuyển" →填写 cover letter (text, max 1000 chars)
  └─ POST /api/jobs/{id}/apply → status: PENDING
  └─ Redirect → My Applications

XỬ LÝ HỒ SƠ (Recruiter)
  └─ Xem danh sách applicants → ApplicantsModal
  └─ Mark Reviewed / Accept / Reject / Chat
  └─ PATCH /api/jobs/applications/{id}/status

KẾT QUẢ
  └─ ACCEPTED → acceptance message
  └─ REJECTED → rejection reason
  └─ CLOSE JOB / REOPEN (hard delete all apps)
```

### 1.3 Luồng hiện tại — Short-term / Gig Jobs

```
ĐĂNG JOB
  └─ Tạo job → DRAFT (ShortTermJobForm)
  └─ Chọn template (6 loại) hoặc tự điền
  └─ Submit → PENDING_APPROVAL
  └─ [Admin approve] → PUBLISHED

DUYỆT JOB (Candidate)
  └─ /jobs hoặc /short-term-jobs → GigCards
  └─ Filters: urgency, remote/onsite, budget, skills

ỨNG TUYỂN (Candidate)
  └─ Nhấn "Ứng tuyển ngay"
  └─ Điền: cover letter + proposed price + proposed duration
  └─ POST /api/short-term-jobs/{id}/apply → status: PENDING

RECRUITER DUYỆT
  └─ Accept / Reject / Chat (trên job detail page)

GIAI ĐOẠN LÀM VIỆC
  └─ ACCEPTED → WORKING / IN_PROGRESS
  └─ Candidate nộp deliverables → SubmitDeliverablePage
  └─ 48h SLA cho recruiter review

RECRUITER REVIEW WORK
  └─ Approve → APPROVED → COMPLETED → PAID (escrow released)
  └─ Request Revision → REVISION_REQUIRED (max 5 lần)
  └─ Cancel / Dispute

REVIEW HAI CHIỀU
  └─ Sau COMPLETED + PAID → cả 2 bên viết review
  └─ Bidirectional rating system
```

### 1.4 Điểm mạnh hiện tại

- Kiến trúc types/services/pages nhất quán, có phân biệt rõ ràng 2 loại job
- Escrow system cho short-term jobs (fund, release, refund, transactions)
- Dispute resolution flow đầy đủ: open → evidence → admin resolve
- Admin approval step cho short-term jobs trước khi publish
- Review system hai chiều (recruiter ↔ candidate)
- JobBoost cho full-time jobs (quota, analytics)
- Trust score system với 4 tiers (NEWCOMER → ELITE)
- RichMarkdownEditor cho mô tả job ngắn hạn
- Recruiter chat có context-aware cho từng job

---

## 2. Full-time Jobs — Thiếu nghiệp vụ

### 2.1 Nghiệp vụ thiếu NGHIÊM TRỌNG

#### [CRITICAL-01] Không có lịch phỏng vấn

**Mô tả:**
Enum `LongTermJobStatus` trong `src/types/ShortTermJob.ts` định nghĩa sẵn các trạng thái phỏng vấn:

```typescript
INTERVIEW_SCHEDULED
INTERVIEWED
OFFER_SENT
OFFER_ACCEPTED
OFFER_REJECTED
CONTRACT_SIGNED
PROBATION
EMPLOYED
EXTENDED
TERMINATED
RESIGNED
```

Tuy nhiên các trạng thái này **không bao giờ được sử dụng** trong `jobService.ts` hay bất kỳ UI component nào. Sau khi recruiter Accept ứng viên, luồng tuyển dụng **chết đứt** — không có bước tiếp theo nào.

**Tác động:**
- Recruiter phải ra ngoài nền tảng (email, Zalo, Google Calendar) để liên hệ phỏng vấn
- Không có history của các vòng phỏng vấn
- Không track được kết quả từng vòng
- Không có reminder cho candidate

**Cần bổ sung:**
- Trạng thái `INTERVIEW_SCHEDULED` cho application sau khi Accept
- Lịch phỏng vấn: chọn ngày/giờ, địa điểm (online/link or offline)
- Gửi notification cho candidate khi lịch được set
- Ghi chép kết quả sau phỏng vấn (notes, điểm, recommendation)
- Multiple rounds support (vòng 1, vòng 2, final)

#### [CRITICAL-02] Không có offer letter

**Mô tả:**
Không có template offer letter, không có cơ chế gửi offer, không track offer accepted/rejected.

**Cần bổ sung:**
- Template offer letter với placeholder: tên ứng viên, vị trí, lương, benefits, start date
- Gửi offer qua in-app notification + email
- Track: `OFFER_SENT` → candidate xem → Accept / Reject / Counter offer
- Salary negotiation flow

#### [CRITICAL-03] Không có quản lý hợp đồng

**Mô tả:**
Không có contract template, không có signing flow, không lưu hợp đồng.

**Cần bổ sung:**
- Contract template (probation contract, full-time contract)
- E-signature flow
- Lưu hợp đồng đã ký vào application
- Track: `CONTRACT_SIGNED`, `PROBATION`, `EMPLOYED`
- Download/export hợp đồng

#### [HIGH-04] Không upload được CV/Resume ~~[CRITICAL-04]~~ → ĐÃ CÓ PORTFOLIO, KHÔNG CẦN

**Mô tả:**

Hệ thống đã sử dụng **portfolio system** thay thế cho CV truyền thống. Khi apply, ứng viên cung cấp:

- `portfolio[]` — danh sách portfolio links
- `portfolioSlug` — profile/portfolio page

Nên **không cần upload CV/Resume** — đây là design decision đúng đắn cho nền tảng freelancer/gig.

**Kết luận:** ~~CRITICAL-04 removed — not needed, portfolio is sufficient~~

> **Ghi chú:** Tuy nhiên, cần đảm bảo Recruiter có thể **preview và download** portfolio content dễ dàng từ applicant list. Xem thêm issue [HIGH-09] Candidate Comparison.

#### [HIGH-05] Không có screening questions

**Mô tả:**
Không có quiz/questionnaire bắt buộc trước khi apply. Mọi ứng viên đều có thể apply mà không qua bất kỳ bài lọc nào.

**Cần bổ sung:**
- Recruiter tạo screening questions khi đăng job (text answer / multiple choice)
- Candidate trả lời trước khi submit application
- Auto-scoring cho multiple choice
- Recruiter xem điểm screening trong applicant list
- Filter/sort applicants theo screening score

---

### 2.2 Nghiệp vụ thiếu quan trọng

#### [HIGH-06] Không có ATS pipeline view (kanban)

**Mô tả:**
Chỉ có danh sách applicant phẳng trong `ApplicantsModal`. Không có view dạng pipeline/kanban thể hiện các giai đoạn: Ứng tuyển → Review → Phỏng vấn → Offer → Tuyển.

**Cần bổ sung:**
- Kanban board với các cột: PENDING, REVIEWED, INTERVIEW, OFFER, HIRED, REJECTED
- Drag-and-drop candidate giữa các cột
- Bulk actions (move multiple candidates cùng lúc)

#### [HIGH-07] Không có bulk actions cho applicants

**Mô tả:**
Chỉ accept/reject từng ứng viên một. Khi có 50+ ứng viên, việc xử lý rất tốn thời gian.

**Cần bổ sung:**
- Select multiple applicants
- Bulk accept / bulk reject
- Bulk send message
- Bulk move to stage

#### [HIGH-08] Không hiển thị deadline countdown

**Mô tả:**
Job có trường `deadline` nhưng job card (FateCard) không hiển thị countdown timer hay urgency indicator. Candidate không biết job sắp đóng.

**Cần bổ sung:**
- Countdown timer trên job card: "Còn 3 ngày để ứng tuyển"
- Urgency badge: "Sắp đóng" (≤3 ngày), "Mới đăng" (≤7 ngày)
- Filter: "Sắp hết hạn" trong FilterConsole

#### [HIGH-09] Không có candidate comparison

**Mô tả:**
Không so sánh được nhiều ứng viên cạnh nhau để ra quyết định.

**Cần bổ sung:**
- Chọn 2-3 ứng viên → side-by-side comparison view
- So sánh: cover letter, screening score, rating, completed jobs, skills match

#### [HIGH-10] Không có reference check

**Mô tả:**
Không có cơ chế request hoặc cung cấp professional references.

**Cần bổ sung:**
- Candidate upload reference letters hoặc điền reference contacts
- Recruiter gửi reference check request
- Reference response tracked trong application

#### [HIGH-11] Không có salary negotiation flow

**Mô tả:**
Không có cơ chế đàm phán lương/offer trong nền tảng. Mọi thứ phải trao đổi bên ngoài.

**Cần bổ sung:**
- Counter offer từ candidate
- Recruiter xem counter offer và phản hồi
- Threaded negotiation history

#### [HIGH-12] Không có job cloning

**Mô tả:**
Muốn đăng lại một job tương tự, recruiter phải tạo từ đầu toàn bộ form.

**Cần bổ sung:**
- "Nhân bản" job → pre-filled form với tất cả fields
- Đổi title + deadline, giữ nguyên mô tả và requirements

#### [HIGH-13] Không có recruiter inbox / messaging thực sự

**Mô tả:**
Chat chỉ có trong job context cho short-term jobs. Không có inbox cho recruiter để quản lý tin nhắn từ tất cả ứng viên across all jobs.

**Cần bổ sung:**
- Recruiter inbox — tổng hợp tin nhắn từ mọi job
- Email notification khi có tin nhắn mới
- Thread view: ứng viên ↔ recruiter per job

#### [HIGH-14] Không có job categories / specializations UI

**Mô tả:**
`jobDTOs.ts` có các fields `experienceLevel`, `jobType`, `hiringQuantity`, `benefits`, `genderRequirement` nhưng **không có UI** để recruiter điền khi tạo job.

**Cần bổ sung:**
- UI cho benefits (bảo hiểm, bonus, remote policy,...)
- Experience level selector
- Hiring quantity input
- Gender requirement (nếu cần)

#### [HIGH-15] Không có application analytics cho recruiter

**Mô tả:**
Recruiter không thấy được tổng quan: bao nhiêu lượt xem job, bao nhiêu apply, conversion rate, etc.

**Cần bổ sung:**
- View count, apply count, bookmarks count
- Source of applications (Ứng tuyển vs được recruiter invite)
- Apply rate trend over time

---

## 3. Short-term / Gig Jobs — Thiếu nghiệp vụ

### 3.1 Nghiệp vụ thiếu NGHIÊM TRỌNG

#### [CRITICAL-16] ~~Không bắt buộc fund escrow trước khi accept~~ → ĐÃ CÓ

**Mô tả:**
Hệ thống đã có cơ chế **bắt buộc fund escrow trước khi Accept candidate**. Recruiter không thể Accept khi chưa fund escrow.

**Kết luận:** ~~CRITICAL-16 removed — already implemented~~

#### [CRITICAL-17] Milestone workflow không hoàn chỉnh

**Mô tả:**
Type `Milestone` được định nghĩa trong `src/types/ShortTermJob.ts` nhưng gần như **không có UI** để:
- Recruiter tạo milestones khi đăng job (trong ShortTermJobForm)
- Theo dõi tiến độ từng milestone
- Partial payment theo milestone khi hoàn thành từng mốc

**Cần bổ sung:**
- Milestone builder trong job creation form
- Per-milestone escrow locking & release
- Milestone progress tracker (Pending / In Progress / Completed per milestone)
- Deadline riêng cho từng milestone
- Auto-advance sang milestone tiếp theo khi milestone trước completed

---

### 3.2 Nghiệp vụ thiếu quan trọng

#### [HIGH-18] Không có freelancer earnings dashboard

**Mô tả:**
Không có trang tổng hợp thu nhập cho freelancer. Freelancer không biết mình đang có bao nhiêu tiền: pending (đang chờ release), available (sẵn sàng rút), withdrawn.

**Cần bổ sung:**
- Earnings page cho freelancer
  - Pending balance (escrow đã funded nhưng chưa released)
  - Available balance (đã completed + paid, chưa withdrawn)
  - Total earned (all-time)
  - Payout history
- Payout request / withdrawal flow
- Bank account / payment method settings

#### [HIGH-19] Không có time tracking

**Mô tả:**
Job có `paymentMethod: HOURLY` trong type definition nhưng **không có time tracker**. Freelancer làm bao nhiêu giờ không được ghi nhận.

**Cần bổ sung:**
- Built-in time tracker button (Start/Stop timer)
- Manual time entry
- Screenshot capture (optional, configurable per job)
- Time log attached to deliverable submission
- Hourly rate × hours = payment amount

#### [HIGH-20] Không auto-release escrow theo milestone

**Mô tả:**
Escrow hiện tại chỉ release một cục khi job COMPLETED + PAID. Không phù hợp với milestone-based payment model.

**Cần bổ sung:**
- Per-milestone escrow release
- Partial release khi recruiter APPROVE từng milestone
- Platform fee deducted per milestone release

#### [HIGH-21] Không có job completion certificate

**Mô tả:**
Sau khi job hoàn thành, không có gì xác nhận chính thức rằng freelancer đã hoàn thành công việc.

**Cần bổ sung:**
- Digital certificate of completion (PDF)
- Gồm: freelancer name, job title, recruiter company, completion date, deliverables summary
- Shareable link (LinkedIn, portfolio)

#### [HIGH-22] Không có NDA / contract attachment

**Mô tả:**
Không có cách đính kèm thỏa thuận NDA hoặc hợp đồng vào job.

**Cần bổ sung:**
- Recruiter upload NDA/contract file khi tạo job
- Freelancer phải accept NDA trước khi apply
- Signed NDA lưu trong application

#### [HIGH-23] Không có freelance portfolio matching

**Mô tả:**
Không có cơ chế match giữa job required skills và freelancer portfolio.

**Cần bổ sung:**
- Skill-based matching score (job requirements vs freelancer profile)
- "Recommended freelancers" list khi recruiter xem job applicants
- Sort applicants by match score

---

## 4. Platform-wide — Thiếu nghiệp vụ chung

| # | Thiếu | Mô tả |
|---|---|---|
| 24 | **Job analytics cho candidate** | Candidate không thấy: bao nhiêu người xem job, bao nhiêu người apply → mức độ cạnh tranh |
| 25 | **Skill gap analysis** | So sánh job requirements vs user profile → gợi ý candidate có nên apply không |
| 26 | **Recommendation engine** | Personalized job recommendations dựa trên skills + history |
| 27 | **Saved searches / job alerts** | Lưu bộ lọc tìm kiếm + notification khi có job mới matching |
| 28 | **Job posting templates cho full-time** | Chỉ có template cho short-term (6 templates); full-time không có |
| 29 | **Probation tracking** | Sau khi hire, không theo dõi giai đoạn thử việc |
| 30 | **Termination workflow** | Không có formal workflow nếu candidate bị terminate trong probation |
| 31 | **Background check integration** | Không có cơ chế xác minh lý lịch ứng viên |
| 32 | **Onboarding flow** | Sau khi ký hợp đồng, không có onboarding checklist/workflow |
| 33 | **Employer brand page** | Public recruiter profile hiện tại basic; không có showcase chi tiết |
| 34 | **Candidate quality scoring** | Không có AI/rule-based ranking ứng viên theo match quality |
| 35 | **Calendar integration** | Không kết nối Google Calendar / Outlook để đặt lịch phỏng vấn |
| 36 | **Video interview** | Không có video call trong nền tảng |
| 37 | **Multi-language job posting** | Job description chỉ có một ngôn ngữ |
| 38 | **External job board integration** | Không cross-post sang LinkedIn, Vietnamworks, etc. |
| 39 | **Anonymous recruiting option** | Full name + company luôn visible; không có chế độ ẩn danh |
| 40 | **Automated compliance check** | Không validate job postings có tuân thủ luật lao động (minimum wage, working conditions) |
| 41 | **White-label / embeddable job portal** | Recruiter không thể nhúng job board tùy chỉnh vào website riêng |
| 42 | **A/B testing job descriptions** | Không có cách test different description formats |
| 43 | **Admin analytics dashboard** | Không có dashboard tổng quan cho admin: total jobs, applications, disputes, revenue |
| 44 | **Platform fee transparency UI** | `platformFee` tồn tại trong escrow entity nhưng không hiển thị cách tính phí cho recruiter/freelancer |
| 45 | **Dispute auto-resolution rules** | Không có automatic escalation rules cho disputes |
| 46 | **Mediation chat cho disputes** | Không có in-platform communication giữa 2 bên trong dispute |
| 47 | **Community voting cho disputes** | Không có community voting mechanism |

---

## 5. Ưu tiên triển khai

### Phase 1 — Nghiệp vụ tối thiểu để hệ thống tuyển dụng hoạt động thực tế

| Ưu tiên | Issue | Effort |
|---|---|---|
| P0 | **[CRITICAL-01]** Lịch phỏng vấn + interview workflow | Cao |
| P1 | **[CRITICAL-02]** Offer letter + offer tracking | Cao |
| P1 | **[CRITICAL-03]** Quản lý hợp đồng | Cao |
| P1 | **[HIGH-05]** Screening questions | Trung bình |
| P1 | **[CRITICAL-17]** Milestone workflow hoàn chỉnh | Cao |

### Phase 2 — Cải thiện trải nghiệm recruiter

| Ưu tiên | Issue | Effort |
|---|---|---|
| P2 | **[HIGH-06]** ATS kanban pipeline view | Cao |
| P2 | **[HIGH-07]** Bulk actions | Thấp |
| P2 | **[HIGH-08]** Deadline countdown + urgency | Thấp |
| P2 | **[HIGH-09]** Candidate comparison | Trung bình |
| P2 | **[HIGH-13]** Recruiter inbox / messaging | Trung bình |
| P2 | **[HIGH-15]** Application analytics cho recruiter | Trung bình |
| P2 | **[HIGH-18]** Freelancer earnings dashboard | Trung bình |
| P2 | **[HIGH-20]** Per-milestone escrow release | Trung bình |

### Phase 3 — Mở rộng và nâng cao

| Ưu tiên | Issue |
|---|---|
| P3 | **[HIGH-10]** Reference check |
| P3 | **[HIGH-11]** Salary negotiation flow |
| P3 | **[HIGH-12]** Job cloning |
| P3 | **[HIGH-14]** Job benefits/specializations UI |
| P3 | **[HIGH-19]** Time tracking |
| P3 | **[HIGH-21]** Job completion certificate |
| P3 | **[HIGH-22]** NDA/contract attachment |
| P3 | **[HIGH-23]** Freelancer portfolio matching |
| P3 | Saved searches + job alerts |
| P3 | Skill gap analysis |
| P3 | Job posting templates cho full-time |
| P3 | Employer brand page |

### Phase 4 — Nice to have

| Ưu tiên | Issue |
|---|---|
| P4 | Recommendation engine |
| P4 | Candidate quality scoring / AI ranking |
| P4 | Calendar integration (Google/Outlook) |
| P4 | Video interview |
| P4 | Background check integration |
| P4 | Onboarding flow |
| P4 | External job board integration |
| P4 | White-label job portal |
| P4 | A/B testing job descriptions |
| P4 | Admin analytics dashboard |
| P4 | Dispute auto-resolution + community voting |
| P4 | Mediation chat cho disputes |

---

## Files cần thay đổi chính khi triển khai

```
Priority P0:
  src/types/ShortTermJob.ts          — Thêm interview status types
  src/data/jobDTOs.ts                — Thêm CV upload DTOs
  src/services/jobService.ts         — Thêm interview + offer + contract APIs
  src/services/shortTermJobService.ts — Auto-fund escrow logic
  src/components/business/ApplicantsModal.tsx — ATS kanban view
  src/components/short-term-job/ShortTermJobForm.tsx — Milestone builder

Priority P1:
  src/components/jobs-odyssey/FateDetailPage.tsx — Apply form + CV upload
  src/components/jobs-odyssey/FateCard.tsx       — Deadline countdown
  src/pages/business/ShortTermJobDetailPage.tsx  — Milestone tracker
  src/components/short-term-job/EscrowStatusBanner.tsx — Auto-fund UI

Phase 2:
  src/pages/business/JobManagementHub.tsx        — Analytics dashboard
  src/pages/user/MyApplicationsPage.tsx           — Candidate analytics
  src/components/business-hud/JobManagementHub.tsx — Recruiter inbox

Phase 3:
  src/pages/user/EarningsPage.tsx (mới)          — Freelancer earnings
  src/pages/business/ContractPage.tsx (mới)       — Contract management
  src/components/jobs-odyssey/OfferLetterModal.tsx (mới)
  src/components/short-term-job/MilestoneTracker.tsx (mới)
```

---

*Lưu ý: Các ưu tiên trên dựa trên mức độ ảnh hưởng đến quy trình tuyển dụng thực tế. Effort estimate chỉ mang tính ước lượng, cần confirm lại sau khi estimate chi tiết từng task.*
