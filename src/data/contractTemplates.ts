/**
 * Contract template data for quick-fill functionality in ContractForm.
 * Provides BLL 2019-compliant templates for job descriptions, policies, and clauses.
 */

import { ContractType } from "../types/contract";

// ==================== CONTRACT TYPE DEFAULTS ====================

export interface ContractDefaults {
  workingHoursPerDay: number;
  workingHoursPerWeek: number;
  annualLeaveDays: number;
  terminationNoticeDays: number;
  probationMonths?: number;
  probationSalaryPercent?: number; // % of full salary
}

export const CONTRACT_TYPE_DEFAULTS: Record<ContractType, ContractDefaults> = {
  [ContractType.PROBATION]: {
    workingHoursPerDay: 8,
    workingHoursPerWeek: 40,
    annualLeaveDays: 0,
    terminationNoticeDays: 3,
    probationMonths: 1,
    probationSalaryPercent: 85,
  },
  [ContractType.FULL_TIME]: {
    workingHoursPerDay: 8,
    workingHoursPerWeek: 40,
    annualLeaveDays: 12,
    terminationNoticeDays: 30,
  },
  [ContractType.PART_TIME]: {
    workingHoursPerDay: 4,
    workingHoursPerWeek: 20,
    annualLeaveDays: 6,
    terminationNoticeDays: 15,
  },
};

// ==================== JOB DESCRIPTION TEMPLATES ====================

export interface TemplateOption {
  label: string;
  description?: string;
  value: string;
}

export const JOB_DESCRIPTION_TEMPLATES: Record<ContractType, TemplateOption[]> = {
  [ContractType.PROBATION]: [
    {
      label: "Kỹ sư phần mềm",
      description: "Phát triển, kiểm thử và bảo trì phần mềm",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Phát triển và bảo trì các tính năng mới theo yêu cầu sản phẩm
- Viết code sạch, có kiểm thử đơn vị (unit test)
- Tham gia code review và đóng góp ý kiến xây dựng
- Phối hợp với team QA, DevOps và Product

### Yêu cầu kỹ thuật
- Thành thạo ít nhất một ngôn ngữ lập trình (Java, JavaScript, Python...)
- Hiểu biết cơ bản về database, API, Git
- Có khả năng đọc hiểu tài liệu tiếng Anh kỹ thuật

### Kỹ năng mềm
- Chủ động học hỏi và tiếp thu feedback
- Giao tiếp rõ ràng, hợp tác tốt trong team
- Có tinh thần trách nhiệm với chất lượng công việc`,
    },
    {
      label: "Nhân viên Marketing",
      description: "Lập kế hoạch và thực hiện chiến dịch marketing",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Nghiên cứu thị trường, phân tích đối thủ cạnh tranh
- Lập kế hoạch và triển khai chiến dịch marketing (online/offline)
- Quản lý nội dung trên các kênh truyền thông xã hội
- Theo dõi, đo lường và báo cáo hiệu quả các chiến dịch

### Yêu cầu
- Hiểu biết về marketing căn bản (4P, AIDA...)
- Sử dụng thành thạo các công cụ: Google Analytics, Facebook Ads, Zalo Ads...
- Kỹ năng viết content, thiết kế đồ họa cơ bản là lợi thế
- Khả năng phân tích dữ liệu và đưa ra insights

### Kỹ năng mềm
- Sáng tạo, cập nhật xu hướng nhanh
- Làm việc dưới áp lực deadline
- Giao tiếp và thuyết trình tốt`,
    },
    {
      label: "Nhân viên Kế toán",
      description: "Hạch toán, theo dõi và quản lý sổ sách kế toán",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Hạch toán các nghiệp vụ kinh tế phát sinh hàng ngày
- Theo dõi công nợ, tiền tệ, ngân hàng
- Lập báo cáo tài chính định kỳ (tháng, quý, năm)
- Phối hợp với kiểm toán, thuế khi cần

### Yêu cầu
- Tốt nghiệp chuyên ngành Kế toán, Tài chính hoặc tương đương
- Thành thạo phần mềm kế toán (MISA, Fast, SAP...)
- Hiểu biết về Luật thuế, chế độ kế toán Việt Nam
- Cẩn thận, tỉ mỉ, có trách nhiệm với số liệu`,
    },
  ],
  [ContractType.FULL_TIME]: [
    {
      label: "Kỹ sư phần mềm Senior",
      description: "Thiết kế kiến trúc, phát triển và hướng dẫn team",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Thiết kế kiến trúc hệ thống, đưa ra các quyết định kỹ thuật quan trọng
- Phát triển và review code của team
- Xây dựng và cải tiến quy trình phát triển phần mềm (CI/CD, testing)
- Đào tạo, mentoring junior developers
- Phối hợp với Product Manager và các stakeholder

### Trách nhiệm cụ thể
- Đảm bảo chất lượng code, performance và security của hệ thống
- Đánh giá và phản hồi kỹ thuật cho các feature requests
- Tham gia on-call rotation và giải quyết sự cố production
- Đóng góp vào roadmap công nghệ của công ty

### Yêu cầu kỹ thuật
- Tối thiểu 5 năm kinh nghiệm với ngôn ngữ/chức danh tương đương
- Kiến thức sâu về architecture patterns (Microservices, Event-driven...)
- Kinh nghiệm với Cloud (AWS/GCP/Azure), container (Docker/K8s)
- Khả năng viết tài liệu kỹ thuật rõ ràng, chuyên nghiệp`,
    },
    {
      label: "Trưởng phòng Kinh doanh",
      description: "Quản lý và phát triển đội ngũ kinh doanh",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Xây dựng và triển khai chiến lược kinh doanh theo kế hoạch công ty
- Quản lý, đào tạo và phát triển đội ngũ nhân viên kinh doanh
- Thiết lập mối quan hệ với khách hàng lớn, đối tác chiến lược
- Theo dõi, phân tích và báo cáo KPI kinh doanh hàng tháng/quý
- Phối hợp với các phòng ban để đảm bảo dịch vụ sau bán hàng

### Trách nhiệm
- Hoàn thành targets doanh thu được giao
- Xây dựng văn hóa bán hàng tích cực trong team
- Quản lý và phát triển nhân sự trong phòng
- Báo cáo định kỳ cho Ban Giám đốc

### Yêu cầu
- Tối thiểu 5 năm kinh nghiệm trong lĩnh vực kinh doanh, ưu tiên có kinh nghiệm quản lý
- Kỹ năng giao tiếp, đàm phán, thuyết trình xuất sắc
- Khả năng phân tích thị trường và lập kế hoạch chiến lược
- Sử dụng thành thạo các công cụ CRM và báo cáo`,
    },
  ],
  [ContractType.PART_TIME]: [
    {
      label: "Nhân viên phục vụ",
      description: "Phục vụ khách hàng tại quầy, pha chế đồ uống",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Phục vụ khách hàng tại quầy với thái độ niềm nở, chuyên nghiệp
- Pha chế đồ uống theo công thức tiêu chuẩn
- Vệ sinh khu vực phục vụ, dụng cụ đảm bảo an toàn thực phẩm
- Kiểm tra và chuẩn bị nguyên vật liệu trước ca làm việc

### Yêu cầu
- Nhanh nhẹn, hoà đồng, có khả năng làm việc nhóm
- Giao tiếp tốt, thân thiện với khách hàng
- Linh hoạt về thời gian làm việc (sáng/chiều/tối, cuối tuần)
- Có kinh nghiệm phục vụ hoặc pha chế là lợi thế`,
    },
    {
      label: "Gia sư / Tutor",
      description: "Hướng dẫn học sinh các môn học theo chương trình",
      value: `## Mô tả công việc

### Nhiệm vụ chính
- Giảng dạy, hướng dẫn học sinh theo nội dung chương trình đã thống nhất
- Lập kế hoạch bài giảng phù hợp với trình độ học sinh
- Kiểm tra, đánh giá và báo cáo tiến độ học tập của học sinh
- Chuẩn bị tài liệu, bài tập bổ sung khi cần

### Yêu cầu
- Sinh viên năm 3 trở lên hoặc đã tốt nghiệp các trường ĐH top
- Thành thạo môn học đảm nhiệm, có phương pháp giảng dạy hiệu quả
- Kiên nhẫn, có khả năng truyền đạt kiến thức dễ hiểu
- Linh hoạt thời gian phù hợp với lịch học sinh`,
    },
  ],
};

// ==================== PROBATION TEMPLATES ====================

export const PROBATION_OBJECTIVES_TEMPLATES: TemplateOption[] = [
  {
    label: "Mục tiêu kỹ thuật",
    description: "Cho vị trí lập trình / kỹ thuật",
    value: `- Hoàn thành onboarding và làm quen với codebase, công cụ phát triển (Git, CI/CD, Jira) trong tuần đầu
- Hoàn thành ít nhất [số] task nhỏ với chất lượng được approve trong [số] tuần đầu
- Pass internal technical assessment vào cuối tháng thứ [số]
- Đóng góp ít nhất [số] bài trong wiki/tài liệu nội bộ
- Đạt rating 3.0/5.0 trở lên trong performance review cuối kỳ thử việc`,
  },
  {
    label: "Mục tiêu kinh doanh / hành chính",
    description: "Cho vị trí kinh doanh, nhân sự, kế toán...",
    value: `- Hoàn thành chương trình onboarding về sản phẩm, quy trình nội bộ
- Tham gia và hoàn thành [số] khách hàng/coworker shadowing sessions
- Xử lý độc lập [tỷ lệ]% công việc thường quy được giao
- Đạt KPIs thử việc: [liệt kê KPIs cụ thể]
- Hoàn thành đánh giá 360 và feedback từ supervisor và đồng nghiệp`,
  },
];

export const PROBATION_EVALUATION_TEMPLATES: TemplateOption[] = [
  {
    label: "Đánh giá kỹ thuật",
    description: "Tiêu chí cho vị trí lập trình / kỹ thuật",
    value: `### Tiêu chí đánh giá thử việc

| Tiêu chí | Tỷ lệ | Yêu cầu tối thiểu |
|-----------|--------|--------------------|
| Chất lượng code | 30% | Code sạch, có comment, pass review |
| Tiến độ hoàn thành | 25% | Đạt [số]% deadline |
| Kiến thức chuyên môn | 20% | Pass technical assessment ≥ 70% |
| Teamwork & giao tiếp | 15% | Được feedback tích cực từ đồng nghiệp |
| Văn hóa & giá trị công ty | 10% | Tuân thủ quy định nội bộ |

**Kết quả:**
- Đạt: Điểm trung bình ≥ 3.5/5.0, không tiêu chí nào dưới 2.5
- Không đạt: Điểm trung bình < 3.5 hoặc có tiêu chí dưới 2.5`,
  },
  {
    label: "Đánh giá kinh doanh",
    description: "Tiêu chí cho vị trí kinh doanh, hành chính...",
    value: `### Tiêu chí đánh giá thử việc

| Tiêu chí | Tỷ lệ | Yêu cầu tối thiểu |
|-----------|--------|--------------------|
| Hoàn thành công việc | 30% | [tỷ lệ]% task hoàn thành đúng deadline |
| KPIs thử việc | 30% | Đạt [số]% target |
| Giao tiếp & phối hợp | 20% | Phản hồi trong [số] giờ, hỗ trợ team |
| Thái độ & văn hóa | 20% | Tuân thủ giờ giấc, quy định, teamwork |

**Kết quả:**
- Đạt: Điểm trung bình ≥ 3.5/5.0, không tiêu chí nào dưới 2.5
- Không đạt: Điểm trung bình < 3.5 hoặc có tiêu chí dưới 2.5`,
  },
];

// ==================== WORKING SCHEDULE PRESETS ====================

export const WORKING_SCHEDULE_PRESETS: TemplateOption[] = [
  {
    label: "Thứ 2 - Thứ 6, 08:00 - 17:00",
    value: "Thứ 2 - Thứ 6, 08:00 - 17:00",
  },
  {
    label: "Thứ 2 - Thứ 6, 09:00 - 18:00",
    value: "Thứ 2 - Thứ 6, 09:00 - 18:00",
  },
  {
    label: "Thứ 2 - Thứ 6, 08:30 - 17:30",
    value: "Thứ 2 - Thứ 6, 08:30 - 17:30",
  },
  {
    label: "Linh hoạt theo dự án",
    value: "Linh hoạt theo dự án, đảm bảo hoàn thành KPIs",
  },
];

// ==================== REMOTE WORK POLICY TEMPLATES ====================

export const REMOTE_WORK_POLICY_TEMPLATES: TemplateOption[] = [
  {
    label: "Hybrid (2-3 ngày/tuần WFH)",
    description: "Phổ biến cho văn phòng công nghệ",
    value: `**Chính sách làm việc từ xa (Hybrid):**
- Được phép làm việc từ xa tối đa [2-3] ngày/tuần, cần thông báo trước cho line manager
- Cần đảm bảo: có internet ổn định, tham gia đầy đủ standup/sprint meetings qua video call
- Ngày bắt buộc có mặt tại văn phòng: thứ [2, 3, 4, 5 hoặc 6] hàng tuần (tùy thỏa thuận)
- Thiết bị làm việc từ xa: sử dụng laptop công ty, VPN bắt buộc khi truy cập hệ thống nội bộ
- Thời gian core hours online: 10:00 - 16:00 (có thể linh hoạt sáng/chiều)`,
  },
  {
    label: "Full remote",
    description: "Làm việc hoàn toàn từ xa",
    value: `**Chính sách làm việc từ xa (Full Remote):**
- Làm việc hoàn toàn từ xa, không bắt buộc đến văn phòng
- Yêu cầu: Internet ổn định (tối thiểu 20Mbps), không gian làm việc yên tĩnh
- Core hours online: 09:30 - 17:30 (giờ hành chính), tham gia đầy đủ meetings khi được triệu tập
- Thiết bị: Công ty hỗ trợ laptop và phụ kiện theo chính sách thiết bị
- Họp trực tiếp tại văn phòng hoặc địa điểm khác khi có yêu cầu (chi phí công ty chi trả)`,
  },
  {
    label: "100% tại văn phòng",
    description: "Không cho phép WFH thường xuyên",
    value: `**Chính sách làm việc tại văn phòng:**
- Làm việc toàn thời gian tại văn phòng theo giờ hành chính
- Trường hợp đặc biệt cần WFH: thông báo và được sự đồng ý của line manager, tối đa [số] ngày/tháng
- Công ty cung cấp đầy đủ trang thiết bị và không gian làm việc tại văn phòng`,
  },
];

// ==================== LEAVE POLICY TEMPLATES ====================

export const LEAVE_POLICY_TEMPLATES: Record<ContractType, TemplateOption[]> = {
  [ContractType.PROBATION]: [
    {
      label: "Không có",
      value: `**Chế độ nghỉ phép trong thời gian thử việc:**
- Không được hưởng ngày nghỉ phép năm trong thời gian thử việc (theo BLL 2019)
- Được nghỉ các ngày lễ, Tết theo quy định pháp luật hiện hành
- Nghỉ ốm: có giấy xác nhận của cơ sở y tế, hưởng theo chế độ BHXH`,
    },
  ],
  [ContractType.FULL_TIME]: [
    {
      label: "Theo BLL 2019 (12 ngày)",
      value: `**Chế độ nghỉ phép năm (BLL 2019, Điều 113):**
- Nghỉ phép năm: 12 ngày làm việc/năm cho người lao động hưởng lương tháng
- Sau mỗi 5 năm làm việc liên tục tại công ty: thêm 1 ngày nghỉ phép năm (tổng 13 ngày)
- Nghỉ phép năm phải được sự đồng ý của người quản lý trực tiếp, thông báo trước tối thiểu [3] ngày làm việc
- Nghỉ phép năm không được chuyển sang năm sau quá [3] ngày (hoặc không được chuyển, tùy chính sách công ty)
- Nghỉ ốm: theo giấy xác nhận của cơ sở y tế, hưởng chế độ BHXH
- Nghỉ thai sản, hiếu hỷ: theo quy định pháp luật hiện hành`,
    },
    {
      label: "Nâng cao (15-18 ngày)",
      description: "Công ty có chính sách phúc lợi tốt",
      value: `**Chế độ nghỉ phép năm (nâng cao):**
- Nghỉ phép năm: 15 ngày làm việc/năm cho nhân viên mới, tăng thêm theo thâm niên:
  - 2-5 năm: 16 ngày
  - 5-10 năm: 18 ngày
  - Trên 10 năm: 20 ngày
- Nghỉ phép năm có thể nghỉ gộp hoặc chia nhỏ, thông báo trước tối thiểu [3] ngày
- Công ty hỗ trợ [số] ngày nghỉ wellness leave/năm (không cần lý do)
- Nghỉ ốm, thai sản, hiếu hỷ: theo quy định pháp luật`,
    },
  ],
  [ContractType.PART_TIME]: [
    {
      label: "Tính theo tỷ lệ thời gian",
      value: `**Chế độ nghỉ phép cho lao động bán thời gian:**
- Nghỉ phép năm: tính theo tỷ lệ thời gian làm việc so với lao động toàn thời gian (Bộ luật Lao động 2019)
- Được nghỉ các ngày lễ, Tết theo quy định pháp luật hiện hành
- Nghỉ ốm: có giấy xác nhận y tế, hưởng BHXH theo tỷ lệ đóng góp`,
    },
  ],
};

// ==================== INSURANCE POLICY TEMPLATES ====================

export const INSURANCE_POLICY_TEMPLATES: Record<ContractType, TemplateOption[]> = {
  [ContractType.PROBATION]: [
    {
      label: "Cơ bản (thử việc)",
      value: `**Chế độ bảo hiểm trong thời gian thử việc:**
- Theo quy định BLL 2019: người lao động trong thời gian thử việc KHÔNG phải tham gia BHXH, BHTN
- Được đóng BHYT cùng với người sử dụng lao động theo quy định
- Sau khi ký HĐL chính thức: đăng ký tham gia đầy đủ BHXH, BHYT, BHTN theo quy định pháp luật hiện hành
- Công ty đóng: BHXH [18]%, BHYT [3]%, BHTN [1]% (tổng [22]% quỹ lương)`,
    },
  ],
  [ContractType.FULL_TIME]: [
    {
      label: "Theo quy định (đầy đủ)",
      value: `**Chính sách bảo hiểm:**
- Công ty đóng BHXH: [18]% quỹ lương đóng BHXH tháng
- Công ty đóng BHYT: [3]% quỹ lương đóng BHYT tháng
- Công ty đóng BHTN: [1]% quỹ lương đóng BHTN tháng
- Người lao động đóng: BHXH [8]%, BHYT [1.5]%, BHTN [1]% (khấu trừ vào lương)
- Đăng ký mã số BHXH trong thời hạn 30 ngày kể từ ngày ký HĐL
- Quỹ hỗ trợ y tế (company health fund): hỗ trợ [số] triệu/năm cho khám chữa bệnh ngoài BHYT
- Bảo hiểm sức khỏe cao cấp (nếu có): [mô tả chi tiết]`,
    },
    {
      label: "Cơ bản",
      value: `**Chính sách bảo hiểm:**
- Tham gia đầy đủ BHXH, BHYT, BHTN theo quy định pháp luật
- Công ty đóng: BHXH [18]%, BHYT [3]%, BHTN [1]%
- Người lao động đóng: BHXH [8]%, BHYT [1.5]%, BHTN [1]%`,
    },
  ],
  [ContractType.PART_TIME]: [
    {
      label: "Theo quy định",
      value: `**Chính sách bảo hiểm:**
- Tham gia BHXH, BHYT theo quy định pháp luật cho lao động bán thời gian
- Tỷ lệ đóng: theo quy định hiện hành cho HĐL thời vụ/bán thời gian
- Không bắt buộc tham gia BHTN (tùy thỏa thuận)`,
    },
  ],
};

// ==================== TRAINING POLICY TEMPLATES ====================

export const TRAINING_POLICY_TEMPLATES: TemplateOption[] = [
  {
    label: "Ngân sách đào tạo hàng năm",
    description: "Công ty hỗ trợ chi phí học tập, chứng chỉ",
    value: `**Chính sách đào tạo và phát triển:**
- Ngân sách đào tạo: [số] triệu VND/năm/người (hoặc [số] triệu VND/quý)
- Được đăng ký tham gia các khóa học chuyên môn, chứng chỉ nghiệp vụ (PMP, AWS, Google Ads...)
- Được tham gia hội thảo, sự kiện ngành (conference, workshop) với chi phí công ty hỗ trợ [số]%
- Công ty tổ chức đào tạo nội bộ hàng quý: technical sharing, soft skills, leadership
- Thời gian học: [số] giờ/tháng trong giờ làm việc được tính công
- Sau khi hoàn thành khóa học, nhân viên cam kết gắn bó thêm [số] tháng với công ty (nếu chi phí > [ngưỡng])`,
  },
  {
    label: "Đào tạo onboarding + mentorship",
    value: `**Chính sách đào tạo:**
- Chương trình onboarding: [số] tuần với buddy/mentor được chỉ định
- Đào tạo sản phẩm, quy trình nội bộ trong 30 ngày đầu
- Định kỳ review kỹ năng và lập kế hoạch phát triển 6 tháng / năm
- Hỗ trợ chi phí đào tạo theo thỏa thuận riêng khi có nhu cầu cụ thể`,
  },
  {
    label: "Không có chính sách cụ thể",
    value: `**Chính sách đào tạo:**
- Được tham gia các buổi orientation và onboarding do công ty tổ chức
- Được hỗ trợ tiếp cận tài liệu nội bộ, hệ thống e-learning (nếu có)
- Các chương trình đào tạo cụ thể được xem xét và phê duyệt theo từng trường hợp`,
  },
];

// ==================== OTHER BENEFITS TEMPLATES ====================

export const OTHER_BENEFITS_TEMPLATES: TemplateOption[] = [
  {
    label: "Phúc lợi đầy đủ",
    description: "Thưởng, team building, thiết bị...",
    value: `**Các phúc lợi khác:**
- Thưởng tháng 13: [1 tháng lương] vào dịp Tết Nguyên Đán (theo quy chế công ty)
- Thưởng hiệu suất: [số] tháng lương/quý dựa trên KPI, được review mỗi [quý]
- Team building: ngân sách [số] triệu/năm/team
- Laptop/thiết bị: công ty cung cấp [mô tả]
- Sim/điện thoại: hỗ trợ [số] triệu/tháng
- Parking/xăng: hỗ trợ [số] triệu/tháng (nếu làm việc tại văn phòng)
- Bảo hiểm sức khỏe cao cấp: [mô tả chi tiết]
- Quà Tết, sinh nhật, các ngày lễ: theo chính sách công ty`,
  },
  {
    label: "Phúc lợi cơ bản",
    value: `**Các phúc lợi khác:**
- Thưởng tháng 13: [1 tháng lương] vào dịp Tết Nguyên Đán
- Được tham gia các hoạt động team building, company trip do công ty tổ chức
- Đầu năm tài chính: review lương theo hiệu suất và thị trường`,
  },
];

// ==================== TERMINATION CLAUSE TEMPLATES ====================

export const TERMINATION_CLAUSE_TEMPLATES: Record<ContractType, TemplateOption[]> = {
  [ContractType.PROBATION]: [
    {
      label: "Chấm dứt trước hạn",
      value: `**Điều khoản chấm dứt hợp đồng thử việc:**

Trong thời gian thử việc, mỗi bên có quyền đơn phương chấm dứt HĐL thử việc trước thời hạn với điều kiện:

1. **Bên A (Nhà tuyển dụng) chấm dứt:** Phải báo trước ít nhất **03 ngày làm việc** cho Bên B, nêu rõ lý do không đạt yêu cầu thử việc.

2. **Bên B (Người lao động) chấm dứt:** Phải báo trước ít nhất **03 ngày làm việc** cho Bên A.

3. **Thanh lý:** Trong vòng **07 ngày làm việc** kể từ ngày chấm dứt, hai bên tiến hành thanh toán các khoản: lương thử việc tính đến ngày nghỉ, các khoản phụ cấp (nếu có), và hoàn trả tài sản, thiết bị của công ty.

4. **Chứng nhận:** Công ty cấp xác nhận thời gian thử việc cho người lao động khi chấm dứt HĐL.`,
    },
  ],
  [ContractType.FULL_TIME]: [
    {
      label: "Chuẩn BLL 2019",
      value: `**Điều khoản chấm dứt hợp đồng lao động:**

Hai bên thỏa thuận các trường hợp và thời hạn báo trước khi chấm dứt HĐL như sau:

1. **Thời hạn báo trước:** Mỗi bên phải báo trước ít nhất **30 ngày** cho bên kia trước khi đơn phương chấm dứt HĐL (BLL 2019, Điều 35, 36).

2. **Thanh lý HĐL:** Trong vòng **14 ngày làm việc** kể từ ngày chấm dứt HĐL, hai bên tiến hành thanh toán: lương và phụ cấp đến ngày nghỉ việc, BHXH, và các khoản khác (nếu có).

3. **Hoàn trả tài sản:** Người lao động hoàn trả đầy đủ tài sản, thiết bị, tài liệu, thông tin thuộc công ty trong vòng 05 ngày làm việc.

4. **Xác nhận việc làm:** Công ty cấp Sổ BHXH, xác nhận việc làm và các giấy tờ liên quan theo quy định.`,
    },
    {
      label: "Nâng cao (có bồi thường)",
      description: "Thêm điều khoản bồi thường nếu nghỉ sớm",
      value: `**Điều khoản chấm dứt hợp đồng lao động (nâng cao):**

1. **Thời hạn báo trước:** Mỗi bên phải báo trước ít nhất **30 ngày** cho bên kia. Nếu không tuân thủ, bên vi phạm phải bồi thường số ngày thiếu báo trước.

2. **Bồi thường đào tạo:** Nếu người lao động nghỉ việc trong vòng [12] tháng kể từ ngày công ty đài thọ chi phí đào tạo > [ngưỡng] triệu VND, phải hoàn trả [tỷ lệ]% chi phí đào tạo.

3. **Bồi thường thiệt hại:** Người lao động phải bồi thường thiệt hại do vi phạm kỷ luật lao động gây ra theo Điều 125 BLL 2019.

4. **Thanh lý HĐL:** Trong vòng 14 ngày làm việc, thanh toán đầy đủ các khoản: lương, phụ cấp, BHXH, hoàn trả tài sản.

5. **Cam kết hợp tác:** Sau khi nghỉ việc, hai bên cam kết không công khai thông tin bất lợi về nhau.`,
    },
  ],
  [ContractType.PART_TIME]: [
    {
      label: "Chuẩn cho HĐ thời vụ",
      value: `**Điều khoản chấm dứt hợp đồng thời vụ:**

1. **Thời hạn báo trước:** Mỗi bên phải báo trước ít nhất **15 ngày** cho bên kia trước khi đơn phương chấm dứt HĐL (BLL 2019, Điều 35, 36).

2. **Chấm dứt khi hết việc:** Khi công việc đã hoàn thành hoặc không còn nhu cầu, HĐL được chấm dứt mà không cần báo trước, công ty thanh toán đầy đủ lương và phụ cấp.

3. **Thanh lý:** Trong vòng **07 ngày làm việc** kể từ ngày chấm dứt, hai bên thanh toán các khoản còn lại và hoàn trả tài sản.`,
    },
  ],
};

// ==================== CONFIDENTIALITY CLAUSE TEMPLATES ====================

export const CONFIDENTIALITY_CLAUSE_TEMPLATES: TemplateOption[] = [
  {
    label: "Bảo mật thông tin chuẩn",
    value: `**Điều khoản bảo mật thông tin:**

1. **Thông tin mật:** Bao gồm nhưng không giới hạn: bí quyết kinh doanh, chiến lược marketing, thông tin khách hàng, dữ liệu nhân viên, mã nguồn, tài liệu kỹ thuật, thông tin tài chính, hợp đồng với bên thứ ba, và bất kỳ thông tin nào được ghi nhãn "Mật" hoặc "Confidential".

2. **Cam kết của Bên B:**
   - Không tiết lộ, chia sẻ, sao chép hoặc sử dụng thông tin mật cho bất kỳ mục đích nào ngoài phạm vi công việc
   - Bảo vệ thông tin mật với mức độ cẩn trọng tương đương như bảo vệ thông tin riêng
   - Chỉ tiết lộ cho người cần biết (need-to-know) khi được sự đồng ý bằng văn bản của Bên A
   - Không sử dụng VPN/proxy, email cá nhân, hoặc thiết bị không được duyệt để truy cập thông tin mật

3. **Nghĩa vụ khi chấm dứt:** Khi HĐL chấm dứt, Bên B phải hoàn trả tất cả tài liệu, thiết bị chứa thông tin mật và tiếp tục tuân thủ nghĩa vụ bảo mật vô thời hạn.

4. **Vi phạm:** Vi phạm nghĩa vụ bảo mật có thể dẫn đến kỷ luật lao động, bồi thường thiệt hại, và/hoặc truy cứu trách nhiệm pháp lý theo quy định pháp luật.`,
  },
  {
    label: "Bảo mật nâng cao (có bồi thường)",
    value: `**Điều khoản bảo mật thông tin (nâng cao):**

Ngoài các điều khoản bảo mật chuẩn, Bên B cam kết:

1. **Thời gian bảo mật:** Nghĩa vụ bảo mật có hiệu lực trong suốt thời gian làm việc và vô thời hạn sau khi chấm dứt HĐL đối với bí quyết kinh doanh; tối thiểu [2] năm sau khi nghỉ việc đối với các thông tin mật khác.

2. **Phạm vi địa lý:** Cam kết bảo mật có hiệu lực trên toàn lãnh thổ Việt Nam và quốc tế.

3. **Bồi thường vi phạm:** Nếu Bên B vi phạm nghĩa vụ bảo mật, Bên B đồng ý bồi thường tổn thất thực tế và thu nhập bất chính mà Bên A phải gánh chịu, tối thiểu **[số tiền cố định hoặc = X tháng lương]**.

4. **Bảo mật thiết bị:** Chỉ sử dụng thiết bị được công ty cấp phép. Không cài đặt phần mềm không được duyệt (unauthorized software) trên thiết bị công ty.`,
  },
];

// ==================== IP CLAUSE TEMPLATES ====================

export const IP_CLAUSE_TEMPLATES: TemplateOption[] = [
  {
    label: "Sở hữu công ty (chuẩn)",
    value: `**Điều khoản sở hữu trí tuệ:**

1. **Tài sản trí tuệ tạo ra trong công việc:** Mọi sáng chế, phát minh, sáng kiến, cải tiến kỹ thuật, thiết kế, nhãn hiệu, bản quyền, và các quyền sở hữu trí tuệ khác (gọi chung là "Tài sản IP") do Bên B tạo ra trong quá trình thực hiện công việc, trong giờ làm việc, hoặc sử dụng nguồn lực của Bên A đều thuộc quyền sở hữu của Bên A.

2. **Công việc tự nhiên (Off-hours):** Đối với các Tài sản IP được tạo ra ngoài giờ làm việc và không sử dụng tài nguyên của công ty, Bên B phải thông báo bằng văn bản cho Bên A. Bên A có quyền ưu tiên mua lại quyền sử dụng với giá hợp lý trong vòng [30] ngày.

3. **Công cụ và thiết bị:** Mọi công cụ, tài liệu, phần mềm được công ty cấp không được sao chép, chuyển giao cho bên thứ ba.

4. **Chuyển giao quyền:** Khi được yêu cầu, Bên B có nghĩa vụ ký các văn bản cần thiết để hoàn tất việc đăng ký, bảo hộ quyền sở hữu trí tuệ cho Bên A.

5. **Từ bỏ quyền moral:** Bên B đồng ý từ bỏ mọi quyền moral (quyền tác giả về mặt đạo đức) đối với các tác phẩm tạo ra trong phạm vi công việc.`,
  },
  {
    label: "Có đền bù cho IP ngoài công việc",
    value: `**Điều khoản sở hữu trí tuệ (có đền bù):**

1. **Tài sản IP trong công việc:** Mọi Tài sản IP do Bên B tạo ra trong quá trình thực hiện công việc hoặc sử dụng nguồn lực của Bên A đều thuộc quyền sở hữu của Bên A.

2. **Tài sản IP ngoài công việc:** Đối với Tài sản IP được tạo ra hoàn toàn ngoài giờ làm việc, không sử dụng tài nguyên công ty, Bên B giữ quyền sở hữu. Tuy nhiên, nếu Bên A muốn mua lại quyền sử dụng hoặc sở hữu, hai bên sẽ đàm phán riêng với mức đền bù công bằng.

3. **Đền bù:** Nếu Bên B phải dành thời gian làm việc để phát triển IP cho Bên A ngoài công việc thường ngày, hai bên sẽ thỏa thuận đền bù riêng bằng văn bản.

4. **Chuyển giao quyền:** Khi được yêu cầu, Bên B ký các văn bản chuyển giao quyền sở hữu IP cho Bên A.`,
  },
];

// ==================== BONUS POLICY TEMPLATES ====================

export const BONUS_POLICY_TEMPLATES: TemplateOption[] = [
  {
    label: "Thưởng tháng 13 + hiệu suất",
    value: `**Chính sách thưởng:**

- **Thưởng tháng 13 (Tết Nguyên Đán):** Tối thiểu 01 tháng lương cơ bản, phụ thuộc vào thời gian làm việc trong năm và hiệu suất. Thưởng được trả vào dịp Tết Nguyên Đán hoặc cuối năm tài chính.

- **Thưởng hiệu suất (Performance Bonus):** [số] tháng lương/quý hoặc [% doanh số / giá trị dự án], dựa trên KPI và đánh giá hiệu suất. Được review và chi trả mỗi [quý / nửa năm].

- **Điều kiện nhận thưởng:** Nhân viên phải đang trong quá trình làm việc (không trong giai đoạn nghỉ việc) tại thời điểm chi trả thưởng.

- **Trường hợp nghỉ giữa năm:** Thưởng tháng 13 được tính theo tỷ lệ tháng làm việc thực tế trong năm.`,
  },
  {
    label: "Thưởng theo KPIs",
    description: "Mức thưởng gắn chặt chẽ với KPI cá nhân",
    value: `**Chính sách thưởng theo KPIs:**

- **Thưởng theo KPIs:** Mức thưởng dao động từ **[X]% đến [Y]%** lương năm, phụ thuộc vào mức độ hoàn thành KPIs:
  - ≥ 100% KPIs: Thưởng **[mức tối đa]**
  - 80-99% KPIs: Thưởng **[mức tương ứng theo tỷ lệ]**
  - < 80% KPIs: Thưởng **[mức tối thiểu / không có thưởng]**

- **KPIs được xác định:** Vào đầu mỗi [quý / năm], line manager và nhân viên thống nhất KPIs cá nhân. KPIs bao gồm cả chỉ tiêu số lượng (quantity), chất lượng (quality), và timeline.

- **Review KPIs:** Được review giữa kỳ và cuối kỳ, có feedback hai chiều.

- **Thưởng Tết:** Thưởng tháng 13 tính riêng, không ảnh hưởng bởi KPIs.`,
  },
];

// ==================== ALLOWANCE PRESETS ====================

export interface AllowancePreset {
  label: string;
  description?: string;
  mealAllowance?: number;
  transportAllowance?: number;
  housingAllowance?: number;
}

export const ALLOWANCE_PRESETS: Record<ContractType, AllowancePreset[]> = {
  [ContractType.PROBATION]: [
    {
      label: "Không có phụ cấp",
      description: "Thử việc chỉ có lương",
      mealAllowance: 0,
      transportAllowance: 0,
      housingAllowance: 0,
    },
  ],
  [ContractType.FULL_TIME]: [
    {
      label: "Phúc lợi tiêu chuẩn",
      description: "Có đầy đủ 3 loại phụ cấp phổ biến",
      mealAllowance: 730000,
      transportAllowance: 500000,
      housingAllowance: 0,
    },
    {
      label: "Có hỗ trợ nhà ở",
      description: "Thêm hỗ trợ nhà ở cho nhân viên tỉnh ngoài",
      mealAllowance: 730000,
      transportAllowance: 500000,
      housingAllowance: 1500000,
    },
    {
      label: "Không có phụ cấp",
      description: "Chỉ lương, không phụ cấp",
      mealAllowance: 0,
      transportAllowance: 0,
      housingAllowance: 0,
    },
  ],
  [ContractType.PART_TIME]: [
    {
      label: "Không có phụ cấp",
      description: "Hợp đồng thời vụ không có phụ cấp",
      mealAllowance: 0,
      transportAllowance: 0,
      housingAllowance: 0,
    },
  ],
};

// ==================== LEGAL TEXT TEMPLATES ====================

export const LEGAL_TEXT_TEMPLATES: TemplateOption[] = [
  {
    label: "Điều khoản bổ sung tùy chỉnh",
    value: ``,
  },
  {
    label: "Cam kết làm việc lâu dài",
    value: `**Các điều khoản bổ sung:**

1. **Cam kết thời gian làm việc:** Bên B cam kết gắn bó làm việc tại Bên A tối thiểu **[số tháng / năm]** kể từ ngày ký HĐL. Nếu Bên B đơn phương chấm dứt HĐL trước thời hạn cam kết mà không có lý do chính đáng, Bên B đồng ý bồi thường **[số tiền]** cho Bên A để bù đắp chi phí tuyển dụng và đào tạo.

2. **Xung đột lợi ích:** Bên B cam kết không làm việc cho tổ chức/cá nhân cạnh tranh trực tiếp với Bên A trong thời gian làm việc. Làm thêm cho bên thứ ba (freelance, part-time) cần được sự đồng ý bằng văn bản của Bên A.

3. **Hành vi không phù hợp:** Bên B cam kết tuân thủ Quy chế văn hóa doanh nghiệp, Quy định về đạo đức nghề nghiệp, và Quy tắc ứng xử của Bên A. Vi phạm nghiêm trọng có thể dẫn đến kỷ luật lao động hoặc chấm dứt HĐL ngay lập tức mà không cần báo trước.`,
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Append a template block to existing field value.
 * Used by ContractForm's "Chèn mẫu" functionality.
 */
export function appendTemplate(
  currentValue: string,
  template: string,
): string {
  const trimmed = currentValue.trim();
  return trimmed ? `${trimmed}\n\n${template}` : template;
}

/**
 * Replace a field value with a template.
 */
export function replaceWithTemplate(_currentValue: string, template: string): string {
  return template;
}

/**
 * Get recommended probation salary based on full salary and contract type.
 */
export function getRecommendedProbationSalary(
  fullSalary: number,
  contractType: ContractType,
): number {
  const defaults = CONTRACT_TYPE_DEFAULTS[contractType];
  if (defaults.probationSalaryPercent) {
    return Math.round(fullSalary * defaults.probationSalaryPercent / 100 / 1000) * 1000;
  }
  return fullSalary;
}
