/**
 * TypeScript types for Guided Journey feature
 * Simplified version focused on AI Assessment Test generation
 */

// ==================== Enums ====================

export enum JourneyType {
  CAREER = "CAREER", // Assessment for career/job role
  SKILL = "SKILL", // Assessment for specific skill(s)
}

export enum JourneyStatus {
  NOT_STARTED = "NOT_STARTED",
  ASSESSMENT_PENDING = "ASSESSMENT_PENDING",
  TEST_IN_PROGRESS = "TEST_IN_PROGRESS",
  TEST_COMPLETED = "TEST_COMPLETED",
  EVALUATION_PENDING = "EVALUATION_PENDING",
  ROADMAP_GENERATING = "ROADMAP_GENERATING",
  ROADMAP_READY = "ROADMAP_READY",
  STUDY_PLANS_READY = "STUDY_PLANS_READY",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum SkillLevel {
  BEGINNER = "BEGINNER",
  ELEMENTARY = "ELEMENTARY",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum TestStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

// ==================== Domain Options (12 Domains from Expert Prompt) ====================

export const DOMAIN_OPTIONS = [
  {
    value: "IT",
    label: "Công nghệ thông tin",
    icon: "💻",
    description: "Lập trình, phát triển phần mềm",
  },
  {
    value: "DESIGN",
    label: "Thiết kế",
    icon: "🎨",
    description: "UI/UX, đồ họa, sáng tạo",
  },
  {
    value: "BUSINESS",
    label: "Kinh doanh",
    icon: "📈",
    description: "Marketing, bán hàng, tài chính",
  },
] as const;

export type DomainType = (typeof DOMAIN_OPTIONS)[number]["value"];

// ==================== Sub-categories by Domain ====================

export const SUB_CATEGORIES: Record<
  string,
  { value: string; label: string }[]
> = {
  IT: [
    { value: "WEB_DEV", label: "Phát triển Web" },
    { value: "MOBILE_APP", label: "Phát triển Mobile" },
    { value: "DATA_SCIENCE", label: "Khoa học dữ liệu" },
    { value: "CLOUD_DEVOPS", label: "Cloud & DevOps" },
    { value: "AI_ML", label: "AI & Machine Learning" },
    { value: "GAME_DEV", label: "Phát triển Game" },
    { value: "CYBERSECURITY", label: "An ninh mạng" },
    { value: "EMBEDDED", label: "Hệ thống nhúng" },
  ],
  DESIGN: [
    { value: "UI_DESIGN", label: "Thiết kế UI" },
    { value: "UX_DESIGN", label: "Thiết kế UX" },
    { value: "PRODUCT_DESIGN", label: "Thiết kế sản phẩm" },
    { value: "GRAPHIC_DESIGN", label: "Thiết kế đồ họa" },
    { value: "MOTION_DESIGN", label: "Motion Design" },
    { value: "BRAND_DESIGN", label: "Thiết kế thương hiệu" },
    { value: "3D_MODELING", label: "Mô hình 3D" },
    { value: "ILLUSTRATION", label: "Minh họa" },
  ],
  BUSINESS: [
    { value: "MARKETING", label: "Marketing" },
    { value: "SALES", label: "Kinh doanh & Sales" },
    { value: "PROJECT_MANAGEMENT", label: "Quản lý dự án" },
    { value: "BUSINESS_ANALYTICS", label: "Phân tích kinh doanh" },
    { value: "PRODUCT_MANAGEMENT", label: "Quản lý sản phẩm" },
    { value: "FINANCE", label: "Tài chính & Kế toán" },
    { value: "ENTREPRENEURSHIP", label: "Khởi nghiệp" },
    { value: "CONSULTING", label: "Tư vấn" },
  ],
  ENGINEERING: [
    { value: "MECHANICAL", label: "Kỹ thuật cơ khí" },
    { value: "ELECTRICAL", label: "Kỹ thuật điện" },
    { value: "CIVIL", label: "Kỹ thuật xây dựng" },
    { value: "CHEMICAL", label: "Kỹ thuật hóa học" },
    { value: "INDUSTRIAL", label: "Kỹ thuật công nghiệp" },
    { value: "AUTOMOTIVE", label: "Kỹ thuật ô tô" },
    { value: "AEROSPACE", label: "Kỹ thuật hàng không" },
    { value: "ENVIRONMENTAL", label: "Kỹ thuật môi trường" },
  ],
  HEALTHCARE: [
    { value: "CLINICAL", label: "Y khoa lâm sàng" },
    { value: "NURSING", label: "Điều dưỡng" },
    { value: "PHARMACY", label: "Dược phẩm" },
    { value: "MEDICAL_TECH", label: "Công nghệ y tế" },
    { value: "PUBLIC_HEALTH", label: "Y tế công cộng" },
    { value: "MENTAL_HEALTH", label: "Sức khỏe tâm thần" },
    { value: "ALLIED_HEALTH", label: "Y tế chuyên ngành" },
    { value: "HEALTHCARE_MGMT", label: "Quản lý y tế" },
  ],
  EDUCATION: [
    { value: "K12_EDUCATION", label: "Giáo dục K-12" },
    { value: "HIGHER_ED", label: "Giáo dục đại học" },
    { value: "LANGUAGE", label: "Giáo dục ngôn ngữ" },
    { value: "ONLINE_LEARNING", label: "E-Learning" },
    { value: "CORPORATE_TRAINING", label: "Đào tạo doanh nghiệp" },
    { value: "EDTECH", label: "Công nghệ giáo dục" },
    { value: "INSTRUCTIONAL", label: "Thiết kế đào tạo" },
    { value: "TUTORING", label: "Gia sư" },
  ],
  LOGISTICS: [
    { value: "SUPPLY_CHAIN", label: "Quản lý chuỗi cung ứng" },
    { value: "WAREHOUSE", label: "Quản lý kho bãi" },
    { value: "TRANSPORT", label: "Vận tải & Logistics" },
    { value: "PROCUREMENT", label: "Mua hàng & Sourcing" },
    { value: "INVENTORY", label: "Quản lý hàng tồn" },
    { value: "CUSTOM", label: "Hải quan" },
    { value: "LAST_MILE", label: "Giao hàng cuối mile" },
    { value: "FREIGHT", label: "Vận chuyển quốc tế" },
  ],
  LEGAL: [
    { value: "CORPORATE_LAW", label: "Luật doanh nghiệp" },
    { value: "IP_LAW", label: "Sở hữu trí tuệ" },
    { value: "LABOR_LAW", label: "Luật lao động" },
    { value: "TAX_LAW", label: "Luật thuế" },
    { value: "COMMERCIAL_LAW", label: "Luật thương mại" },
    { value: "COMPLIANCE", label: "Tuân thủ pháp luật" },
    { value: "LITIGATION", label: "Tranh tụng" },
    { value: "LEGAL_CONSULT", label: "Tư vấn pháp luật" },
  ],
  ARTS: [
    { value: "PHOTOGRAPHY", label: "Nhiếp ảnh" },
    { value: "VIDEO_PROD", label: "Sản xuất video" },
    { value: "MUSIC_AUDIO", label: "Âm nhạc & Audio" },
    { value: "FILM_MAKING", label: "Làm phim" },
    { value: "PERFORMING", label: "Nghệ thuật biểu diễn" },
    { value: "FINE_ARTS", label: "Mỹ thuật" },
    { value: "CREATIVE_WRITING", label: "Sáng tạo nội dung" },
    { value: "ART_DIRECTION", label: "Chỉ đạo nghệ thuật" },
  ],
  SERVICE: [
    { value: "HOSPITALITY", label: "Khách sạn & Lưu trú" },
    { value: "FOOD_BEV", label: "Nhà hàng & F&B" },
    { value: "TRAVEL_TOURISM", label: "Du lịch & Lữ hành" },
    { value: "EVENTS", label: "Tổ chức sự kiện" },
    { value: "CUSTOMER_SERVICE", label: "Dịch vụ khách hàng" },
    { value: "HR_SERVICE", label: "Dịch vụ nhân sự" },
    { value: "CONSULTING_SVC", label: "Dịch vụ tư vấn" },
    { value: "MAINTENANCE", label: "Bảo trì & Sửa chữa" },
  ],
  SOCIALCOMMUNITY: [
    { value: "COMMUNITY_MGR", label: "Quản lý cộng đồng" },
    { value: "SOCIAL_MEDIA_MGR", label: "Quản lý mạng xã hội" },
    { value: "CONTENT_CREATOR", label: "Sáng tạo nội dung" },
    { value: "NGO_MGMT", label: "Quản lý NGO" },
    { value: "VOLUNTEER_MGMT", label: "Quản lý tình nguyện" },
    { value: "FUNDRAISING", label: "Huy động nguồn lực" },
    { value: "PUBLIC_RELATIONS", label: "Truyền thông" },
    { value: "ADVOCACY", label: "Vận động chính sách" },
  ],
  AGRICULTUREENVIRONMENT: [
    { value: "AGRI_PRODUCTION", label: "Sản xuất nông nghiệp" },
    { value: "AGRI_TECH", label: "Công nghệ nông nghiệp" },
    { value: "ANIMAL_HUSBANDRY", label: "Chăn nuôi" },
    { value: "ENV_ENG", label: "Kỹ thuật môi trường" },
    { value: "SUSTAINABILITY", label: "Phát triển bền vững" },
    { value: "RENEWABLE_ENERGY", label: "Năng lượng tái tạo" },
    { value: "WASTE_MGMT", label: "Quản lý chất thải" },
    { value: "WATER_RESOURCES", label: "Tài nguyên nước" },
  ],
};

// ==================== Jobs by Domain ====================

export const JOBS_BY_DOMAIN: Record<
  string,
  { value: string; label: string; icon: string; desc?: string }[]
> = {
  IT: [
    {
      value: "FRONTEND",
      label: "Frontend Developer",
      icon: "🎨",
      desc: "Phát triển giao diện web",
    },
    {
      value: "BACKEND",
      label: "Backend Developer",
      icon: "⚙️",
      desc: "Xây dựng hệ thống server",
    },
    {
      value: "FULLSTACK",
      label: "Full-stack Developer",
      icon: "🚀",
      desc: "Phát triển web toàn diện",
    },
    {
      value: "DATA_ANALYST",
      label: "Data Analyst",
      icon: "📊",
      desc: "Phân tích dữ liệu",
    },
    {
      value: "DATA_ENGINEER",
      label: "Data Engineer",
      icon: "🗄️",
      desc: "Xây dựng hạ tầng dữ liệu",
    },
    {
      value: "DEVOPS",
      label: "DevOps Engineer",
      icon: "🔧",
      desc: "Tự động hóa triển khai",
    },
    {
      value: "ML_AI",
      label: "ML/AI Engineer",
      icon: "🤖",
      desc: "Trí tuệ nhân tạo & ML",
    },
    {
      value: "MOBILE",
      label: "Mobile Developer",
      icon: "📱",
      desc: "Phát triển ứng dụng di động",
    },
    {
      value: "QA",
      label: "QA Engineer",
      icon: "✅",
      desc: "Kiểm thử & đảm bảo chất lượng",
    },
    {
      value: "TECH_LEAD",
      label: "Tech Lead",
      icon: "👑",
      desc: "Kỹ sư trưởng",
    },
  ],
  DESIGN: [
    {
      value: "UI_DESIGNER",
      label: "UI Designer",
      icon: "🎯",
      desc: "Thiết kế giao diện người dùng",
    },
    {
      value: "UX_DESIGNER",
      label: "UX Designer",
      icon: "💡",
      desc: "Trải nghiệm người dùng",
    },
    {
      value: "PRODUCT_DESIGNER",
      label: "Product Designer",
      icon: "📦",
      desc: "Thiết kế sản phẩm",
    },
    {
      value: "GRAPHIC_DESIGNER",
      label: "Graphic Designer",
      icon: "🎭",
      desc: "Thiết kế đồ họa",
    },
    {
      value: "MOTION_DESIGNER",
      label: "Motion Designer",
      icon: "🎬",
      desc: "Thiết kế chuyển động",
    },
    {
      value: "BRAND_DESIGNER",
      label: "Brand Designer",
      icon: "🏷️",
      desc: "Thiết kế thương hiệu",
    },
  ],
  BUSINESS: [
    {
      value: "DIGITAL_MARKETING",
      label: "Digital Marketing",
      icon: "📢",
      desc: "Marketing kỹ thuật số",
    },
    {
      value: "SALES",
      label: "Sales",
      icon: "💰",
      desc: "Kinh doanh & bán hàng",
    },
    {
      value: "BUSINESS_ANALYST",
      label: "Business Analyst",
      icon: "📈",
      desc: "Phân tích kinh doanh",
    },
    {
      value: "PROJECT_MANAGER",
      label: "Project Manager",
      icon: "📋",
      desc: "Quản lý dự án",
    },
    {
      value: "PRODUCT_MANAGER",
      label: "Product Manager",
      icon: "🎪",
      desc: "Quản lý sản phẩm",
    },
    {
      value: "FINANCIAL_ANALYST",
      label: "Financial Analyst",
      icon: "💵",
      desc: "Phân tích tài chính",
    },
  ],
  ENGINEERING: [
    {
      value: "MECHANICAL",
      label: "Mechanical Engineer",
      icon: "⚙️",
      desc: "Kỹ sư cơ khí",
    },
    {
      value: "ELECTRICAL",
      label: "Electrical Engineer",
      icon: "⚡",
      desc: "Kỹ sư điện",
    },
    {
      value: "CIVIL",
      label: "Civil Engineer",
      icon: "🏗️",
      desc: "Kỹ sư xây dựng",
    },
    {
      value: "QA_ENGINEERING",
      label: "QA Engineer",
      icon: "🔍",
      desc: "Kiểm thử kỹ thuật",
    },
  ],
  HEALTHCARE: [
    {
      value: "CLINICAL",
      label: "Clinical Staff",
      icon: "🩺",
      desc: "Nhân viên lâm sàng",
    },
    { value: "PHARMACY", label: "Pharmacy", icon: "💊", desc: "Dược phẩm" },
    {
      value: "HEALTHCARE_MANAGEMENT",
      label: "Healthcare Management",
      icon: "🏥",
      desc: "Quản lý y tế",
    },
    {
      value: "MEDICAL_TECH",
      label: "Medical Technology",
      icon: "🔬",
      desc: "Công nghệ y tế",
    },
  ],
  EDUCATION: [
    { value: "TEACHER", label: "Teacher", icon: "🍎", desc: "Giáo viên" },
    {
      value: "INSTRUCTIONAL_DESIGNER",
      label: "Instructional Designer",
      icon: "📖",
      desc: "Thiết kế giáo trình",
    },
    {
      value: "EDTECH_SPECIALIST",
      label: "EdTech Specialist",
      icon: "💻",
      desc: "Chuyên viên EdTech",
    },
    { value: "TUTOR", label: "Tutor", icon: "🎓", desc: "Gia sư" },
  ],
  LOGISTICS: [
    {
      value: "SUPPLY_CHAIN",
      label: "Supply Chain Manager",
      icon: "🔗",
      desc: "Quản lý chuỗi cung ứng",
    },
    {
      value: "WAREHOUSE",
      label: "Warehouse Manager",
      icon: "🏭",
      desc: "Quản lý kho hàng",
    },
    {
      value: "TRANSPORT",
      label: "Transport Manager",
      icon: "🚚",
      desc: "Quản lý vận tải",
    },
    {
      value: "LOGISTICS_ANALYST",
      label: "Logistics Analyst",
      icon: "📦",
      desc: "Phân tích logistics",
    },
  ],
  LEGAL: [
    {
      value: "CORPORATE_LAW",
      label: "Corporate Lawyer",
      icon: "⚖️",
      desc: "Luật doanh nghiệp",
    },
    {
      value: "IP_LAW",
      label: "IP Lawyer",
      icon: "💎",
      desc: "Luật sở hữu trí tuệ",
    },
    {
      value: "LEGAL_CONSULTANT",
      label: "Legal Consultant",
      icon: "📜",
      desc: "Tư vấn pháp luật",
    },
    {
      value: "COMPLIANCE",
      label: "Compliance Officer",
      icon: "✅",
      desc: "Nhân viên tuân thủ",
    },
  ],
  ARTS: [
    {
      value: "PHOTOGRAPHER",
      label: "Photographer",
      icon: "📷",
      desc: "Nhiếp ảnh gia",
    },
    {
      value: "VIDEOGRAPHER",
      label: "Videographer",
      icon: "🎥",
      desc: " Quay phim",
    },
    { value: "3D_ARTIST", label: "3D Artist", icon: "🎲", desc: "Nghệ sĩ 3D" },
    {
      value: "ILLUSTRATOR",
      label: "Illustrator",
      icon: "✏️",
      desc: "Họa sĩ minh họa",
    },
  ],
  SERVICE: [
    {
      value: "HOTEL_MANAGEMENT",
      label: "Hotel Management",
      icon: "🏨",
      desc: "Quản lý khách sạn",
    },
    {
      value: "EVENT_PLANNER",
      label: "Event Planner",
      icon: "🎉",
      desc: "Nhân sự sự kiện",
    },
    {
      value: "CUSTOMER_SERVICE",
      label: "Customer Service",
      icon: "👥",
      desc: "Dịch vụ khách hàng",
    },
    {
      value: "F&B_MANAGER",
      label: "F&B Manager",
      icon: "🍽️",
      desc: "Quản lý F&B",
    },
  ],
  SOCIALCOMMUNITY: [
    {
      value: "COMMUNITY_MANAGER",
      label: "Community Manager",
      icon: "🌐",
      desc: "Quản lý cộng đồng",
    },
    {
      value: "SOCIAL_MEDIA",
      label: "Social Media Manager",
      icon: "📱",
      desc: "Quản lý mạng xã hội",
    },
    {
      value: "NGO_MANAGER",
      label: "NGO Manager",
      icon: "🤝",
      desc: "Quản lý tổ chức phi lợi nhuận",
    },
    {
      value: "VOLUNTEER_COORD",
      label: "Volunteer Coordinator",
      icon: "🙋",
      desc: "Điều phối tình nguyện",
    },
  ],
  AGRICULTUREENVIRONMENT: [
    {
      value: "AGRICULTURE_SPECIALIST",
      label: "Agriculture Specialist",
      icon: "🌾",
      desc: "Chuyên gia nông nghiệp",
    },
    {
      value: "ENVIRONMENTAL_ENG",
      label: "Environmental Engineer",
      icon: "🌿",
      desc: "Kỹ sư môi trường",
    },
    {
      value: "SUSTAINABILITY",
      label: "Sustainability Manager",
      icon: "♻️",
      desc: "Quản lý bền vững",
    },
  ],
};

// ==================== Jobs by Domain + Industry (for SkillForm Step 3) ====================
// Maps (domain, industry) → list of relevant job roles for that industry within the domain.
// Used in SkillForm: Domain → Industry → JobRole → Skills.
// Jobs are filtered to only show roles relevant to the selected industry.

type JobRoleEntry = {
  value: string;
  label: string;
  icon: string;
  desc?: string;
};

export const JOBS_BY_DOMAIN_INDUSTRY: Record<
  string,
  Record<string, JobRoleEntry[]>
> = {
  IT: {
    WEB_DEV: [
      {
        value: "FRONTEND",
        label: "Frontend Developer",
        icon: "🎨",
        desc: "Phát triển giao diện web",
      },
      {
        value: "BACKEND",
        label: "Backend Developer",
        icon: "⚙️",
        desc: "Xây dựng hệ thống server",
      },
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển web toàn diện",
      },
      {
        value: "QA",
        label: "QA Engineer",
        icon: "✅",
        desc: "Kiểm thử & đảm bảo chất lượng",
      },
      {
        value: "TECH_LEAD",
        label: "Tech Lead",
        icon: "👑",
        desc: "Kỹ sư trưởng",
      },
    ],
    MOBILE_APP: [
      {
        value: "MOBILE",
        label: "Mobile Developer",
        icon: "📱",
        desc: "Phát triển ứng dụng di động",
      },
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển toàn diện",
      },
      {
        value: "QA",
        label: "QA Engineer",
        icon: "✅",
        desc: "Kiểm thử ứng dụng di động",
      },
      {
        value: "TECH_LEAD",
        label: "Tech Lead",
        icon: "👑",
        desc: "Kỹ sư trưởng",
      },
    ],
    DATA_SCIENCE: [
      {
        value: "DATA_ANALYST",
        label: "Data Analyst",
        icon: "📊",
        desc: "Phân tích dữ liệu",
      },
      {
        value: "DATA_ENGINEER",
        label: "Data Engineer",
        icon: "🗄️",
        desc: "Xây dựng hạ tầng dữ liệu",
      },
      {
        value: "ML_AI",
        label: "ML/AI Engineer",
        icon: "🤖",
        desc: "Trí tuệ nhân tạo & ML",
      },
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển toàn diện",
      },
    ],
    CLOUD_DEVOPS: [
      {
        value: "DEVOPS",
        label: "DevOps Engineer",
        icon: "🔧",
        desc: "Tự động hóa triển khai",
      },
      {
        value: "BACKEND",
        label: "Backend Developer",
        icon: "⚙️",
        desc: "Xây dựng hệ thống server",
      },
      { value: "QA", label: "QA Engineer", icon: "✅", desc: "Kiểm thử CI/CD" },
      {
        value: "TECH_LEAD",
        label: "Tech Lead",
        icon: "👑",
        desc: "Kỹ sư trưởng",
      },
    ],
    AI_ML: [
      {
        value: "ML_AI",
        label: "ML/AI Engineer",
        icon: "🤖",
        desc: "Trí tuệ nhân tạo & ML",
      },
      {
        value: "DATA_ANALYST",
        label: "Data Analyst",
        icon: "📊",
        desc: "Phân tích dữ liệu",
      },
      {
        value: "DATA_ENGINEER",
        label: "Data Engineer",
        icon: "🗄️",
        desc: "Xây dựng hạ tầng dữ liệu",
      },
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển toàn diện",
      },
    ],
    GAME_DEV: [
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển game",
      },
      {
        value: "BACKEND",
        label: "Backend Developer",
        icon: "⚙️",
        desc: "Xây dựng server game",
      },
      { value: "QA", label: "QA Engineer", icon: "✅", desc: "Kiểm thử game" },
    ],
    CYBERSECURITY: [
      {
        value: "BACKEND",
        label: "Backend Developer",
        icon: "⚙️",
        desc: "Bảo mật backend",
      },
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển toàn diện",
      },
      {
        value: "QA",
        label: "QA Engineer",
        icon: "✅",
        desc: "Kiểm thử bảo mật",
      },
    ],
    EMBEDDED: [
      {
        value: "BACKEND",
        label: "Backend Developer",
        icon: "⚙️",
        desc: "Lập trình nhúng",
      },
      {
        value: "FULLSTACK",
        label: "Full-stack Developer",
        icon: "🚀",
        desc: "Phát triển toàn diện",
      },
      { value: "QA", label: "QA Engineer", icon: "✅", desc: "Kiểm thử nhúng" },
    ],
  },
  DESIGN: {
    UI_DESIGN: [
      {
        value: "UI_DESIGNER",
        label: "UI Designer",
        icon: "🎯",
        desc: "Thiết kế giao diện người dùng",
      },
      {
        value: "UX_DESIGNER",
        label: "UX Designer",
        icon: "💡",
        desc: "Trải nghiệm người dùng",
      },
      {
        value: "PRODUCT_DESIGNER",
        label: "Product Designer",
        icon: "📦",
        desc: "Thiết kế sản phẩm",
      },
      {
        value: "BRAND_DESIGNER",
        label: "Brand Designer",
        icon: "🏷️",
        desc: "Thiết kế thương hiệu",
      },
    ],
    UX_DESIGN: [
      {
        value: "UX_DESIGNER",
        label: "UX Designer",
        icon: "💡",
        desc: "Trải nghiệm người dùng",
      },
      {
        value: "UI_DESIGNER",
        label: "UI Designer",
        icon: "🎯",
        desc: "Thiết kế giao diện",
      },
      {
        value: "PRODUCT_DESIGNER",
        label: "Product Designer",
        icon: "📦",
        desc: "Thiết kế sản phẩm",
      },
    ],
    PRODUCT_DESIGN: [
      {
        value: "PRODUCT_DESIGNER",
        label: "Product Designer",
        icon: "📦",
        desc: "Thiết kế sản phẩm",
      },
      {
        value: "UX_DESIGNER",
        label: "UX Designer",
        icon: "💡",
        desc: "Trải nghiệm người dùng",
      },
      {
        value: "UI_DESIGNER",
        label: "UI Designer",
        icon: "🎯",
        desc: "Thiết kế giao diện",
      },
    ],
    GRAPHIC_DESIGN: [
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "BRAND_DESIGNER",
        label: "Brand Designer",
        icon: "🏷️",
        desc: "Thiết kế thương hiệu",
      },
      {
        value: "MOTION_DESIGNER",
        label: "Motion Designer",
        icon: "🎬",
        desc: "Thiết kế chuyển động",
      },
      {
        value: "ILLUSTRATOR",
        label: "Illustrator",
        icon: "✏️",
        desc: "Họa sĩ minh họa",
      },
    ],
    MOTION_DESIGN: [
      {
        value: "MOTION_DESIGNER",
        label: "Motion Designer",
        icon: "🎬",
        desc: "Thiết kế chuyển động",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "BRAND_DESIGNER",
        label: "Brand Designer",
        icon: "🏷️",
        desc: "Thiết kế thương hiệu",
      },
    ],
    BRAND_DESIGN: [
      {
        value: "BRAND_DESIGNER",
        label: "Brand Designer",
        icon: "🏷️",
        desc: "Thiết kế thương hiệu",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "UX_DESIGNER",
        label: "UX Designer",
        icon: "💡",
        desc: "Trải nghiệm người dùng",
      },
    ],
    "3D_MODELING": [
      {
        value: "3D_ARTIST",
        label: "3D Artist",
        icon: "🎲",
        desc: "Nghệ sĩ 3D",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "MOTION_DESIGNER",
        label: "Motion Designer",
        icon: "🎬",
        desc: "Thiết kế chuyển động",
      },
    ],
    ILLUSTRATION: [
      {
        value: "ILLUSTRATOR",
        label: "Illustrator",
        icon: "✏️",
        desc: "Họa sĩ minh họa",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "BRAND_DESIGNER",
        label: "Brand Designer",
        icon: "🏷️",
        desc: "Thiết kế thương hiệu",
      },
    ],
  },
  BUSINESS: {
    MARKETING: [
      {
        value: "DIGITAL_MARKETING",
        label: "Digital Marketing",
        icon: "📢",
        desc: "Marketing kỹ thuật số",
      },
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án marketing",
      },
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
    ],
    SALES: [
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
      {
        value: "PRODUCT_MANAGER",
        label: "Product Manager",
        icon: "🎪",
        desc: "Quản lý sản phẩm",
      },
    ],
    PROJECT_MANAGEMENT: [
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
      {
        value: "PRODUCT_MANAGER",
        label: "Product Manager",
        icon: "🎪",
        desc: "Quản lý sản phẩm",
      },
    ],
    BUSINESS_ANALYTICS: [
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
      {
        value: "FINANCIAL_ANALYST",
        label: "Financial Analyst",
        icon: "💵",
        desc: "Phân tích tài chính",
      },
      {
        value: "DIGITAL_MARKETING",
        label: "Digital Marketing",
        icon: "📢",
        desc: "Marketing kỹ thuật số",
      },
    ],
    PRODUCT_MANAGEMENT: [
      {
        value: "PRODUCT_MANAGER",
        label: "Product Manager",
        icon: "🎪",
        desc: "Quản lý sản phẩm",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
    ],
    FINANCE: [
      {
        value: "FINANCIAL_ANALYST",
        label: "Financial Analyst",
        icon: "💵",
        desc: "Phân tích tài chính",
      },
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
    ],
    ENTREPRENEURSHIP: [
      {
        value: "PRODUCT_MANAGER",
        label: "Product Manager",
        icon: "🎪",
        desc: "Quản lý sản phẩm",
      },
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
      {
        value: "DIGITAL_MARKETING",
        label: "Digital Marketing",
        icon: "📢",
        desc: "Marketing kỹ thuật số",
      },
    ],
    CONSULTING: [
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
    ],
  },
  ENGINEERING: {
    MECHANICAL: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Kỹ sư cơ khí",
      },
      {
        value: "QA_ENGINEERING",
        label: "QA Engineer",
        icon: "🔍",
        desc: "Kiểm thử kỹ thuật",
      },
    ],
    ELECTRICAL: [
      {
        value: "ELECTRICAL",
        label: "Electrical Engineer",
        icon: "⚡",
        desc: "Kỹ sư điện",
      },
      {
        value: "QA_ENGINEERING",
        label: "QA Engineer",
        icon: "🔍",
        desc: "Kiểm thử kỹ thuật",
      },
    ],
    CIVIL: [
      {
        value: "CIVIL",
        label: "Civil Engineer",
        icon: "🏗️",
        desc: "Kỹ sư xây dựng",
      },
      {
        value: "QA_ENGINEERING",
        label: "QA Engineer",
        icon: "🔍",
        desc: "Kiểm thử kỹ thuật",
      },
    ],
    CHEMICAL: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Kỹ sư hóa",
      },
      {
        value: "QA_ENGINEERING",
        label: "QA Engineer",
        icon: "🔍",
        desc: "Kiểm thử kỹ thuật",
      },
    ],
    INDUSTRIAL: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Kỹ sư công nghiệp",
      },
      {
        value: "QA_ENGINEERING",
        label: "QA Engineer",
        icon: "🔍",
        desc: "Kiểm thử kỹ thuật",
      },
    ],
    AUTOMOTIVE: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Kỹ sư ô tô",
      },
      {
        value: "QA_ENGINEERING",
        label: "QA Engineer",
        icon: "🔍",
        desc: "Kiểm thử kỹ thuật",
      },
    ],
    AEROSPACE: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Kỹ sư hàng không",
      },
      {
        value: "ELECTRICAL",
        label: "Electrical Engineer",
        icon: "⚡",
        desc: "Kỹ sư điện",
      },
    ],
    ENVIRONMENTAL: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Kỹ sư môi trường",
      },
      {
        value: "ELECTRICAL",
        label: "Electrical Engineer",
        icon: "⚡",
        desc: "Kỹ sư điện",
      },
    ],
  },
  HEALTHCARE: {
    CLINICAL: [
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Nhân viên lâm sàng",
      },
      {
        value: "HEALTHCARE_MANAGEMENT",
        label: "Healthcare Management",
        icon: "🏥",
        desc: "Quản lý y tế",
      },
    ],
    NURSING: [
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Điều dưỡng",
      },
      {
        value: "HEALTHCARE_MANAGEMENT",
        label: "Healthcare Management",
        icon: "🏥",
        desc: "Quản lý y tế",
      },
    ],
    PHARMACY: [
      { value: "PHARMACY", label: "Pharmacy", icon: "💊", desc: "Dược phẩm" },
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Nhân viên lâm sàng",
      },
      {
        value: "HEALTHCARE_MANAGEMENT",
        label: "Healthcare Management",
        icon: "🏥",
        desc: "Quản lý y tế",
      },
    ],
    MEDICAL_TECH: [
      {
        value: "MEDICAL_TECH",
        label: "Medical Technology",
        icon: "🔬",
        desc: "Công nghệ y tế",
      },
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Nhân viên lâm sàng",
      },
    ],
    PUBLIC_HEALTH: [
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Y tế công cộng",
      },
      {
        value: "HEALTHCARE_MANAGEMENT",
        label: "Healthcare Management",
        icon: "🏥",
        desc: "Quản lý y tế",
      },
    ],
    MENTAL_HEALTH: [
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Sức khỏe tâm thần",
      },
      {
        value: "HEALTHCARE_MANAGEMENT",
        label: "Healthcare Management",
        icon: "🏥",
        desc: "Quản lý y tế",
      },
    ],
    ALLIED_HEALTH: [
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Y tế chuyên ngành",
      },
      {
        value: "MEDICAL_TECH",
        label: "Medical Technology",
        icon: "🔬",
        desc: "Công nghệ y tế",
      },
    ],
    HEALTHCARE_MGMT: [
      {
        value: "HEALTHCARE_MANAGEMENT",
        label: "Healthcare Management",
        icon: "🏥",
        desc: "Quản lý y tế",
      },
      {
        value: "CLINICAL",
        label: "Clinical Staff",
        icon: "🩺",
        desc: "Nhân viên lâm sàng",
      },
    ],
  },
  EDUCATION: {
    K12_EDUCATION: [
      { value: "TEACHER", label: "Teacher", icon: "🍎", desc: "Giáo viên" },
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
      { value: "TUTOR", label: "Tutor", icon: "🎓", desc: "Gia sư" },
    ],
    HIGHER_ED: [
      {
        value: "TEACHER",
        label: "Teacher",
        icon: "🍎",
        desc: "Giảng viên đại học",
      },
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
      {
        value: "EDTECH_SPECIALIST",
        label: "EdTech Specialist",
        icon: "💻",
        desc: "Chuyên viên EdTech",
      },
    ],
    LANGUAGE: [
      {
        value: "TEACHER",
        label: "Teacher",
        icon: "🍎",
        desc: "Giáo viên ngôn ngữ",
      },
      { value: "TUTOR", label: "Tutor", icon: "🎓", desc: "Gia sư" },
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
    ],
    ONLINE_LEARNING: [
      {
        value: "EDTECH_SPECIALIST",
        label: "EdTech Specialist",
        icon: "💻",
        desc: "Chuyên viên EdTech",
      },
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
      { value: "TEACHER", label: "Teacher", icon: "🍎", desc: "Giáo viên" },
    ],
    CORPORATE_TRAINING: [
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
      {
        value: "EDTECH_SPECIALIST",
        label: "EdTech Specialist",
        icon: "💻",
        desc: "Chuyên viên EdTech",
      },
      { value: "TEACHER", label: "Teacher", icon: "🍎", desc: "Giảng viên" },
    ],
    EDTECH: [
      {
        value: "EDTECH_SPECIALIST",
        label: "EdTech Specialist",
        icon: "💻",
        desc: "Chuyên viên EdTech",
      },
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
      {
        value: "PRODUCT_MANAGER",
        label: "Product Manager",
        icon: "🎪",
        desc: "Quản lý sản phẩm",
      },
    ],
    INSTRUCTIONAL: [
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
      { value: "TEACHER", label: "Teacher", icon: "🍎", desc: "Giáo viên" },
      { value: "TUTOR", label: "Tutor", icon: "🎓", desc: "Gia sư" },
    ],
    TUTORING: [
      { value: "TUTOR", label: "Tutor", icon: "🎓", desc: "Gia sư" },
      { value: "TEACHER", label: "Teacher", icon: "🍎", desc: "Giáo viên" },
      {
        value: "INSTRUCTIONAL_DESIGNER",
        label: "Instructional Designer",
        icon: "📖",
        desc: "Thiết kế giáo trình",
      },
    ],
  },
  LOGISTICS: {
    SUPPLY_CHAIN: [
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý chuỗi cung ứng",
      },
      {
        value: "LOGISTICS_ANALYST",
        label: "Logistics Analyst",
        icon: "📦",
        desc: "Phân tích logistics",
      },
      {
        value: "WAREHOUSE",
        label: "Warehouse Manager",
        icon: "🏭",
        desc: "Quản lý kho hàng",
      },
      {
        value: "TRANSPORT",
        label: "Transport Manager",
        icon: "🚚",
        desc: "Quản lý vận tải",
      },
    ],
    WAREHOUSE: [
      {
        value: "WAREHOUSE",
        label: "Warehouse Manager",
        icon: "🏭",
        desc: "Quản lý kho hàng",
      },
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý chuỗi cung ứng",
      },
      {
        value: "LOGISTICS_ANALYST",
        label: "Logistics Analyst",
        icon: "📦",
        desc: "Phân tích logistics",
      },
    ],
    TRANSPORT: [
      {
        value: "TRANSPORT",
        label: "Transport Manager",
        icon: "🚚",
        desc: "Quản lý vận tải",
      },
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý chuỗi cung ứng",
      },
      {
        value: "LOGISTICS_ANALYST",
        label: "Logistics Analyst",
        icon: "📦",
        desc: "Phân tích logistics",
      },
    ],
    PROCUREMENT: [
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý mua hàng",
      },
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Phân tích kinh doanh",
      },
    ],
    INVENTORY: [
      {
        value: "WAREHOUSE",
        label: "Warehouse Manager",
        icon: "🏭",
        desc: "Quản lý hàng tồn",
      },
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý chuỗi cung ứng",
      },
    ],
    CUSTOM: [
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý hải quan",
      },
      {
        value: "TRANSPORT",
        label: "Transport Manager",
        icon: "🚚",
        desc: "Quản lý vận tải",
      },
    ],
    LAST_MILE: [
      {
        value: "TRANSPORT",
        label: "Transport Manager",
        icon: "🚚",
        desc: "Giao hàng cuối mile",
      },
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý chuỗi cung ứng",
      },
    ],
    FREIGHT: [
      {
        value: "TRANSPORT",
        label: "Transport Manager",
        icon: "🚚",
        desc: "Vận chuyển quốc tế",
      },
      {
        value: "SUPPLY_CHAIN",
        label: "Supply Chain Manager",
        icon: "🔗",
        desc: "Quản lý chuỗi cung ứng",
      },
    ],
  },
  LEGAL: {
    CORPORATE_LAW: [
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật doanh nghiệp",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
      {
        value: "COMPLIANCE",
        label: "Compliance Officer",
        icon: "✅",
        desc: "Nhân viên tuân thủ",
      },
    ],
    IP_LAW: [
      {
        value: "IP_LAW",
        label: "IP Lawyer",
        icon: "💎",
        desc: "Luật sở hữu trí tuệ",
      },
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật doanh nghiệp",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
    ],
    LABOR_LAW: [
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật lao động",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
      {
        value: "COMPLIANCE",
        label: "Compliance Officer",
        icon: "✅",
        desc: "Nhân viên tuân thủ",
      },
    ],
    TAX_LAW: [
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật thuế",
      },
      {
        value: "FINANCIAL_ANALYST",
        label: "Financial Analyst",
        icon: "💵",
        desc: "Phân tích tài chính",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
    ],
    COMMERCIAL_LAW: [
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật thương mại",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
      {
        value: "COMPLIANCE",
        label: "Compliance Officer",
        icon: "✅",
        desc: "Nhân viên tuân thủ",
      },
    ],
    COMPLIANCE: [
      {
        value: "COMPLIANCE",
        label: "Compliance Officer",
        icon: "✅",
        desc: "Tuân thủ pháp luật",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật doanh nghiệp",
      },
    ],
    LITIGATION: [
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Tranh tụng",
      },
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
    ],
    LEGAL_CONSULT: [
      {
        value: "LEGAL_CONSULTANT",
        label: "Legal Consultant",
        icon: "📜",
        desc: "Tư vấn pháp luật",
      },
      {
        value: "COMPLIANCE",
        label: "Compliance Officer",
        icon: "✅",
        desc: "Nhân viên tuân thủ",
      },
      {
        value: "CORPORATE_LAW",
        label: "Corporate Lawyer",
        icon: "⚖️",
        desc: "Luật doanh nghiệp",
      },
    ],
  },
  ARTS: {
    PHOTOGRAPHY: [
      {
        value: "PHOTOGRAPHER",
        label: "Photographer",
        icon: "📷",
        desc: "Nhiếp ảnh gia",
      },
      {
        value: "VIDEOGRAPHER",
        label: "Videographer",
        icon: "🎥",
        desc: " Quay phim",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
    ],
    VIDEO_PROD: [
      {
        value: "VIDEOGRAPHER",
        label: "Videographer",
        icon: "🎥",
        desc: " Quay phim",
      },
      {
        value: "MOTION_DESIGNER",
        label: "Motion Designer",
        icon: "🎬",
        desc: "Thiết kế chuyển động",
      },
      {
        value: "PHOTOGRAPHER",
        label: "Photographer",
        icon: "📷",
        desc: "Nhiếp ảnh gia",
      },
    ],
    MUSIC_AUDIO: [
      {
        value: "VIDEOGRAPHER",
        label: "Videographer",
        icon: "🎥",
        desc: "Âm nhạc & Audio",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
    ],
    FILM_MAKING: [
      {
        value: "VIDEOGRAPHER",
        label: "Videographer",
        icon: "🎥",
        desc: "Làm phim",
      },
      {
        value: "MOTION_DESIGNER",
        label: "Motion Designer",
        icon: "🎬",
        desc: "Thiết kế chuyển động",
      },
      {
        value: "PHOTOGRAPHER",
        label: "Photographer",
        icon: "📷",
        desc: "Nhiếp ảnh gia",
      },
    ],
    PERFORMING: [
      {
        value: "PHOTOGRAPHER",
        label: "Photographer",
        icon: "📷",
        desc: "Nghệ thuật biểu diễn",
      },
      {
        value: "VIDEOGRAPHER",
        label: "Videographer",
        icon: "🎥",
        desc: " Quay phim",
      },
    ],
    FINE_ARTS: [
      {
        value: "ILLUSTRATOR",
        label: "Illustrator",
        icon: "✏️",
        desc: "Mỹ thuật",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "3D_ARTIST",
        label: "3D Artist",
        icon: "🎲",
        desc: "Nghệ sĩ 3D",
      },
    ],
    CREATIVE_WRITING: [
      {
        value: "ILLUSTRATOR",
        label: "Illustrator",
        icon: "✏️",
        desc: "Sáng tạo nội dung",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
    ],
    ART_DIRECTION: [
      {
        value: "BRAND_DESIGNER",
        label: "Brand Designer",
        icon: "🏷️",
        desc: "Chỉ đạo nghệ thuật",
      },
      {
        value: "GRAPHIC_DESIGNER",
        label: "Graphic Designer",
        icon: "🎭",
        desc: "Thiết kế đồ họa",
      },
      {
        value: "MOTION_DESIGNER",
        label: "Motion Designer",
        icon: "🎬",
        desc: "Thiết kế chuyển động",
      },
    ],
  },
  SERVICE: {
    HOSPITALITY: [
      {
        value: "HOTEL_MANAGEMENT",
        label: "Hotel Management",
        icon: "🏨",
        desc: "Quản lý khách sạn",
      },
      {
        value: "EVENT_PLANNER",
        label: "Event Planner",
        icon: "🎉",
        desc: "Nhân sự sự kiện",
      },
      {
        value: "F&B_MANAGER",
        label: "F&B Manager",
        icon: "🍽️",
        desc: "Quản lý F&B",
      },
    ],
    FOOD_BEV: [
      {
        value: "F&B_MANAGER",
        label: "F&B Manager",
        icon: "🍽️",
        desc: "Quản lý nhà hàng",
      },
      {
        value: "HOTEL_MANAGEMENT",
        label: "Hotel Management",
        icon: "🏨",
        desc: "Quản lý khách sạn",
      },
      {
        value: "CUSTOMER_SERVICE",
        label: "Customer Service",
        icon: "👥",
        desc: "Dịch vụ khách hàng",
      },
    ],
    TRAVEL_TOURISM: [
      {
        value: "HOTEL_MANAGEMENT",
        label: "Hotel Management",
        icon: "🏨",
        desc: "Du lịch & Lữ hành",
      },
      {
        value: "EVENT_PLANNER",
        label: "Event Planner",
        icon: "🎉",
        desc: "Tổ chức sự kiện",
      },
      {
        value: "CUSTOMER_SERVICE",
        label: "Customer Service",
        icon: "👥",
        desc: "Dịch vụ khách hàng",
      },
    ],
    EVENTS: [
      {
        value: "EVENT_PLANNER",
        label: "Event Planner",
        icon: "🎉",
        desc: "Tổ chức sự kiện",
      },
      {
        value: "HOTEL_MANAGEMENT",
        label: "Hotel Management",
        icon: "🏨",
        desc: "Quản lý khách sạn",
      },
      {
        value: "CUSTOMER_SERVICE",
        label: "Customer Service",
        icon: "👥",
        desc: "Dịch vụ khách hàng",
      },
    ],
    CUSTOMER_SERVICE: [
      {
        value: "CUSTOMER_SERVICE",
        label: "Customer Service",
        icon: "👥",
        desc: "Dịch vụ khách hàng",
      },
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
      {
        value: "HOTEL_MANAGEMENT",
        label: "Hotel Management",
        icon: "🏨",
        desc: "Quản lý khách sạn",
      },
    ],
    HR_SERVICE: [
      {
        value: "CUSTOMER_SERVICE",
        label: "Customer Service",
        icon: "👥",
        desc: "Dịch vụ nhân sự",
      },
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
    ],
    CONSULTING_SVC: [
      {
        value: "BUSINESS_ANALYST",
        label: "Business Analyst",
        icon: "📈",
        desc: "Dịch vụ tư vấn",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
      {
        value: "CUSTOMER_SERVICE",
        label: "Customer Service",
        icon: "👥",
        desc: "Dịch vụ khách hàng",
      },
    ],
    MAINTENANCE: [
      {
        value: "MECHANICAL",
        label: "Mechanical Engineer",
        icon: "⚙️",
        desc: "Bảo trì & Sửa chữa",
      },
      {
        value: "ELECTRICAL",
        label: "Electrical Engineer",
        icon: "⚡",
        desc: "Kỹ sư điện",
      },
    ],
  },
  SOCIALCOMMUNITY: {
    COMMUNITY_MGR: [
      {
        value: "COMMUNITY_MANAGER",
        label: "Community Manager",
        icon: "🌐",
        desc: "Quản lý cộng đồng",
      },
      {
        value: "SOCIAL_MEDIA",
        label: "Social Media Manager",
        icon: "📱",
        desc: "Quản lý mạng xã hội",
      },
      {
        value: "NGO_MANAGER",
        label: "NGO Manager",
        icon: "🤝",
        desc: "Quản lý tổ chức phi lợi nhuận",
      },
    ],
    SOCIAL_MEDIA_MGR: [
      {
        value: "SOCIAL_MEDIA",
        label: "Social Media Manager",
        icon: "📱",
        desc: "Quản lý mạng xã hội",
      },
      {
        value: "COMMUNITY_MANAGER",
        label: "Community Manager",
        icon: "🌐",
        desc: "Quản lý cộng đồng",
      },
      {
        value: "DIGITAL_MARKETING",
        label: "Digital Marketing",
        icon: "📢",
        desc: "Marketing kỹ thuật số",
      },
    ],
    CONTENT_CREATOR: [
      {
        value: "SOCIAL_MEDIA",
        label: "Social Media Manager",
        icon: "📱",
        desc: "Sáng tạo nội dung",
      },
      {
        value: "COMMUNITY_MANAGER",
        label: "Community Manager",
        icon: "🌐",
        desc: "Quản lý cộng đồng",
      },
      {
        value: "VIDEOGRAPHER",
        label: "Videographer",
        icon: "🎥",
        desc: " Quay phim",
      },
    ],
    NGO_MGMT: [
      {
        value: "NGO_MANAGER",
        label: "NGO Manager",
        icon: "🤝",
        desc: "Quản lý NGO",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
      {
        value: "VOLUNTEER_COORD",
        label: "Volunteer Coordinator",
        icon: "🙋",
        desc: "Điều phối tình nguyện",
      },
    ],
    VOLUNTEER_MGMT: [
      {
        value: "VOLUNTEER_COORD",
        label: "Volunteer Coordinator",
        icon: "🙋",
        desc: "Quản lý tình nguyện",
      },
      {
        value: "NGO_MANAGER",
        label: "NGO Manager",
        icon: "🤝",
        desc: "Quản lý tổ chức phi lợi nhuận",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
    ],
    FUNDRAISING: [
      {
        value: "NGO_MANAGER",
        label: "NGO Manager",
        icon: "🤝",
        desc: "Huy động nguồn lực",
      },
      {
        value: "SALES",
        label: "Sales",
        icon: "💰",
        desc: "Kinh doanh & bán hàng",
      },
      {
        value: "DIGITAL_MARKETING",
        label: "Digital Marketing",
        icon: "📢",
        desc: "Marketing kỹ thuật số",
      },
    ],
    PUBLIC_RELATIONS: [
      {
        value: "SOCIAL_MEDIA",
        label: "Social Media Manager",
        icon: "📱",
        desc: "Truyền thông",
      },
      {
        value: "COMMUNITY_MANAGER",
        label: "Community Manager",
        icon: "🌐",
        desc: "Quản lý cộng đồng",
      },
      {
        value: "DIGITAL_MARKETING",
        label: "Digital Marketing",
        icon: "📢",
        desc: "Marketing kỹ thuật số",
      },
    ],
    ADVOCACY: [
      {
        value: "NGO_MANAGER",
        label: "NGO Manager",
        icon: "🤝",
        desc: "Vận động chính sách",
      },
      {
        value: "PROJECT_MANAGER",
        label: "Project Manager",
        icon: "📋",
        desc: "Quản lý dự án",
      },
      {
        value: "SOCIAL_MEDIA",
        label: "Social Media Manager",
        icon: "📱",
        desc: "Truyền thông",
      },
    ],
  },
  AGRICULTUREENVIRONMENT: {
    AGRI_PRODUCTION: [
      {
        value: "AGRICULTURE_SPECIALIST",
        label: "Agriculture Specialist",
        icon: "🌾",
        desc: "Sản xuất nông nghiệp",
      },
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Kỹ sư môi trường",
      },
    ],
    AGRI_TECH: [
      {
        value: "AGRICULTURE_SPECIALIST",
        label: "Agriculture Specialist",
        icon: "🌾",
        desc: "Công nghệ nông nghiệp",
      },
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Kỹ sư môi trường",
      },
      {
        value: "SUSTAINABILITY",
        label: "Sustainability Manager",
        icon: "♻️",
        desc: "Quản lý bền vững",
      },
    ],
    ANIMAL_HUSBANDRY: [
      {
        value: "AGRICULTURE_SPECIALIST",
        label: "Agriculture Specialist",
        icon: "🌾",
        desc: "Chăn nuôi",
      },
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Kỹ sư môi trường",
      },
    ],
    ENV_ENG: [
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Kỹ thuật môi trường",
      },
      {
        value: "SUSTAINABILITY",
        label: "Sustainability Manager",
        icon: "♻️",
        desc: "Quản lý bền vững",
      },
      {
        value: "AGRICULTURE_SPECIALIST",
        label: "Agriculture Specialist",
        icon: "🌾",
        desc: "Chuyên gia nông nghiệp",
      },
    ],
    SUSTAINABILITY: [
      {
        value: "SUSTAINABILITY",
        label: "Sustainability Manager",
        icon: "♻️",
        desc: "Phát triển bền vững",
      },
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Kỹ sư môi trường",
      },
      {
        value: "AGRICULTURE_SPECIALIST",
        label: "Agriculture Specialist",
        icon: "🌾",
        desc: "Chuyên gia nông nghiệp",
      },
    ],
    RENEWABLE_ENERGY: [
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Năng lượng tái tạo",
      },
      {
        value: "SUSTAINABILITY",
        label: "Sustainability Manager",
        icon: "♻️",
        desc: "Quản lý bền vững",
      },
      {
        value: "ELECTRICAL",
        label: "Electrical Engineer",
        icon: "⚡",
        desc: "Kỹ sư điện",
      },
    ],
    WASTE_MGMT: [
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Quản lý chất thải",
      },
      {
        value: "SUSTAINABILITY",
        label: "Sustainability Manager",
        icon: "♻️",
        desc: "Quản lý bền vững",
      },
    ],
    WATER_RESOURCES: [
      {
        value: "ENVIRONMENTAL_ENG",
        label: "Environmental Engineer",
        icon: "🌿",
        desc: "Tài nguyên nước",
      },
      {
        value: "SUSTAINABILITY",
        label: "Sustainability Manager",
        icon: "♻️",
        desc: "Quản lý bền vững",
      },
      {
        value: "AGRICULTURE_SPECIALIST",
        label: "Agriculture Specialist",
        icon: "🌾",
        desc: "Chuyên gia nông nghiệp",
      },
    ],
  },
};

// ==================== Goal Options ====================

export const GOAL_OPTIONS = [
  {
    value: "EXPLORE",
    label: "Khám phá trình độ hiện tại",
    description:
      "Đánh giá nhanh để biết điểm mạnh, điểm yếu và xuất phát điểm của bạn.",
  },
  {
    value: "INTERNSHIP",
    label: "Chuẩn bị internship / fresher job",
    description:
      "Tập trung vào các kỹ năng cốt lõi để sẵn sàng ứng tuyển vị trí đầu sự nghiệp.",
  },
  {
    value: "CAREER_CHANGE",
    label: "Chuyển ngành",
    description:
      "Xác định khoảng cách năng lực và lộ trình chuyển đổi sang lĩnh vực mới.",
  },
  {
    value: "FROM_SCRATCH",
    label: "Xây lộ trình học từ đầu",
    description:
      "Bắt đầu từ nền tảng và đi theo roadmap có thứ tự ưu tiên rõ ràng.",
  },
  {
    value: "LEVEL_UP",
    label: "Tăng tốc lên cấp độ tiếp theo",
    description:
      "Nâng tầm năng lực hiện tại để xử lý bài toán khó hơn trong thực tế.",
  },
  {
    value: "REVIEW",
    label: "Ôn lại kiến thức",
    description:
      "Rà soát các phần kiến thức quan trọng trước kỳ thi hoặc phỏng vấn.",
  },
] as const;

export type GoalType = (typeof GOAL_OPTIONS)[number]["value"];

// ==================== Level Options ====================

export const LEVEL_OPTIONS = [
  {
    value: "BEGINNER",
    label: "Beginner",
    description: "Mới bắt đầu, chưa có kinh nghiệm",
  },
  {
    value: "ELEMENTARY",
    label: "Elementary",
    description: "Có kiến thức cơ bản",
  },
  {
    value: "INTERMEDIATE",
    label: "Intermediate",
    description: "Làm được dự án thực tế",
  },
  {
    value: "ADVANCED",
    label: "Advanced",
    description: "Xử lý được công việc phức tạp",
  },
] as const;

export type LevelType = (typeof LEVEL_OPTIONS)[number]["value"];

// ==================== Focus Area Options ====================

export const FOCUS_AREA_OPTIONS = [
  { value: "FUNDAMENTALS", label: "Kiến thức cơ bản", icon: "📖" },
  { value: "PROBLEM_SOLVING", label: "Giải bài tập", icon: "🧩" },
  { value: "PRACTICAL_CODING", label: "Lập trình thực hành", icon: "💻" },
  { value: "JOB_READINESS", label: "Chuẩn bị đi làm", icon: "🎯" },
  { value: "TECHNICAL_ENGLISH", label: "Tiếng Anh chuyên ngành", icon: "🇬🇧" },
] as const;

export type FocusAreaType = (typeof FOCUS_AREA_OPTIONS)[number]["value"];

// ==================== Language Options ====================

export const LANGUAGE_OPTIONS = [
  { value: "VI", label: "Tiếng Việt" },
  { value: "EN", label: "English" },
  { value: "BILINGUAL", label: "Song ngữ" },
] as const;

export type LanguageType = (typeof LANGUAGE_OPTIONS)[number]["value"];

// ==================== Duration Options ====================

export const DURATION_OPTIONS = [
  {
    value: "QUICK",
    label: "Nhanh",
    description: "5 phút / 15 câu",
    icon: "⚡",
  },
  {
    value: "STANDARD",
    label: "Tiêu chuẩn",
    description: "15 phút / 25 câu",
    icon: "⏱️",
  },
  {
    value: "DEEP",
    label: "Chi tiết",
    description: "30 phút / 40 câu",
    icon: "📝",
  },
] as const;

export type DurationType = (typeof DURATION_OPTIONS)[number]["value"];

export const QUESTION_COUNT_OPTIONS = [
  {
    value: 15,
    label: "15 câu",
    description: "Nhanh, kiểm tra tiêu chuẩn",
    icon: "⚡",
  },
  {
    value: 25,
    label: "25 câu",
    description: "Cân bằng, bao quát hơn",
    icon: "🎯",
  },
  {
    value: 40,
    label: "40 câu",
    description: "Chi tiết, phân tích sâu",
    icon: "📝",
  },
] as const;

// @deprecated — use SKILLS_BY_JOB_ROLE instead. Kept for backward compatibility.
export const SKILLS_BY_DOMAIN: Record<string, string[]> = {
  FRONTEND: [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Vue.js",
    "Angular",
    "Next.js",
    "Tailwind CSS",
    "Responsive Design",
  ],
  BACKEND: [
    "Java",
    "Spring Boot",
    "Python",
    "Django",
    "Node.js",
    "Express",
    "REST API",
    "SQL",
    "NoSQL",
    "Git",
    "Docker",
  ],
  FULLSTACK: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "SQL",
    "NoSQL",
    "Git",
    "Docker",
    "AWS",
  ],
  DATA_ANALYSIS: [
    "Python",
    "SQL",
    "Excel",
    "Tableau",
    "Power BI",
    "Pandas",
    "NumPy",
    "Statistics",
    "Data Visualization",
  ],
  UI_UX: [
    "Figma",
    "Sketch",
    "Adobe XD",
    "Wireframing",
    "Prototyping",
    "User Research",
    "UX Writing",
    "Design Systems",
  ],
  DIGITAL_MARKETING: [
    "SEO",
    "Google Ads",
    "Facebook Ads",
    "Content Marketing",
    "Email Marketing",
    "Analytics",
    "Social Media",
  ],
  PRODUCT_MANAGEMENT: [
    "Product Strategy",
    "User Stories",
    "Agile/Scrum",
    "Roadmapping",
    "A/B Testing",
    "Analytics",
  ],
};

// ==================== Skills by Job Role (authoritative for SkillForm) ====================
// All skills for a job role are pre-selected in SkillForm step 3.
// User deselects skills they already know; at least 1 must remain selected.
// Skills are ordered by importance/frequency for the role.

export const SKILLS_BY_JOB_ROLE: Record<string, string[]> = {
  // ===================== IT =====================
  FRONTEND: [
    // Core
    "HTML5",
    "CSS3",
    "JavaScript (ES6+)",
    "TypeScript",
    // Frameworks
    "React",
    "Vue.js",
    "Angular",
    "Next.js",
    "Svelte",
    // Styling
    "Tailwind CSS",
    "SASS/SCSS",
    "CSS Modules",
    "Styled-Components",
    // Tools
    "Git",
    "Webpack",
    "Vite",
    "npm / yarn / pnpm",
    // Advanced
    "Responsive Design",
    "Accessibility (WCAG)",
    "Performance Optimization",
    "PWA",
    "Testing (Jest/Cypress)",
    // Soft
    "Cross-browser Compatibility",
    "REST API Integration",
    "State Management (Redux/Zustand)",
  ],
  BACKEND: [
    // Languages
    "Java",
    "Spring Boot",
    "Python",
    "Django",
    "FastAPI",
    "Node.js",
    "Express.js",
    "Go",
    "Rust",
    // Databases
    "SQL",
    "PostgreSQL",
    "MySQL",
    "NoSQL (MongoDB)",
    "Redis",
    "Elasticsearch",
    // APIs
    "REST API",
    "GraphQL",
    "gRPC",
    "WebSocket",
    // DevOps & Infra
    "Docker",
    "Kubernetes",
    "CI/CD",
    "AWS",
    "Linux",
    "Nginx",
    // Architecture
    "Microservices",
    "Authentication (JWT/OAuth2)",
    "Caching",
    "Message Queue (Kafka/RabbitMQ)",
    // Testing
    "Unit Testing",
    "API Testing",
    "Security Best Practices",
  ],
  FULLSTACK: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express.js",
    "Next.js",
    "SQL",
    "PostgreSQL",
    "NoSQL (MongoDB)",
    "Redis",
    "REST API",
    "GraphQL",
    "Docker",
    "AWS",
    "Git",
    "Authentication (JWT/OAuth2)",
    "CI/CD",
    "Linux",
    "Responsive Design",
    "State Management",
    "Testing (Jest/Cypress)",
  ],
  DATA_ANALYST: [
    // Languages & Tools
    "Python",
    "SQL",
    "R",
    // Data Tools
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "Jupyter Notebook",
    "Power BI",
    "Tableau",
    // Excel
    "Excel (VLOOKUP, Pivot, Power Query)",
    "Google Sheets",
    // Visualization
    "Data Visualization",
    "Matplotlib",
    "Seaborn",
    "Storytelling with Data",
    // Stats
    "Statistics",
    "A/B Testing",
    "Hypothesis Testing",
    "Regression Analysis",
    // Business
    "Business Intelligence",
    "ETL",
    "Data Cleaning",
    "Data Warehousing",
  ],
  DATA_ENGINEER: [
    "Python",
    "SQL",
    "Scala",
    "Java",
    "Apache Spark",
    "Apache Airflow",
    "Kafka",
    "Flink",
    "dbt",
    "Snowflake",
    "BigQuery",
    "Redshift",
    "Docker",
    "Kubernetes",
    "AWS (Glue, EMR, S3)",
    "Terraform",
    "ETL Pipeline Design",
    "Data Lake Architecture",
    "Data Warehousing",
    "Data Quality",
    "Git",
    "CI/CD",
  ],
  DEVOPS: [
    "Linux",
    "Bash Scripting",
    "Git",
    // Container & Orchestration
    "Docker",
    "Kubernetes",
    "Helm",
    // Cloud
    "AWS",
    "GCP",
    "Azure",
    "Terraform",
    "CloudFormation",
    // CI/CD
    "Jenkins",
    "GitHub Actions",
    "GitLab CI",
    "ArgoCD",
    // Monitoring
    "Prometheus",
    "Grafana",
    "ELK Stack",
    "Datadog",
    // Networking
    "Networking (TCP/IP, DNS, Load Balancer)",
    "VPN",
    "Firewall",
    // Scripting
    "Ansible",
    "Chef",
    "Puppet",
    "Python for Automation",
  ],
  ML_AI: [
    "Python",
    "SQL",
    // ML Frameworks
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Keras",
    "JAX",
    // Data
    "Pandas",
    "NumPy",
    "SQL",
    "Spark ML",
    // NLP / Vision
    "NLP",
    "Transformers (BERT, GPT)",
    "Computer Vision",
    "OpenCV",
    // MLOps
    "MLOps",
    "MLflow",
    "Kubeflow",
    "Docker",
    "Kubernetes",
    // Math
    "Linear Algebra",
    "Statistics",
    "Calculus",
    "Optimization",
    // Tools
    "Jupyter",
    "Git",
    "AWS SageMaker",
    "Databricks",
  ],
  MOBILE: [
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "Dart",
    "iOS Development",
    "Android Development",
    "Cross-platform Development",
    "REST API",
    "GraphQL",
    "Firebase",
    "SQLite / Room",
    "Git",
    "CI/CD (Fastlane/Bitrise)",
    "App Store Deployment",
    "Play Store Deployment",
    "UI/UX for Mobile",
    "State Management (Provider/Riverpod/Redux)",
    "Testing (XCTest/Espresso)",
    "Push Notifications",
    "Performance Optimization",
  ],
  QA: [
    "Manual Testing",
    "Automation Testing",
    "Selenium",
    "Cypress",
    "Playwright",
    "Jest",
    "TestNG",
    "JUnit",
    "API Testing (Postman)",
    "BDD (Cucumber)",
    "JIRA",
    "SQL",
    "Git",
    "Docker",
    "Mobile Testing",
    "Performance Testing (JMeter)",
    "Security Testing",
    "Test Planning",
    "Test Case Design",
    "Bug Reporting",
    "CI/CD Integration",
  ],
  TECH_LEAD: [
    "System Design",
    "Architecture Patterns",
    "Code Review",
    "Agile/Scrum",
    "JIRA",
    "Stakeholder Management",
    "Mentoring",
    "Technical Writing",
    "API Design",
    "DevOps",
    "Git",
    "Testing Strategy",
    "Performance Optimization",
    "Security Awareness",
    "Cloud Architecture",
  ],

  // ===================== DESIGN =====================
  UI_DESIGNER: [
    "Figma",
    "Sketch",
    "Adobe XD",
    "Adobe Photoshop",
    "Illustrator",
    "Wireframing",
    "Prototyping",
    "Design Systems",
    "Component Library",
    "Responsive Design",
    "Mobile UI",
    "CSS",
    "HTML",
    "Typography",
    "Color Theory",
    "Layout Design",
    "Icon Design",
    "Auto Layout",
    "Animation Principles",
    "Usability Principles",
    "Handoff to Developers",
    "Version Control (Figma/Sketch)",
  ],
  UX_DESIGNER: [
    "Figma",
    "Sketch",
    "Adobe XD",
    "User Research",
    "Usability Testing",
    "A/B Testing",
    "Journey Mapping",
    "Wireframing",
    "Prototyping",
    "Information Architecture",
    "Persona Development",
    "Heuristic Evaluation",
    "Survey Design",
    "Interview Skills",
    "Data Analysis",
    "Analytics (Google Analytics)",
    "Empathy Map",
    "Storytelling",
    "Accessibility (WCAG)",
    "Design Thinking",
    "Jobs-to-be-Done (JTBD)",
  ],
  PRODUCT_DESIGNER: [
    "Figma",
    "Design Systems",
    "Prototyping",
    "User Research",
    "A/B Testing",
    "Analytics",
    "Agile/Scrum",
    "JIRA",
    "Roadmapping",
    "Information Architecture",
    "Interaction Design",
    "Visual Design",
    "Stakeholder Management",
    "Prioritization",
    "MVP Design",
    "Usability Testing",
    "Wireframing",
    "Accessibility",
    "Data-Driven Design",
    "Design Sprint",
  ],
  GRAPHIC_DESIGNER: [
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Adobe InDesign",
    "Figma",
    "Typography",
    "Color Theory",
    "Brand Identity",
    "Logo Design",
    "Print Design",
    "Layout Design",
    "Vector Illustration",
    "Digital Painting",
    "Photo Editing",
    "Brand Guidelines",
    "Packaging Design",
    "Social Media Graphics",
    "Motion Graphics (After Effects)",
    "Creative Direction",
  ],
  MOTION_DESIGNER: [
    "After Effects",
    "Cinema 4D",
    "Premiere Pro",
    "Lottie",
    "CSS Animation",
    "Principle",
    "Motion Graphics",
    "Character Animation",
    "UI Animation",
    "Video Editing",
    "Compositing",
    "VFX",
    "Storyboarding",
    "Timing & Rhythm",
    "Typography in Motion",
    "Export & Optimization",
    "Responsive Animation",
    "Sound Integration",
  ],
  BRAND_DESIGNER: [
    "Adobe Illustrator",
    "Figma",
    "Photoshop",
    "Typography",
    "Color Theory",
    "Logo Design",
    "Brand Identity",
    "Brand Guidelines",
    "Style Guide",
    "Visual Identity Systems",
    "Packaging Design",
    "Creative Direction",
    "Market Research",
    "Competitive Analysis",
    "Presentation Design",
    "Social Media Branding",
  ],

  // ===================== BUSINESS =====================
  DIGITAL_MARKETING: [
    "SEO",
    "Google Ads",
    "Facebook/Meta Ads",
    "TikTok Ads",
    "Content Marketing",
    "Email Marketing",
    "Marketing Automation",
    "Analytics (Google Analytics 4)",
    "Conversion Rate Optimization (CRO)",
    "Copywriting",
    "Social Media Marketing",
    "Landing Page Design",
    "Keyword Research",
    "A/B Testing",
    "Remarketing/Retargeting",
    "Influencer Marketing",
    "Affiliate Marketing",
    "Growth Hacking",
  ],
  SALES: [
    "CRM (Salesforce/HubSpot)",
    "Negotiation",
    "Prospecting",
    "Cold Outreach",
    "Pitching",
    "Product Presentation",
    "Account Management",
    "Lead Qualification (BANT/MEDDIC)",
    "Objection Handling",
    "Contract Negotiation",
    "Closing Techniques",
    "Sales Pipeline Management",
    "Sales Analytics",
    " Territory Management",
    "Customer Relationship Building",
    "Business Development",
  ],
  BUSINESS_ANALYST: [
    "SQL",
    "Excel",
    "Power BI",
    "Tableau",
    "Requirements Analysis",
    "Process Mapping",
    "Stakeholder Management",
    "JIRA",
    "Confluence",
    "Use Case Analysis",
    "Data Analysis",
    "Gap Analysis",
    "SWOT Analysis",
    "Agile/Scrum",
    "User Stories",
    "Functional Specifications",
    "UML / BPMN",
    "Interview Skills",
    "Workshop Facilitation",
  ],
  PROJECT_MANAGER: [
    "JIRA",
    "Asana",
    "Monday.com",
    "MS Project",
    "Agile/Scrum",
    "Kanban",
    "Waterfall",
    "Risk Management",
    "Stakeholder Management",
    "Communication",
    "Budget Management",
    "Timeline Planning",
    "Resource Management",
    "Conflict Resolution",
    "Change Management",
    "Quality Management",
    "WBS (Work Breakdown Structure)",
    "RACI Matrix",
    "Meeting Facilitation",
  ],
  PRODUCT_MANAGER: [
    "Product Strategy",
    "Roadmapping",
    "Prioritization (RICE/Kano)",
    "User Stories",
    "JIRA",
    "Confluence",
    "Agile/Scrum",
    "A/B Testing",
    "Data Analytics",
    "Competitive Analysis",
    "Customer Research",
    "Stakeholder Alignment",
    "Go-to-Market Strategy",
    "Pricing Strategy",
    "Product Roadmap",
    "OKR / KPI Setting",
    "Wireframing",
    "Market Research",
  ],
  FINANCIAL_ANALYST: [
    "Excel (Advanced)",
    "Python",
    "Financial Modeling",
    "Power BI",
    "Tableau",
    "Bloomberg Terminal",
    "Valuation (DCF, Comparable)",
    "Financial Analysis",
    "Budgeting & Forecasting",
    "Risk Analysis",
    "SQL",
    "Accounting Principles",
    "Corporate Finance",
    "Investment Analysis",
    "Scenario Planning",
    "Presentation Skills",
  ],

  // ===================== ENGINEERING =====================
  MECHANICAL: [
    "AutoCAD",
    "SolidWorks",
    "CATIA",
    "Inventor",
    "MATLAB",
    "GD&T (Geometric Dimensioning)",
    "FEA (Finite Element Analysis)",
    "Thermodynamics",
    "Fluid Mechanics",
    "Manufacturing Processes",
    "3D Printing / Additive Manufacturing",
    "Material Science",
    "Technical Drawing",
    "Design for Manufacturing (DFM)",
    "Kinematics",
    "Machine Design",
    "Quality Control",
  ],
  ELECTRICAL: [
    "Circuit Design",
    "PCB Design (Altium/KiCad)",
    "MATLAB / Simulink",
    "VHDL",
    "Verilog",
    "Embedded C",
    "Power Systems",
    "PLC Programming",
    "SCADA",
    "Electronics Testing",
    "Signal Processing",
    "EMI/EMC",
    "Arduino / Raspberry Pi",
    "IoT Fundamentals",
    "Renewable Energy Systems",
    "Control Systems",
    "Hardware Debugging",
  ],
  CIVIL: [
    "AutoCAD",
    "Revit",
    "SAP2000",
    "STAAD Pro",
    "ETABS",
    "Structural Analysis",
    "Construction Management",
    "BIM (Building Information Modeling)",
    "Foundation Design",
    "Concrete Design",
    "Steel Design",
    "Roadway Design",
    "Hydrology",
    "Geotechnical Engineering",
    "Project Planning",
    "Quantity Surveying",
    "Cost Estimation",
    "Safety Regulations",
  ],
  QA_ENGINEERING: [
    "Python",
    "Java",
    "Selenium",
    "Cypress",
    "Playwright",
    "API Testing (Postman/RestAssured)",
    "CI/CD (Jenkins/GitHub Actions)",
    "Linux",
    "Docker",
    "SQL",
    "Test Automation Framework Design",
    "Performance Testing (JMeter/k6)",
    "Security Testing",
    "Mobile Testing",
    "TestNG",
    "JUnit",
    "Test Strategy",
    "Test Plan Design",
    "Bug Triage",
    "JIRA",
  ],

  // ===================== HEALTHCARE =====================
  CLINICAL: [
    "Patient Assessment",
    "Vital Signs Monitoring",
    "Clinical Documentation",
    "Medical Terminology",
    "EHR/EMR Systems",
    "HIPAA Compliance",
    "Diagnostic Procedures",
    "Treatment Planning",
    "Medication Administration",
    "Emergency Response",
    "Phlebotomy",
    "Wound Care",
    "Infection Control",
    "Patient Education",
    "Clinical Decision Making",
  ],
  PHARMACY: [
    "Pharmacology",
    "Drug Interactions",
    "Compounding",
    "Pharmacy Law & Regulations",
    "Medication Therapy Management (MTM)",
    "EHR/Pharmacy Systems",
    "Inventory Management",
    "Patient Counseling",
    "Drug Information Services",
    "Clinical Pharmacy",
    "Biostatistics",
    "Regulatory Affairs",
    "Quality Assurance",
    "Medication Safety",
    "Pharmacoeconomics",
  ],
  HEALTHCARE_MANAGEMENT: [
    "Healthcare Policy",
    "HIPAA Compliance",
    "Healthcare Law",
    "Leadership & Management",
    "EHR Implementation",
    "Revenue Cycle Management",
    "Medical Billing (CPT/ICD-10)",
    "Quality Improvement (Lean Six Sigma)",
    "Healthcare Informatics",
    "Staff Management",
    "Healthcare Finance",
    "Patient Experience",
    "Risk Management",
    "Strategic Planning",
    "Healthcare Analytics",
  ],
  MEDICAL_TECH: [
    "Medical Imaging (X-Ray, CT, MRI, Ultrasound)",
    "Radiology",
    "Laboratory Science",
    "Clinical Chemistry",
    "Hematology",
    "Bioinformatics",
    "Medical Device Operation",
    "Regulatory Affairs (FDA)",
    "Quality Control",
    "Biostatistics",
    "EHR Systems",
    "Safety Standards",
    "Specimen Processing",
    "Instrument Calibration",
  ],

  // ===================== EDUCATION =====================
  TEACHER: [
    "Classroom Management",
    "Instructional Design",
    "Curriculum Development",
    "Lesson Planning",
    "Assessment Design",
    "Student Engagement",
    "Differentiated Instruction",
    "Classroom Technology (SMART Board, LMS)",
    "Student Evaluation",
    "Feedback & Grading",
    "Parent Communication",
    "Special Education Awareness",
    "Behaviour Management",
    "Data-Driven Teaching",
    "Professional Development",
  ],
  INSTRUCTIONAL_DESIGNER: [
    "ADDIE Framework",
    "SAM Model",
    "Articulate 360",
    "Rise",
    "Canva",
    "Figma",
    "Adobe Captivate",
    "LMS (Moodle, Canvas, Blackboard)",
    "xAPI / CMI5",
    "Microlearning Design",
    "Multimedia Design",
    "Storyboard Creation",
    "Curriculum Mapping",
    "Needs Analysis",
    "Evaluation (Kirkpatrick)",
    "E-learning Authoring",
    "Mobile Learning Design",
    "Gamification",
  ],
  EDTECH_SPECIALIST: [
    "Learning Management System (LMS)",
    "EdTech Tools (Khan Academy, Coursera)",
    "Instructional Design",
    "Data Analytics (LMS Analytics)",
    "EdTech Implementation",
    "Digital Content Creation",
    "Online Assessment Design",
    "Blended Learning Design",
    "AI in Education",
    "Gamification in Learning",
    "AR/VR in Education",
    "Technical Support",
    "Digital Literacy",
    "Research & Evaluation",
  ],
  TUTOR: [
    "Subject Matter Expertise",
    "One-on-One Instruction",
    "Learning Strategies",
    "Progress Tracking",
    "Communication Skills",
    "Lesson Planning",
    "Student Motivation",
    "Exam Preparation",
    "Homework Support",
    "Feedback Techniques",
    "Diagnostic Assessment",
    "Study Skills Training",
    "Time Management Coaching",
    "Patience & Empathy",
  ],

  // ===================== LOGISTICS =====================
  SUPPLY_CHAIN: [
    "SAP (PP/MM)",
    "Oracle SCM Cloud",
    "Supply Chain Management",
    "Demand Forecasting",
    "S&OP",
    "Inventory Management",
    "Procurement",
    "Supplier Management",
    "Warehouse Operations",
    "Logistics Optimization",
    "Distribution Planning",
    "Supply Chain Analytics",
    "Cost Reduction",
    "Risk Management",
    "Lean Six Sigma",
    "International Trade",
    "Freight Management",
  ],
  WAREHOUSE: [
    "Warehouse Management System (WMS)",
    "SAP EWM",
    "Manhattan WMS",
    "Inventory Control",
    "Warehouse Layout Design",
    "Pick & Pack Operations",
    "Safety Standards (OSHA)",
    "Process Optimization",
    "KPI Tracking (Pick Rate, Accuracy)",
    "Staff Scheduling",
    "RF Scanning",
    "Barcode Systems",
    "Cross-docking",
    "Value-Added Services",
    "Cold Chain Management",
    "Vendor Management",
    "Cost Analysis",
    "Quality Assurance",
  ],
  TRANSPORT: [
    "Fleet Management",
    "Route Optimization",
    "TMS (Transportation Management)",
    "Regulatory Compliance (DOT, FMCSA)",
    "Fuel Management",
    "Driver Management",
    "Vehicle Maintenance Scheduling",
    "Cost Control",
    "Carrier Negotiation",
    "Load Planning",
    "International Shipping",
    "Last-Mile Delivery",
    "3PL Management",
    "GPS & Telematics",
    "HOS Compliance",
    "Dispatch Operations",
  ],
  LOGISTICS_ANALYST: [
    "Excel",
    "SQL",
    "Power BI",
    "Tableau",
    "Supply Chain Analytics",
    "Demand Forecasting",
    "Data Analysis",
    "KPI Dashboard Design",
    "Transportation Management",
    "Network Optimization",
    "Inventory Analysis",
    "Cost Modeling",
    "Python / R for Analytics",
    "Statistical Analysis",
    "Presentation & Reporting",
    "Process Improvement",
  ],

  // ===================== LEGAL =====================
  CORPORATE_LAW: [
    "Contract Drafting",
    "M&A Due Diligence",
    "Corporate Governance",
    "Regulatory Compliance",
    "Negotiation",
    "Legal Research",
    "Shareholder Agreements",
    "Joint Ventures",
    "IP in M&A",
    "Cross-border Transactions",
    "Corporate Restructuring",
    "Board Advisory",
    "Compliance Training",
    "Risk Assessment",
    "Document Review",
    "Contract Management",
    "Stakeholder Liaising",
  ],
  IP_LAW: [
    "Patent Law",
    "Trademark Law",
    "Copyright Law",
    "IP Portfolio Management",
    "Licensing Agreements",
    "Litigation Support",
    "Patent Search",
    "IP Due Diligence",
    "Tech Transfer",
    "Trade Secrets",
    "IP Licensing",
    "IP Auditing",
    "International IP",
    "IP Strategy",
    "Patent Prosecution",
    "Copyright Registration",
    "Trademark Registration",
  ],
  LEGAL_CONSULTANT: [
    "Legal Research",
    "Contract Review",
    "Regulatory Compliance",
    "Risk Assessment",
    "Corporate Law",
    "Commercial Law",
    "Dispute Resolution",
    "Legal Writing",
    "Client Advisory",
    "Compliance Frameworks",
    "Regulatory Analysis",
    "Policy Development",
    "Cross-functional Collaboration",
    "Negotiation",
    "Due Diligence",
  ],
  COMPLIANCE: [
    "Regulatory Compliance (AML/KYC)",
    "Risk Assessment",
    "Policy Development",
    "Audit",
    "AML / KYC",
    "Data Privacy (GDPR/CCPA)",
    "Internal Controls",
    "Compliance Training",
    "Regulatory Reporting",
    "Sanctions Screening",
    "Investigations",
    "Financial Crime Prevention",
    "SOX Compliance",
    "Third-party Due Diligence",
    "Regulatory Change Management",
  ],

  // ===================== ARTS =====================
  PHOTOGRAPHER: [
    "Adobe Photoshop",
    "Adobe Lightroom",
    "Capture One",
    "Camera Operation (DSLR/Mirrorless)",
    "Lighting Setup",
    "Composition",
    "Color Grading",
    "Color Theory",
    "Portrait Photography",
    "Product Photography",
    "Landscape Photography",
    "Photo Editing Workflow",
    "Retouching",
    "File Management (Lightroom)",
    "Studio Setup",
    "Client Communication",
    "Portfolio Building",
  ],
  VIDEOGRAPHER: [
    "Premiere Pro",
    "Final Cut Pro",
    "DaVinci Resolve",
    "Camera Operation",
    "Sound Design",
    "Lighting",
    "Video Editing",
    "Color Grading",
    "Motion Graphics",
    "Storytelling",
    "Scriptwriting",
    "Director of Photography",
    "Drone Videography",
    "Audio Recording",
    "Viral Content Strategy",
    "Social Media Video",
    "Documentary Filmmaking",
    "Client Brief Interpretation",
  ],
  "3D_ARTIST": [
    "Blender",
    "Maya",
    "Cinema 4D",
    "3ds Max",
    "ZBrush",
    "Substance Painter",
    "Substance Designer",
    "UV Mapping",
    "Rigging",
    "Texturing",
    "Lighting",
    "Rendering (Cycles/V-Ray)",
    "Animation",
    "Sculpting",
    "Hard-surface Modeling",
    "Character Design",
    "Environment Design",
    "Game Asset Creation",
    "Real-time Rendering (Unreal/Unity)",
  ],
  ILLUSTRATOR: [
    "Adobe Illustrator",
    "Procreate",
    "Clip Studio Paint",
    "Digital Painting",
    "Vector Illustration",
    "Character Design",
    "Concept Art",
    "Storyboarding",
    "Typography",
    "Color Theory",
    "Visual Storytelling",
    "Portraits",
    "Editorial Illustration",
    "Children Book Illustration",
    "Surface Pattern Design",
    "Brand Illustration",
    "Social Media Illustration",
    "NFT Illustration",
  ],

  // ===================== SERVICE =====================
  HOTEL_MANAGEMENT: [
    "Front Office Operations",
    "Revenue Management",
    "Guest Relations",
    "Housekeeping Management",
    "F&B Operations",
    "Hospitality Law",
    "OTA Management",
    "Reputation Management (Review返信)",
    "Booking Systems (Opera/SAP)",
    "Event Management",
    "Staff Training",
    "Budget Management",
    "Guest Satisfaction",
    "Crisis Management",
    "Upselling",
    "Cultural Intelligence",
  ],
  EVENT_PLANNER: [
    "Event Coordination",
    "Budget Management",
    "Vendor Management",
    "Risk Management",
    "Marketing & Promotion",
    "Logistics Planning",
    "Venue Selection",
    "Attendee Management",
    "Timeline Management",
    "Contract Negotiation",
    "Sponsorship Management",
    "Post-event Evaluation",
    "Social Event Planning",
    "Corporate Events",
    "Virtual/Hybrid Events",
    "Team Management",
    "Client Communication",
    "Crisis Management",
  ],
  CUSTOMER_SERVICE: [
    "Communication Skills",
    "Problem Solving",
    "CRM Systems (Zendesk/Intercom)",
    "Complaint Resolution",
    "Patience & Empathy",
    "Product Knowledge",
    "Active Listening",
    "Time Management",
    "Conflict Resolution",
    "Escalation Management",
    "Multitasking",
    "Telephony Systems",
    "Email Etiquette",
    "Live Chat Support",
    "Social Media Support",
    "Customer Retention",
    "Feedback Collection",
    "Service Recovery",
  ],
  "F&B_MANAGER": [
    "Food Safety (HACCP)",
    "Menu Engineering",
    "Cost Control",
    "Staff Management",
    "Customer Experience",
    "POS Systems",
    "Inventory Management",
    "Vendor Negotiation",
    "Kitchen Operations",
    "Sanitation Standards",
    "Health Regulations",
    "Training & Development",
    "Marketing",
    "Event Catering",
    "Quality Control",
    "Scheduling",
    "Profit & Loss Analysis",
    "Supplier Relations",
  ],

  // ===================== SOCIALCOMMUNITY =====================
  COMMUNITY_MANAGER: [
    "Content Strategy",
    "Engagement Tactics",
    "Moderation",
    "Analytics",
    "Crisis Management",
    "Social Media (Facebook/Discord/Telegram)",
    "Community Growth",
    "Member Retention",
    "Event Planning",
    "Brand Voice",
    "Reputation Management",
    "User Feedback Analysis",
    "Campaign Management",
    "Partnership Building",
    "Copywriting",
  ],
  SOCIAL_MEDIA: [
    "Content Creation",
    "Analytics (Meta Business, TikTok Analytics)",
    "Community Engagement",
    "Paid Advertising (Meta/TikTok/LinkedIn)",
    "Brand Voice",
    "Scheduling Tools (Hootsuite/Buffer)",
    "Influencer Marketing",
    "Community Building",
    "Viral Strategy",
    "Social Listening",
    "Campaign Tracking",
    "Trend Analysis",
    "UGC Strategy",
    "Hashtag Research",
    "Platform Algorithm Understanding",
  ],
  NGO_MANAGER: [
    "Project Management",
    "Fundraising Strategy",
    "Grant Writing",
    "Stakeholder Engagement",
    "Impact Measurement",
    "Budget Management",
    "Volunteer Coordination",
    "Board Relations",
    "Strategic Planning",
    "Advocacy Campaigns",
    "Donor Relations",
    "Social Media for Non-profits",
    "M&E (Monitoring & Evaluation)",
    "Partnership Development",
    "Annual Report Writing",
  ],
  VOLUNTEER_COORD: [
    "Volunteer Recruitment",
    "Volunteer Training",
    "Scheduling & Coordination",
    "Engagement Strategies",
    "Recognition Programs",
    "Event Coordination",
    "Communication",
    "Data Management",
    "Motivational Skills",
    "Crisis Volunteering",
    "Virtual Volunteering",
    "Compliance & Safety",
    "Outreach Programs",
    "Team Building",
    "Performance Evaluation",
  ],

  // ===================== AGRICULTUREENVIRONMENT =====================
  AGRICULTURE_SPECIALIST: [
    "Crop Management",
    "Soil Science",
    "Pest & Disease Control",
    "Sustainable Practices",
    "Agricultural Technology (AgriTech)",
    "Harvesting Techniques",
    "Irrigation Management",
    "Farm Planning",
    "Livestock Management",
    "Organic Farming",
    "Agronomy",
    "Post-harvest Handling",
    "Agricultural Economics",
    "Weather Analysis",
    "Precision Agriculture",
    "Quality Control",
    "Certification (Organic/GAP)",
  ],
  ENVIRONMENTAL_ENG: [
    "Environmental Impact Assessment (EIA)",
    "Water Treatment",
    "Waste Management",
    "EHS (Environment, Health & Safety)",
    "GIS",
    "Environmental Compliance",
    "Sustainability Reporting",
    "Pollution Control",
    "Remediation Design",
    "Renewable Energy",
    "Climate Change Mitigation",
    "Environmental Monitoring",
    "ISO 14001",
    "Life Cycle Assessment (LCA)",
    "Carbon Footprint Analysis",
    "Environmental Modeling",
  ],
  SUSTAINABILITY: [
    "ESG Reporting",
    "Carbon Accounting",
    "Circular Economy",
    "Stakeholder Engagement",
    "Sustainability Policy",
    "Sustainability Metrics",
    "Climate Risk Assessment",
    "Corporate Sustainability",
    "Renewable Energy Strategy",
    "Supply Chain Sustainability",
    "Green Building (LEED)",
    "Waste Reduction",
    "SDG Alignment",
    "Sustainability Reporting (GRI/SASB)",
    "Triple Bottom Line",
    "Life Cycle Assessment",
    "Carbon Markets",
    "Sustainable Finance",
  ],
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

  // Industry name matching ExpertPromptConfig.industry (from domainExpertMapper)
  industry?: string;

  // For career type: specific job role
  jobRole?: string;

  // Optional helper field from CareerForm (not sent to backend payload)
  roleKeywords?: string;

  // Optional fields
  skills?: string[];
  focusAreas?: string[];
  language?: string;
  duration?: string;
  questionCount?: number;
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
  industry?: string;
  subCategory?: string;
  jobRole?: string;
  type?: string;
  skills?: string[];
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
  highlightKeywords: string[];
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
  ASSESSMENT_COMPLETED = "ASSESSMENT_COMPLETED",
  TEST_COMPLETED = "TEST_COMPLETED",
  EVALUATION_COMPLETED = "EVALUATION_COMPLETED",
  ROADMAP_GENERATED = "ROADMAP_GENERATED",
  FIRST_NODE_COMPLETED = "FIRST_NODE_COMPLETED",
  HALFWAY_COMPLETED = "HALFWAY_COMPLETED",
  ALL_PLANS_CREATED = "ALL_PLANS_CREATED",
  JOURNEY_COMPLETED = "JOURNEY_COMPLETED",
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
