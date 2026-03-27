/**
 * TypeScript types for Guided Journey feature
 * Simplified version focused on AI Assessment Test generation
 */

// ==================== Enums ====================

export enum JourneyType {
  CAREER = 'CAREER',  // Assessment for career/job role
  SKILL = 'SKILL'      // Assessment for specific skill(s)
}

export enum JourneyStatus {
  NOT_STARTED = 'NOT_STARTED',
  ASSESSMENT_PENDING = 'ASSESSMENT_PENDING',
  TEST_IN_PROGRESS = 'TEST_IN_PROGRESS',
  TEST_COMPLETED = 'TEST_COMPLETED',
  EVALUATION_PENDING = 'EVALUATION_PENDING',
  ROADMAP_GENERATING = 'ROADMAP_GENERATING',
  ROADMAP_READY = 'ROADMAP_READY',
  STUDY_PLANS_READY = 'STUDY_PLANS_READY',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  ELEMENTARY = 'ELEMENTARY',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum TestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED'
}

// ==================== Domain Options (12 Domains from Expert Prompt) ====================

export const DOMAIN_OPTIONS = [
  { value: 'IT', label: 'Công nghệ thông tin', icon: '💻', description: 'Lập trình, phát triển phần mềm' },
  { value: 'DESIGN', label: 'Thiết kế', icon: '🎨', description: 'UI/UX, đồ họa, sáng tạo' },
  { value: 'BUSINESS', label: 'Kinh doanh', icon: '📈', description: 'Marketing, bán hàng, tài chính' },
  { value: 'ENGINEERING', label: 'Kỹ thuật', icon: '⚙️', description: 'Cơ khí, điện, xây dựng' },
  { value: 'HEALTHCARE', label: 'Y tế & Sức khỏe', icon: '🏥', description: 'Y khoa, dược, chăm sóc sức khỏe' },
  { value: 'EDUCATION', label: 'Giáo dục', icon: '📚', description: 'Giảng dạy, đào tạo, edtech' },
  { value: 'LOGISTICS', label: 'Logistics & Chuỗi cung ứng', icon: '🚚', description: 'Vận tải, kho bãi, chain' },
  { value: 'LEGAL', label: 'Pháp luật', icon: '⚖️', description: 'Tư pháp, doanh nghiệp, sở hữu trí tuệ' },
  { value: 'ARTS', label: 'Nghệ thuật & Sáng tạo', icon: '🎭', description: 'Nhiếp ảnh, video, 3D, illustration' },
  { value: 'SERVICE', label: 'Dịch vụ', icon: '🤝', description: 'Khách sạn, nhà hàng, event' },
  { value: 'SOCIALCOMMUNITY', label: 'Cộng đồng & Xã hội', icon: '🌍', description: 'Phi lợi nhuận, truyền thông' },
  { value: 'AGRICULTUREENVIRONMENT', label: 'Nông nghiệp & Môi trường', icon: '🌱', description: 'Nông nghiệp, sustainability' }
] as const;

export type DomainType = typeof DOMAIN_OPTIONS[number]['value'];

// ==================== Sub-categories by Domain ====================

export const SUB_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  IT: [
    { value: 'WEB_DEV', label: 'Phát triển Web' },
    { value: 'MOBILE_APP', label: 'Phát triển Mobile' },
    { value: 'DATA_SCIENCE', label: 'Khoa học dữ liệu' },
    { value: 'CLOUD_DEVOPS', label: 'Cloud & DevOps' },
    { value: 'AI_ML', label: 'AI & Machine Learning' },
    { value: 'GAME_DEV', label: 'Phát triển Game' },
    { value: 'CYBERSECURITY', label: 'An ninh mạng' },
    { value: 'EMBEDDED', label: 'Hệ thống nhúng' }
  ],
  DESIGN: [
    { value: 'UI_DESIGN', label: 'Thiết kế UI' },
    { value: 'UX_DESIGN', label: 'Thiết kế UX' },
    { value: 'PRODUCT_DESIGN', label: 'Thiết kế sản phẩm' },
    { value: 'GRAPHIC_DESIGN', label: 'Thiết kế đồ họa' },
    { value: 'MOTION_DESIGN', label: 'Motion Design' },
    { value: 'BRAND_DESIGN', label: 'Thiết kế thương hiệu' },
    { value: '3D_MODELING', label: 'Mô hình 3D' },
    { value: 'ILLUSTRATION', label: 'Minh họa' }
  ],
  BUSINESS: [
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'SALES', label: 'Kinh doanh & Sales' },
    { value: 'PROJECT_MANAGEMENT', label: 'Quản lý dự án' },
    { value: 'BUSINESS_ANALYTICS', label: 'Phân tích kinh doanh' },
    { value: 'PRODUCT_MANAGEMENT', label: 'Quản lý sản phẩm' },
    { value: 'FINANCE', label: 'Tài chính & Kế toán' },
    { value: 'ENTREPRENEURSHIP', label: 'Khởi nghiệp' },
    { value: 'CONSULTING', label: 'Tư vấn' }
  ],
  ENGINEERING: [
    { value: 'MECHANICAL', label: 'Kỹ thuật cơ khí' },
    { value: 'ELECTRICAL', label: 'Kỹ thuật điện' },
    { value: 'CIVIL', label: 'Kỹ thuật xây dựng' },
    { value: 'CHEMICAL', label: 'Kỹ thuật hóa học' },
    { value: 'INDUSTRIAL', label: 'Kỹ thuật công nghiệp' },
    { value: 'AUTOMOTIVE', label: 'Kỹ thuật ô tô' },
    { value: 'AEROSPACE', label: 'Kỹ thuật hàng không' },
    { value: 'ENVIRONMENTAL', label: 'Kỹ thuật môi trường' }
  ],
  HEALTHCARE: [
    { value: 'CLINICAL', label: 'Y khoa lâm sàng' },
    { value: 'NURSING', label: 'Điều dưỡng' },
    { value: 'PHARMACY', label: 'Dược phẩm' },
    { value: 'MEDICAL_TECH', label: 'Công nghệ y tế' },
    { value: 'PUBLIC_HEALTH', label: 'Y tế công cộng' },
    { value: 'MENTAL_HEALTH', label: 'Sức khỏe tâm thần' },
    { value: 'ALLIED_HEALTH', label: 'Y tế chuyên ngành' },
    { value: 'HEALTHCARE_MGMT', label: 'Quản lý y tế' }
  ],
  EDUCATION: [
    { value: 'K12_EDUCATION', label: 'Giáo dục K-12' },
    { value: 'HIGHER_ED', label: 'Giáo dục đại học' },
    { value: 'LANGUAGE', label: 'Giáo dục ngôn ngữ' },
    { value: 'ONLINE_LEARNING', label: 'E-Learning' },
    { value: 'CORPORATE_TRAINING', label: 'Đào tạo doanh nghiệp' },
    { value: 'EDTECH', label: 'Công nghệ giáo dục' },
    { value: 'INSTRUCTIONAL', label: 'Thiết kế đào tạo' },
    { value: 'TUTORING', label: 'Gia sư' }
  ],
  LOGISTICS: [
    { value: 'SUPPLY_CHAIN', label: 'Quản lý chuỗi cung ứng' },
    { value: 'WAREHOUSE', label: 'Quản lý kho bãi' },
    { value: 'TRANSPORT', label: 'Vận tải & Logistics' },
    { value: 'PROCUREMENT', label: 'Mua hàng & Sourcing' },
    { value: 'INVENTORY', label: 'Quản lý hàng tồn' },
    { value: 'CUSTOM', label: 'Hải quan' },
    { value: 'LAST_MILE', label: 'Giao hàng cuối mile' },
    { value: 'FREIGHT', label: 'Vận chuyển quốc tế' }
  ],
  LEGAL: [
    { value: 'CORPORATE_LAW', label: 'Luật doanh nghiệp' },
    { value: 'IP_LAW', label: 'Sở hữu trí tuệ' },
    { value: 'LABOR_LAW', label: 'Luật lao động' },
    { value: 'TAX_LAW', label: 'Luật thuế' },
    { value: 'COMMERCIAL_LAW', label: 'Luật thương mại' },
    { value: 'COMPLIANCE', label: 'Tuân thủ pháp luật' },
    { value: 'LITIGATION', label: 'Tranh tụng' },
    { value: 'LEGAL_CONSULT', label: 'Tư vấn pháp luật' }
  ],
  ARTS: [
    { value: 'PHOTOGRAPHY', label: 'Nhiếp ảnh' },
    { value: 'VIDEO_PROD', label: 'Sản xuất video' },
    { value: 'MUSIC_AUDIO', label: 'Âm nhạc & Audio' },
    { value: 'FILM_MAKING', label: 'Làm phim' },
    { value: 'PERFORMING', label: 'Nghệ thuật biểu diễn' },
    { value: 'FINE_ARTS', label: 'Mỹ thuật' },
    { value: 'CREATIVE_WRITING', label: 'Sáng tạo nội dung' },
    { value: 'ART_DIRECTION', label: 'Chỉ đạo nghệ thuật' }
  ],
  SERVICE: [
    { value: 'HOSPITALITY', label: 'Khách sạn & Lưu trú' },
    { value: 'FOOD_BEV', label: 'Nhà hàng & F&B' },
    { value: 'TRAVEL_TOURISM', label: 'Du lịch & Lữ hành' },
    { value: 'EVENTS', label: 'Tổ chức sự kiện' },
    { value: 'CUSTOMER_SERVICE', label: 'Dịch vụ khách hàng' },
    { value: 'HR_SERVICE', label: 'Dịch vụ nhân sự' },
    { value: 'CONSULTING_SVC', label: 'Dịch vụ tư vấn' },
    { value: 'MAINTENANCE', label: 'Bảo trì & Sửa chữa' }
  ],
  SOCIALCOMMUNITY: [
    { value: 'COMMUNITY_MGR', label: 'Quản lý cộng đồng' },
    { value: 'SOCIAL_MEDIA_MGR', label: 'Quản lý mạng xã hội' },
    { value: 'CONTENT_CREATOR', label: 'Sáng tạo nội dung' },
    { value: 'NGO_MGMT', label: 'Quản lý NGO' },
    { value: 'VOLUNTEER_MGMT', label: 'Quản lý tình nguyện' },
    { value: 'FUNDRAISING', label: 'Huy động nguồn lực' },
    { value: 'PUBLIC_RELATIONS', label: 'Truyền thông' },
    { value: 'ADVOCACY', label: 'Vận động chính sách' }
  ],
  AGRICULTUREENVIRONMENT: [
    { value: 'AGRI_PRODUCTION', label: 'Sản xuất nông nghiệp' },
    { value: 'AGRI_TECH', label: 'Công nghệ nông nghiệp' },
    { value: 'ANIMAL_HUSBANDRY', label: 'Chăn nuôi' },
    { value: 'ENV_ENG', label: 'Kỹ thuật môi trường' },
    { value: 'SUSTAINABILITY', label: 'Phát triển bền vững' },
    { value: 'RENEWABLE_ENERGY', label: 'Năng lượng tái tạo' },
    { value: 'WASTE_MGMT', label: 'Quản lý chất thải' },
    { value: 'WATER_RESOURCES', label: 'Tài nguyên nước' }
  ]
};

// ==================== Jobs by Domain ====================

export const JOBS_BY_DOMAIN: Record<string, { value: string; label: string; icon: string; desc?: string }[]> = {
  IT: [
    { value: 'FRONTEND', label: 'Frontend Developer', icon: '🎨', desc: 'Phát triển giao diện web' },
    { value: 'BACKEND', label: 'Backend Developer', icon: '⚙️', desc: 'Xây dựng hệ thống server' },
    { value: 'FULLSTACK', label: 'Full-stack Developer', icon: '🚀', desc: 'Phát triển web toàn diện' },
    { value: 'DATA_ANALYST', label: 'Data Analyst', icon: '📊', desc: 'Phân tích dữ liệu' },
    { value: 'DATA_ENGINEER', label: 'Data Engineer', icon: '🗄️', desc: 'Xây dựng hạ tầng dữ liệu' },
    { value: 'DEVOPS', label: 'DevOps Engineer', icon: '🔧', desc: 'Tự động hóa triển khai' },
    { value: 'ML_AI', label: 'ML/AI Engineer', icon: '🤖', desc: 'Trí tuệ nhân tạo & ML' },
    { value: 'MOBILE', label: 'Mobile Developer', icon: '📱', desc: 'Phát triển ứng dụng di động' },
    { value: 'QA', label: 'QA Engineer', icon: '✅', desc: 'Kiểm thử & đảm bảo chất lượng' },
    { value: 'TECH_LEAD', label: 'Tech Lead', icon: '👑', desc: 'Kỹ sư trưởng' }
  ],
  DESIGN: [
    { value: 'UI_DESIGNER', label: 'UI Designer', icon: '🎯', desc: 'Thiết kế giao diện người dùng' },
    { value: 'UX_DESIGNER', label: 'UX Designer', icon: '💡', desc: 'Trải nghiệm người dùng' },
    { value: 'PRODUCT_DESIGNER', label: 'Product Designer', icon: '📦', desc: 'Thiết kế sản phẩm' },
    { value: 'GRAPHIC_DESIGNER', label: 'Graphic Designer', icon: '🎭', desc: 'Thiết kế đồ họa' },
    { value: 'MOTION_DESIGNER', label: 'Motion Designer', icon: '🎬', desc: 'Thiết kế chuyển động' },
    { value: 'BRAND_DESIGNER', label: 'Brand Designer', icon: '🏷️', desc: 'Thiết kế thương hiệu' }
  ],
  BUSINESS: [
    { value: 'DIGITAL_MARKETING', label: 'Digital Marketing', icon: '📢', desc: 'Marketing kỹ thuật số' },
    { value: 'SALES', label: 'Sales', icon: '💰', desc: 'Kinh doanh & bán hàng' },
    { value: 'BUSINESS_ANALYST', label: 'Business Analyst', icon: '📈', desc: 'Phân tích kinh doanh' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager', icon: '📋', desc: 'Quản lý dự án' },
    { value: 'PRODUCT_MANAGER', label: 'Product Manager', icon: '🎪', desc: 'Quản lý sản phẩm' },
    { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst', icon: '💵', desc: 'Phân tích tài chính' }
  ],
  ENGINEERING: [
    { value: 'MECHANICAL', label: 'Mechanical Engineer', icon: '⚙️', desc: 'Kỹ sư cơ khí' },
    { value: 'ELECTRICAL', label: 'Electrical Engineer', icon: '⚡', desc: 'Kỹ sư điện' },
    { value: 'CIVIL', label: 'Civil Engineer', icon: '🏗️', desc: 'Kỹ sư xây dựng' },
    { value: 'QA_ENGINEERING', label: 'QA Engineer', icon: '🔍', desc: 'Kiểm thử kỹ thuật' }
  ],
  HEALTHCARE: [
    { value: 'CLINICAL', label: 'Clinical Staff', icon: '🩺', desc: 'Nhân viên lâm sàng' },
    { value: 'PHARMACY', label: 'Pharmacy', icon: '💊', desc: 'Dược phẩm' },
    { value: 'HEALTHCARE_MANAGEMENT', label: 'Healthcare Management', icon: '🏥', desc: 'Quản lý y tế' },
    { value: 'MEDICAL_TECH', label: 'Medical Technology', icon: '🔬', desc: 'Công nghệ y tế' }
  ],
  EDUCATION: [
    { value: 'TEACHER', label: 'Teacher', icon: '🍎', desc: 'Giáo viên' },
    { value: 'INSTRUCTIONAL_DESIGNER', label: 'Instructional Designer', icon: '📖', desc: 'Thiết kế giáo trình' },
    { value: 'EDTECH_SPECIALIST', label: 'EdTech Specialist', icon: '💻', desc: 'Chuyên viên EdTech' },
    { value: 'TUTOR', label: 'Tutor', icon: '🎓', desc: 'Gia sư' }
  ],
  LOGISTICS: [
    { value: 'SUPPLY_CHAIN', label: 'Supply Chain Manager', icon: '🔗', desc: 'Quản lý chuỗi cung ứng' },
    { value: 'WAREHOUSE', label: 'Warehouse Manager', icon: '🏭', desc: 'Quản lý kho hàng' },
    { value: 'TRANSPORT', label: 'Transport Manager', icon: '🚚', desc: 'Quản lý vận tải' },
    { value: 'LOGISTICS_ANALYST', label: 'Logistics Analyst', icon: '📦', desc: 'Phân tích logistics' }
  ],
  LEGAL: [
    { value: 'CORPORATE_LAW', label: 'Corporate Lawyer', icon: '⚖️', desc: 'Luật doanh nghiệp' },
    { value: 'IP_LAW', label: 'IP Lawyer', icon: '💎', desc: 'Luật sở hữu trí tuệ' },
    { value: 'LEGAL_CONSULTANT', label: 'Legal Consultant', icon: '📜', desc: 'Tư vấn pháp luật' },
    { value: 'COMPLIANCE', label: 'Compliance Officer', icon: '✅', desc: 'Nhân viên tuân thủ' }
  ],
  ARTS: [
    { value: 'PHOTOGRAPHER', label: 'Photographer', icon: '📷', desc: 'Nhiếp ảnh gia' },
    { value: 'VIDEOGRAPHER', label: 'Videographer', icon: '🎥', desc: ' Quay phim' },
    { value: '3D_ARTIST', label: '3D Artist', icon: '🎲', desc: 'Nghệ sĩ 3D' },
    { value: 'ILLUSTRATOR', label: 'Illustrator', icon: '✏️', desc: 'Họa sĩ minh họa' }
  ],
  SERVICE: [
    { value: 'HOTEL_MANAGEMENT', label: 'Hotel Management', icon: '🏨', desc: 'Quản lý khách sạn' },
    { value: 'EVENT_PLANNER', label: 'Event Planner', icon: '🎉', desc: 'Nhân sự sự kiện' },
    { value: 'CUSTOMER_SERVICE', label: 'Customer Service', icon: '👥', desc: 'Dịch vụ khách hàng' },
    { value: 'F&B_MANAGER', label: 'F&B Manager', icon: '🍽️', desc: 'Quản lý F&B' }
  ],
  SOCIALCOMMUNITY: [
    { value: 'COMMUNITY_MANAGER', label: 'Community Manager', icon: '🌐', desc: 'Quản lý cộng đồng' },
    { value: 'SOCIAL_MEDIA', label: 'Social Media Manager', icon: '📱', desc: 'Quản lý mạng xã hội' },
    { value: 'NGO_MANAGER', label: 'NGO Manager', icon: '🤝', desc: 'Quản lý tổ chức phi lợi nhuận' },
    { value: 'VOLUNTEER_COORD', label: 'Volunteer Coordinator', icon: '🙋', desc: 'Điều phối tình nguyện' }
  ],
  AGRICULTUREENVIRONMENT: [
    { value: 'AGRICULTURE_SPECIALIST', label: 'Agriculture Specialist', icon: '🌾', desc: 'Chuyên gia nông nghiệp' },
    { value: 'ENVIRONMENTAL_ENG', label: 'Environmental Engineer', icon: '🌿', desc: 'Kỹ sư môi trường' },
    { value: 'SUSTAINABILITY', label: 'Sustainability Manager', icon: '♻️', desc: 'Quản lý bền vững' }
  ]
};

// ==================== Goal Options ====================

export const GOAL_OPTIONS = [
  { value: 'EXPLORE', label: 'Khám phá trình độ hiện tại', icon: '🔍' },
  { value: 'INTERNSHIP', label: 'Chuẩn bị internship / fresher job', icon: '💼' },
  { value: 'CAREER_CHANGE', label: 'Chuyển ngành', icon: '🔄' },
  { value: 'FROM_SCRATCH', label: 'Xây lộ trình học từ đầu', icon: '📚' },
  { value: 'REVIEW', label: 'Ôn lại kiến thức', icon: '复习' }
] as const;

export type GoalType = typeof GOAL_OPTIONS[number]['value'];

// ==================== Level Options ====================

export const LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Mới bắt đầu, chưa có kinh nghiệm' },
  { value: 'ELEMENTARY', label: 'Elementary', description: 'Có kiến thức cơ bản' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Làm được dự án thực tế' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Xử lý được công việc phức tạp' }
] as const;

export type LevelType = typeof LEVEL_OPTIONS[number]['value'];

// ==================== Focus Area Options ====================

export const FOCUS_AREA_OPTIONS = [
  { value: 'FUNDAMENTALS', label: 'Kiến thức cơ bản', icon: '📖' },
  { value: 'PROBLEM_SOLVING', label: 'Giải bài tập', icon: '🧩' },
  { value: 'PRACTICAL_CODING', label: 'Lập trình thực hành', icon: '💻' },
  { value: 'JOB_READINESS', label: 'Chuẩn bị đi làm', icon: '🎯' },
  { value: 'TECHNICAL_ENGLISH', label: 'Tiếng Anh chuyên ngành', icon: '🇬🇧' }
] as const;

export type FocusAreaType = typeof FOCUS_AREA_OPTIONS[number]['value'];

// ==================== Language Options ====================

export const LANGUAGE_OPTIONS = [
  { value: 'VI', label: 'Tiếng Việt' },
  { value: 'EN', label: 'English' },
  { value: 'BILINGUAL', label: 'Song ngữ' }
] as const;

export type LanguageType = typeof LANGUAGE_OPTIONS[number]['value'];

// ==================== Duration Options ====================

export const DURATION_OPTIONS = [
  { value: 'QUICK', label: 'Nhanh', description: '5 phút', icon: '⚡' },
  { value: 'STANDARD', label: 'Tiêu chuẩn', description: '10-15 phút', icon: '⏱️' },
  { value: 'DEEP', label: 'Chi tiết', description: '20-30 phút', icon: '📝' }
] as const;

export type DurationType = typeof DURATION_OPTIONS[number]['value'];

// ==================== Skills by Domain ====================

export const SKILLS_BY_DOMAIN: Record<string, string[]> = {
  FRONTEND: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Next.js', 'Tailwind CSS', 'Responsive Design'],
  BACKEND: ['Java', 'Spring Boot', 'Python', 'Django', 'Node.js', 'Express', 'REST API', 'SQL', 'NoSQL', 'Git', 'Docker'],
  FULLSTACK: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'NoSQL', 'Git', 'Docker', 'AWS'],
  DATA_ANALYSIS: ['Python', 'SQL', 'Excel', 'Tableau', 'Power BI', 'Pandas', 'NumPy', 'Statistics', 'Data Visualization'],
  UI_UX: ['Figma', 'Sketch', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Research', 'UX Writing', 'Design Systems'],
  DIGITAL_MARKETING: ['SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Email Marketing', 'Analytics', 'Social Media'],
  PRODUCT_MANAGEMENT: ['Product Strategy', 'User Stories', 'Agile/Scrum', 'Roadmapping', 'A/B Testing', 'Analytics']
};

// ==================== Request Types ====================

/**
 * Request to start a new guided journey with minimal assessment info
 * Used for generating AI assessment test
 */
export interface StartJourneyRequest {
  // Type of journey: career (job role) or skill (custom skill)
  type: JourneyType;

  // Required fields for both types
  domain: string;
  goal: string;
  level: string;

  // For career type: sub-category (detailed field within domain)
  subCategory?: string;

  // For career type: specific job role
  jobRole?: string;

  // Optional fields
  skills?: string[];
  focusAreas?: string[];
  language?: string;
  duration?: string;
}

/**
 * Request to submit test answers
 */
export interface SubmitTestRequest {
  testId: number;
  answers: Record<number, string>; // questionId -> answer
  timeSpentSeconds?: number;
}

// ==================== Response Types ====================

/**
 * Summary of a journey (for list view)
 */
export interface JourneySummaryResponse {
  id: number;
  domain: string;
  goal: string;
  status: JourneyStatus;
  currentLevel?: SkillLevel;
  progressPercentage: number;
  aiSummaryReport?: string;
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  createdAt?: string;

  // Related entities
  roadmapSessionId?: number;
  totalNodesCompleted?: number;
  latestTestResult?: {
    resultId?: number;
    scorePercentage: number;
    evaluatedLevel: SkillLevel;
    skillGapsCount: number;
    strengthsCount: number;
    evaluatedAt?: string;
  };
  milestones?: {
    milestone: string;
    isCompleted: boolean;
    completedAt: string;
  }[];

  // Assessment test info
  assessmentTestId?: number;
  assessmentTestTitle?: string;
  assessmentTestQuestionCount?: number;
  assessmentTestStatus?: string;
  assessmentAttemptCount?: number;
  maxAssessmentAttempts?: number;
  remainingAssessmentRetakes?: number;
}

/**
 * Assessment test question
 */
export interface AssessmentQuestion {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer?: string; // Only included in response if not submitted yet
  explanation?: string;
  difficulty: string;
  skillArea: string;
}

/**
 * Assessment test response
 */
export interface AssessmentTestResponse {
  id: number;
  journeyId: number;
  title: string;
  targetField: string;
  domain: string;
  industry: string;
  role: string;
  questions: AssessmentQuestion[];
  status: TestStatus;
  totalQuestions: number;
  passingScore: number;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

/**
 * Generated test response (includes AI-generated content)
 */
export interface GenerateTestResponse {
  test: AssessmentTestResponse;
  message: string;
  estimatedTimeMinutes: number;
}

/**
 * Skill gap or strength analysis
 */
export interface SkillAnalysis {
  skillName: string;
  currentLevel: SkillLevel;
  targetLevel?: SkillLevel;
  gap: number; // -1 to 1, negative means below target
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface QuestionReviewItem {
  questionId: number;
  question: string;
  skillArea: string;
  difficulty: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Test result/evaluation response
 */
export interface TestResultResponse {
  id: number;
  journeyId: number;
  testId: number;
  score: number;
  evaluatedLevel: SkillLevel;
  scoreBand: string;
  scoreBandLabel: string;
  recommendationMode: string;
  recommendationLabel: string;
  assessmentConfidence: number;
  reassessmentRecommended: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  passingScore: number;
  passed: boolean;

  // Detailed analysis
  skillAnalysis: SkillAnalysis[];
  questionReviews: QuestionReviewItem[];
  overallStrengths: string[];
  overallWeaknesses: string[];
  skillGaps: string[];

  // AI-generated feedback
  evaluationSummary: string;
  detailedFeedback: string;
  improvementTips: string[];

  createdAt: string;
}

/**
 * Journey with full details
 */
export interface JourneyDetailResponse extends JourneySummaryResponse {
  // User profile info
  experienceLevel: string;
  learningStyle: string;
  hoursPerWeek?: number;
  learningMotivation?: string;
  educationBackground?: string;
  existingSkills?: string[];
  familiarTools?: string[];

  // Detailed goals
  shortTermGoal?: string;
  midTermGoal?: string;
  longTermGoal?: string;

  // Challenges
  currentChallenges?: string[];
  biggestFrustration?: string;

  // Test details
  assessmentTest?: AssessmentTestResponse;
  testResult?: TestResultResponse;

  // Roadmap info
  roadmapSessionId?: number;
  studyPlans?: Record<string, unknown>[];
}

// ==================== Progress Types ====================

export enum MilestoneType {
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  TEST_COMPLETED = 'TEST_COMPLETED',
  EVALUATION_COMPLETED = 'EVALUATION_COMPLETED',
  ROADMAP_GENERATED = 'ROADMAP_GENERATED',
  FIRST_NODE_COMPLETED = 'FIRST_NODE_COMPLETED',
  HALFWAY_COMPLETED = 'HALFWAY_COMPLETED',
  ALL_PLANS_CREATED = 'ALL_PLANS_CREATED',
  JOURNEY_COMPLETED = 'JOURNEY_COMPLETED'
}

/**
 * Journey progress tracking
 */
export interface JourneyProgressResponse {
  journeyId: number;
  completedNodes: number;
  totalNodes: number;
  progressPercentage: number;
  currentNode?: string;
  milestones: MilestoneType[];
  lastActivityAt: string;
  streakDays?: number;
}
