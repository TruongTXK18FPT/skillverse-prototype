/**
 * Domain Expert Mapper
 * Maps frontend domain/sub-category/job codes to backend ExpertPromptConfig
 * display names so journey selection aligns with expert chat and AI prompts.
 *
 * Frontend sends display names to backend → ExpertPromptService can do
 * exact match on (domain, industry, jobRole) → Expert chat works correctly.
 */

// ==================== Domain Code → Backend Domain Name ====================

export const DOMAIN_CODE_TO_NAME: Record<string, string> = {
  IT: 'Information Technology',
  DESIGN: 'Thiết kế – Sáng tạo – Nội dung',
  BUSINESS: 'Kinh doanh – Marketing – Quản trị',
  ENGINEERING: 'Kỹ thuật – Công nghiệp – Sản xuất',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education – Đào tạo – EdTech',
  LOGISTICS: 'Logistics – Chuỗi cung ứng – Xuất nhập khẩu',
  LEGAL: 'Legal & Public Administration',
  ARTS: 'Arts & Entertainment',
  SERVICE: 'Service & Hospitality',
  SOCIALCOMMUNITY: 'Công tác xã hội – Dịch vụ cộng đồng – Tổ chức phi lợi nhuận',
  AGRICULTUREENVIRONMENT: 'Agriculture – Environment',
};

export const DOMAIN_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_CODE_TO_NAME).map(([k, v]) => [v, k])
);

// ==================== Industry Mapping by Domain ====================
// Maps frontend subCategory → backend industry name

export const INDUSTRY_BY_DOMAIN: Record<string, Record<string, string>> = {
  IT: {
    WEB_DEV: 'Software Development',
    MOBILE_APP: 'Software Development',
    DATA_SCIENCE: 'Data Science',
    CLOUD_DEVOPS: 'Cloud & Infrastructure',
    AI_ML: 'Artificial Intelligence',
    GAME_DEV: 'Software Development',
    CYBERSECURITY: 'Cybersecurity',
    EMBEDDED: 'Electrical – Electronics Engineering',
  },
  DESIGN: {
    UI_DESIGN: 'UI/UX & Product Design',
    UX_DESIGN: 'UI/UX & Product Design',
    PRODUCT_DESIGN: 'UI/UX & Product Design',
    GRAPHIC_DESIGN: 'Graphic Design',
    MOTION_DESIGN: 'Motion & Video & Multimedia',
    BRAND_DESIGN: 'Graphic Design',
    '3D_MODELING': 'Motion & Video & Multimedia',
    ILLUSTRATION: 'Creative Content & Communication',
  },
  BUSINESS: {
    MARKETING: 'Marketing',
    SALES: 'Sales & Growth',
    PROJECT_MANAGEMENT: 'Business & Management',
    BUSINESS_ANALYTICS: 'Business & Management',
    PRODUCT_MANAGEMENT: 'Software Development',
    FINANCE: 'Finance & Banking',
    ENTREPRENEURSHIP: 'Entrepreneurship & Startup',
    CONSULTING: 'Entrepreneurship & Startup',
  },
  ENGINEERING: {
    MECHANICAL: 'Mechanical Engineering',
    ELECTRICAL: 'Electrical – Electronics Engineering',
    CIVIL: 'Civil Engineering – Construction',
    CHEMICAL: 'Industrial – Manufacturing – Supply Chain',
    INDUSTRIAL: 'Industrial – Manufacturing – Supply Chain',
    AUTOMOTIVE: 'Mechanical Engineering',
    AEROSPACE: 'Mechanical Engineering',
    ENVIRONMENTAL: 'Fire Safety – Environment – Occupational Safety',
  },
  HEALTHCARE: {
    CLINICAL: 'Medical Practice',
    NURSING: 'Nursing & Clinical Care',
    PHARMACY: 'Pharmacy – Dược',
    MEDICAL_TECH: 'Medical Technology – Xét nghiệm – Thiết bị',
    PUBLIC_HEALTH: 'Public Health – Fitness – Nutrition',
    MENTAL_HEALTH: 'Mental Health – Psychology',
    ALLIED_HEALTH: 'Medical Technology – Xét nghiệm – Thiết bị',
    HEALTHCARE_MGMT: 'Medical Practice',
  },
  EDUCATION: {
    K12_EDUCATION: 'Teaching',
    HIGHER_ED: 'Teaching',
    LANGUAGE: 'Teaching',
    ONLINE_LEARNING: 'EdTech – Đổi mới giáo dục',
    CORPORATE_TRAINING: 'Training – Coaching',
    EDTECH: 'EdTech – Đổi mới giáo dục',
    INSTRUCTIONAL: 'EdTech – Đổi mới giáo dục',
    TUTORING: 'Teaching',
  },
  LOGISTICS: {
    SUPPLY_CHAIN: 'Supply Chain Management',
    WAREHOUSE: 'Logistics Operations',
    TRANSPORT: 'Logistics Operations',
    PROCUREMENT: 'Supply Chain Management',
    INVENTORY: 'Logistics Operations',
    CUSTOM: 'Freight & Shipping',
    LAST_MILE: 'Logistics Operations',
    FREIGHT: 'Freight & Shipping',
  },
  LEGAL: {
    CORPORATE_LAW: 'Legal Practice',
    IP_LAW: 'Legal Practice',
    LABOR_LAW: 'Legal Practice',
    TAX_LAW: 'Legal Practice',
    COMMERCIAL_LAW: 'Legal Practice',
    COMPLIANCE: 'Legal Practice',
    LITIGATION: 'Judiciary & Court Services',
    LEGAL_CONSULT: 'Legal Practice',
  },
  ARTS: {
    PHOTOGRAPHY: 'Photography - Visual Arts',
    VIDEO_PROD: 'Motion & Video & Multimedia',
    MUSIC_AUDIO: 'Audio – Music – Voice',
    FILM_MAKING: 'Film – Stage – Production',
    PERFORMING: 'Performing Arts',
    FINE_ARTS: 'Photography - Visual Arts',
    CREATIVE_WRITING: 'Creative Content & Communication',
    ART_DIRECTION: 'Creative Content & Communication',
  },
  SERVICE: {
    HOSPITALITY: 'Hotel & Hospitality',
    FOOD_BEV: 'Food & Beverage',
    TRAVEL_TOURISM: 'Travel – Tourism – Event',
    EVENTS: 'Travel – Tourism – Event',
    CUSTOMER_SERVICE: 'Customer Service – Call Center',
    HR_SERVICE: 'Business & Management',
    CONSULTING_SVC: 'Business & Management',
    MAINTENANCE: 'Mechanical Engineering',
  },
  SOCIALCOMMUNITY: {
    COMMUNITY_MGR: 'Community Development',
    SOCIAL_MEDIA_MGR: 'Creative Content & Communication',
    CONTENT_CREATOR: 'Creative Content & Communication',
    NGO_MGMT: 'Nonprofit & Public Service',
    VOLUNTEER_MGMT: 'Nonprofit & Public Service',
    FUNDRAISING: 'Nonprofit & Public Service',
    PUBLIC_RELATIONS: 'Creative Content & Communication',
    ADVOCACY: 'Community Development',
  },
  AGRICULTUREENVIRONMENT: {
    AGRI_PRODUCTION: 'Agriculture',
    AGRI_TECH: 'Agriculture',
    ANIMAL_HUSBANDRY: 'Livestock – Veterinary',
    ENV_ENG: 'Environment – Conservation',
    SUSTAINABILITY: 'Environment – Conservation',
    RENEWABLE_ENERGY: 'Electrical – Electronics Engineering',
    WASTE_MGMT: 'Environment – Conservation',
    WATER_RESOURCES: 'Climate – Water – Meteorology',
  },
};

// ==================== Job Roles by Industry (Domain → Industry → Roles) ====================
// Maps (domain + subCategory) → list of { code, label } → backend jobRole name

interface RoleEntry {
  code: string;
  label: string;
  backendRole: string;
}

export const ROLES_BY_DOMAIN_INDUSTRY: Record<string, Record<string, RoleEntry[]>> = {
  IT: {
    WEB_DEV: [
      { code: 'FRONTEND', label: 'Frontend Developer', backendRole: 'Frontend Developer' },
      { code: 'BACKEND', label: 'Backend Developer', backendRole: 'Backend Developer' },
      { code: 'FULLSTACK', label: 'Full-stack Developer', backendRole: 'Fullstack Developer' },
    ],
    MOBILE_APP: [
      { code: 'MOBILE', label: 'Mobile Developer', backendRole: 'Mobile Developer' },
      { code: 'FLUTTER', label: 'Flutter Developer', backendRole: 'Mobile Developer' },
      { code: 'REACT_NATIVE', label: 'React Native Developer', backendRole: 'Mobile Developer' },
    ],
    DATA_SCIENCE: [
      { code: 'DATA_ANALYST', label: 'Data Analyst', backendRole: 'Data Analyst' },
      { code: 'DATA_SCIENTIST', label: 'Data Scientist', backendRole: 'Data Scientist' },
      { code: 'BI_ANALYST', label: 'Business Intelligence Analyst', backendRole: 'Business Intelligence Analyst' },
    ],
    CLOUD_DEVOPS: [
      { code: 'DEVOPS', label: 'DevOps Engineer', backendRole: 'DevOps Engineer' },
      { code: 'CLOUD_ENGINEER', label: 'Cloud Engineer', backendRole: 'Cloud Engineer' },
      { code: 'CLOUD_ARCHITECT', label: 'Cloud Architect', backendRole: 'Cloud Architect' },
      { code: 'SYSADMIN', label: 'System Administrator', backendRole: 'System Administrator' },
    ],
    AI_ML: [
      { code: 'ML_AI', label: 'ML/AI Engineer', backendRole: 'Machine Learning Engineer' },
      { code: 'AI_ENGINEER', label: 'AI Engineer', backendRole: 'AI Engineer' },
      { code: 'DATA_ENGINEER', label: 'Data Engineer', backendRole: 'Data Engineer' },
    ],
    GAME_DEV: [
      { code: 'GAME_DEV', label: 'Game Developer', backendRole: 'Game Artist' },
      { code: 'GAME_ARTIST', label: 'Game Artist', backendRole: 'Game Artist (2D/3D)' },
    ],
    CYBERSECURITY: [
      { code: 'SECURITY_ANALYST', label: 'Security Analyst', backendRole: 'Cybersecurity Analyst' },
      { code: 'PEN_TESTER', label: 'Penetration Tester', backendRole: 'Penetration Tester' },
      { code: 'SOC_ANALYST', label: 'SOC Analyst', backendRole: 'SOC Analyst' },
    ],
    EMBEDDED: [
      { code: 'EMBEDDED_DEV', label: 'Embedded Developer', backendRole: 'Electronics Engineer' },
      { code: 'FIRMWARE', label: 'Firmware Engineer', backendRole: 'Electronics Engineer' },
    ],
  },

  DESIGN: {
    UI_DESIGN: [
      { code: 'UI_DESIGNER', label: 'UI Designer', backendRole: 'UI Designer' },
      { code: 'VISUAL_DESIGNER', label: 'Visual Designer', backendRole: 'Visual Designer' },
    ],
    UX_DESIGN: [
      { code: 'UX_DESIGNER', label: 'UX Designer', backendRole: 'UX Designer' },
      { code: 'UX_RESEARCHER', label: 'UX Researcher', backendRole: 'UX Researcher' },
      { code: 'UX_WRITER', label: 'UX Writer', backendRole: 'UX Designer' },
    ],
    PRODUCT_DESIGN: [
      { code: 'PRODUCT_DESIGNER', label: 'Product Designer', backendRole: 'Product Designer' },
      { code: 'UX_DESIGNER', label: 'UX Designer', backendRole: 'UX Designer' },
    ],
    GRAPHIC_DESIGN: [
      { code: 'GRAPHIC_DESIGNER', label: 'Graphic Designer', backendRole: 'Graphic Designer' },
      { code: 'BRAND_DESIGNER', label: 'Brand Designer', backendRole: 'Brand Designer' },
      { code: 'LOGO_DESIGNER', label: 'Logo & Identity Designer', backendRole: 'Logo & Identity Designer' },
    ],
    MOTION_DESIGN: [
      { code: 'MOTION_DESIGNER', label: 'Motion Designer', backendRole: 'Motion Graphic Designer' },
      { code: 'MOTION_GRAPHICS', label: 'Motion Graphics Artist', backendRole: 'Motion Graphic Designer' },
    ],
    BRAND_DESIGN: [
      { code: 'BRAND_DESIGNER', label: 'Brand Designer', backendRole: 'Brand Designer' },
      { code: 'ART_DIRECTOR', label: 'Art Director', backendRole: 'Art Director (AD)' },
    ],
    '3D_MODELING': [
      { code: '3D_ARTIST', label: '3D Artist', backendRole: '3D Artist' },
      { code: '3D_MODELER', label: '3D Modeler', backendRole: '3D Modeler' },
      { code: 'ENV_ARTIST', label: 'Environment Artist', backendRole: 'Environment Artist' },
    ],
    ILLUSTRATION: [
      { code: 'ILLUSTRATOR', label: 'Illustrator', backendRole: 'Illustrator' },
      { code: 'CONCEPT_ARTIST', label: 'Concept Artist', backendRole: 'Concept Artist' },
      { code: 'DIGITAL_PAINTER', label: 'Digital Painter', backendRole: 'Digital Painter' },
    ],
  },

  BUSINESS: {
    MARKETING: [
      { code: 'DIGITAL_MARKETING', label: 'Digital Marketing', backendRole: 'Digital Marketing' },
      { code: 'CONTENT_MARKETING', label: 'Content Marketing', backendRole: 'Content Marketing' },
      { code: 'SEO_SPECIALIST', label: 'SEO Specialist', backendRole: 'SEO Specialist' },
      { code: 'SOCIAL_MEDIA_EXEC', label: 'Social Media Executive', backendRole: 'Social Media Executive' },
      { code: 'EMAIL_MARKETING', label: 'Email Marketing', backendRole: 'Email Marketing' },
      { code: 'PERFORMANCE_MARKETING', label: 'Performance Marketing', backendRole: 'Performance Marketing' },
    ],
    SALES: [
      { code: 'SALES_EXEC', label: 'Sales Executive', backendRole: 'Sales Executive' },
      { code: 'B2B_SALES', label: 'B2B Sales', backendRole: 'B2B Sales' },
      { code: 'BD_EXEC', label: 'Business Development', backendRole: 'Business Development (BD)' },
      { code: 'GROWTH_MARKETER', label: 'Growth Marketer', backendRole: 'Growth Marketer' },
    ],
    PROJECT_MANAGEMENT: [
      { code: 'PROJECT_MANAGER', label: 'Project Manager', backendRole: 'Project Manager' },
      { code: 'BUSINESS_ANALYST', label: 'Business Analyst', backendRole: 'Business Analyst (BA)' },
      { code: 'SCRUM_MASTER', label: 'Scrum Master', backendRole: 'Product Owner' },
    ],
    BUSINESS_ANALYTICS: [
      { code: 'BUSINESS_ANALYST', label: 'Business Analyst', backendRole: 'Business Analyst (BA)' },
      { code: 'DATA_ANALYST', label: 'Data Analyst', backendRole: 'Data Analyst' },
    ],
    PRODUCT_MANAGEMENT: [
      { code: 'PRODUCT_MANAGER', label: 'Product Manager', backendRole: 'Product Manager' },
      { code: 'PRODUCT_OWNER', label: 'Product Owner', backendRole: 'Product Owner' },
    ],
    FINANCE: [
      { code: 'FINANCIAL_ANALYST', label: 'Financial Analyst', backendRole: 'Corporate Finance Analyst' },
      { code: 'ACCOUNTANT', label: 'Accountant', backendRole: 'Accountant' },
      { code: 'INVESTMENT_ANALYST', label: 'Investment Analyst', backendRole: 'Investment Analyst' },
    ],
    ENTREPRENEURSHIP: [
      { code: 'STARTUP_FOUNDER', label: 'Startup Founder', backendRole: 'Startup Founder' },
      { code: 'BUSINESS_CONSULTANT', label: 'Business Consultant', backendRole: 'Business Consultant' },
      { code: 'FREELANCER', label: 'Freelancer', backendRole: 'Freelancer' },
    ],
    CONSULTING: [
      { code: 'BUSINESS_CONSULTANT', label: 'Business Consultant', backendRole: 'Business Consultant' },
      { code: 'STRATEGY_CONSULTANT', label: 'Strategy Consultant', backendRole: 'Business Consultant' },
    ],
  },

  ENGINEERING: {
    MECHANICAL: [
      { code: 'MECHANICAL', label: 'Mechanical Engineer', backendRole: 'Mechanical Engineer' },
      { code: 'CNC_MACHINIST', label: 'CNC Machinist', backendRole: 'CNC Machinist' },
      { code: 'MANUFACTURING_ENG', label: 'Manufacturing Engineer', backendRole: 'Manufacturing Engineer' },
      { code: 'AUTOMOTIVE', label: 'Automotive Technician', backendRole: 'Automotive Mechanical Technician' },
    ],
    ELECTRICAL: [
      { code: 'ELECTRICAL', label: 'Electrical Engineer', backendRole: 'Electrical Engineer' },
      { code: 'ELECTRONICS', label: 'Electronics Engineer', backendRole: 'Electronics Engineer' },
      { code: 'PCB_ENGINEER', label: 'PCB Engineer', backendRole: 'PCB Engineer' },
      { code: 'POWER_SYSTEMS', label: 'Power Systems Engineer', backendRole: 'Power Systems Engineer' },
    ],
    CIVIL: [
      { code: 'CIVIL', label: 'Civil Engineer', backendRole: 'Civil Engineer' },
      { code: 'STRUCTURAL_ENG', label: 'Structural Engineer', backendRole: 'Structural Engineer' },
      { code: 'BIM_ENGINEER', label: 'BIM Engineer', backendRole: 'BIM Engineer' },
      { code: 'CONSTRUCTION_MGR', label: 'Construction Manager', backendRole: 'Construction Manager' },
      { code: 'QUANTITY_SURVEYOR', label: 'Quantity Surveyor', backendRole: 'Quantity Surveyor' },
    ],
    CHEMICAL: [
      { code: 'INDUSTRIAL_ENG', label: 'Industrial Engineer', backendRole: 'Industrial Engineer' },
      { code: 'QC_QA', label: 'QC/QA Engineer', backendRole: 'Quality Control (QC/QA)' },
      { code: 'PRODUCTION_PLANNER', label: 'Production Planner', backendRole: 'Production Planner' },
    ],
    INDUSTRIAL: [
      { code: 'INDUSTRIAL_ENG', label: 'Industrial Engineer', backendRole: 'Industrial Engineer' },
      { code: 'LEAN_SPECIALIST', label: 'Lean Manufacturing Specialist', backendRole: 'Lean Manufacturing Specialist' },
      { code: 'PRODUCTION_PLANNER', label: 'Production Planner', backendRole: 'Production Planner' },
      { code: 'MAINTENANCE_ENG', label: 'Maintenance Engineer', backendRole: 'Maintenance Engineer' },
    ],
    AUTOMOTIVE: [
      { code: 'AUTOMOTIVE', label: 'Automotive Mechanical Technician', backendRole: 'Automotive Mechanical Technician' },
      { code: 'MECHATRONICS', label: 'Mechatronics Engineer', backendRole: 'Mechatronics Engineer' },
    ],
    AEROSPACE: [
      { code: 'AEROSPACE_ENG', label: 'Aerospace Engineer', backendRole: 'Mechanical Engineer' },
    ],
    ENVIRONMENTAL: [
      { code: 'ENV_ENG', label: 'Environmental Engineer', backendRole: 'Environmental Engineer' },
      { code: 'HSE_ENGINEER', label: 'HSE Engineer', backendRole: 'HSE Engineer (Health – Safety – Environment)' },
      { code: 'FIRE_PROTECTION', label: 'Fire Protection Engineer', backendRole: 'Fire Protection Engineer' },
    ],
  },

  HEALTHCARE: {
    CLINICAL: [
      { code: 'GENERAL_DOCTOR', label: 'General Doctor', backendRole: 'General Doctor' },
      { code: 'SPECIALIST_DOCTOR', label: 'Specialist Doctor', backendRole: 'Specialist Doctor' },
      { code: 'SURGEON', label: 'Surgeon', backendRole: 'Surgeon' },
    ],
    NURSING: [
      { code: 'REGISTERED_NURSE', label: 'Registered Nurse', backendRole: 'Registered Nurse' },
      { code: 'ICU_NURSE', label: 'ICU Nurse', backendRole: 'ICU Nurse' },
      { code: 'EMERGENCY_NURSE', label: 'Emergency Care Nurse', backendRole: 'Emergency Care Nurse' },
    ],
    PHARMACY: [
      { code: 'PHARMACIST', label: 'Pharmacist', backendRole: 'Pharmacist' },
      { code: 'CLINICAL_PHARMACIST', label: 'Clinical Pharmacist', backendRole: 'Clinical Pharmacist' },
      { code: 'PHARMACY_ASST', label: 'Pharmacy Assistant', backendRole: 'Pharmacy Assistant' },
    ],
    MEDICAL_TECH: [
      { code: 'MEDICAL_LAB_TECH', label: 'Medical Laboratory Technician', backendRole: 'Medical Laboratory Technician' },
      { code: 'RADIOLOGIC_TECH', label: 'Radiologic Technologist', backendRole: 'Radiologic Technologist' },
      { code: 'ULTRASOUND_TECH', label: 'Ultrasound Technician', backendRole: 'Ultrasound Technician' },
      { code: 'BIOMEDICAL_ENG', label: 'Biomedical Engineer', backendRole: 'Biomedical Engineer' },
    ],
    PUBLIC_HEALTH: [
      { code: 'PUBLIC_HEALTH_SPEC', label: 'Public Health Specialist', backendRole: 'Public Health Specialist' },
      { code: 'NUTRITIONIST', label: 'Nutritionist', backendRole: 'Nutritionist' },
      { code: 'FITNESS_COACH', label: 'Fitness Coach', backendRole: 'Fitness Coach' },
    ],
    MENTAL_HEALTH: [
      { code: 'PSYCHOLOGIST', label: 'Psychologist', backendRole: 'Psychologist' },
      { code: 'PSYCHOTHERAPIST', label: 'Psychotherapist', backendRole: 'Psychotherapist' },
      { code: 'BEHAVIORAL_THERAPIST', label: 'Behavioral Therapist', backendRole: 'Behavioral Therapist' },
      { code: 'COUNSELOR', label: 'Mental Health Counselor', backendRole: 'Mental Health Counselor' },
    ],
    ALLIED_HEALTH: [
      { code: 'PHYSIO_THERAPIST', label: 'Physiotherapist', backendRole: 'Occupational Therapist' },
      { code: 'SPEECH_THERAPIST', label: 'Speech Therapist', backendRole: 'Speech Therapist' },
    ],
    HEALTHCARE_MGMT: [
      { code: 'HEALTHCARE_MGMT', label: 'Healthcare Manager', backendRole: 'Healthcare Manager' },
      { code: 'CLINICAL_DIRECTOR', label: 'Clinical Director', backendRole: 'Healthcare Manager' },
    ],
  },

  EDUCATION: {
    K12_EDUCATION: [
      { code: 'PRESCHOOL_TEACHER', label: 'Preschool Teacher', backendRole: 'Preschool Teacher' },
      { code: 'PRIMARY_TEACHER', label: 'Primary Teacher', backendRole: 'Primary Teacher' },
      { code: 'SECONDARY_TEACHER', label: 'Secondary Teacher', backendRole: 'Secondary Teacher' },
    ],
    HIGHER_ED: [
      { code: 'UNIVERSITY_LECTURER', label: 'University Lecturer', backendRole: 'University Lecturer' },
      { code: 'RESEARCH_ASSISTANT', label: 'Research Assistant', backendRole: 'University Lecturer' },
    ],
    LANGUAGE: [
      { code: 'ESL_TEACHER', label: 'ESL Teacher', backendRole: 'ESL Teacher' },
      { code: 'FOREIGN_LANG_TEACHER', label: 'Foreign Language Teacher', backendRole: 'ESL Teacher' },
    ],
    ONLINE_LEARNING: [
      { code: 'ELEARNING_DEV', label: 'E-learning Content Creator', backendRole: 'E-learning Content Creator' },
      { code: 'ONLINE_COURSE_CREATOR', label: 'Online Course Creator', backendRole: 'Online Course Creator' },
    ],
    CORPORATE_TRAINING: [
      { code: 'CORPORATE_TRAINER', label: 'Corporate Trainer', backendRole: 'Corporate Trainer' },
      { code: 'LND_SPECIALIST', label: 'L&D Specialist', backendRole: 'Learning & Development Specialist' },
      { code: 'SOFT_SKILLS_TRAINER', label: 'Soft Skills Trainer', backendRole: 'Soft Skills Trainer' },
      { code: 'CAREER_COACH', label: 'Career Coach', backendRole: 'Career Coach' },
    ],
    EDTECH: [
      { code: 'EDTECH_SPECIALIST', label: 'EdTech Specialist', backendRole: 'EdTech Product Specialist' },
      { code: 'INSTRUCTIONAL_DESIGNER', label: 'Instructional Designer', backendRole: 'Instructional Designer' },
    ],
    INSTRUCTIONAL: [
      { code: 'INSTRUCTIONAL_DESIGNER', label: 'Instructional Designer', backendRole: 'Instructional Designer' },
      { code: 'CURRICULUM_DEV', label: 'Curriculum Developer', backendRole: 'Curriculum Developer' },
    ],
    TUTORING: [
      { code: 'TUTOR', label: 'Tutor', backendRole: 'Tutor' },
      { code: 'ACADEMIC_TUTOR', label: 'Academic Tutor', backendRole: 'Tutor' },
    ],
  },

  LOGISTICS: {
    SUPPLY_CHAIN: [
      { code: 'SUPPLY_CHAIN_MGR', label: 'Supply Chain Manager', backendRole: 'Supply Chain Manager' },
      { code: 'SUPPLY_CHAIN_ANALYST', label: 'Supply Chain Analyst', backendRole: 'Supply Chain Analyst' },
      { code: 'DEMAND_PLANNER', label: 'Demand Planner', backendRole: 'Demand Planner' },
      { code: 'PROCUREMENT_OFFICER', label: 'Procurement Officer', backendRole: 'Procurement Officer' },
    ],
    WAREHOUSE: [
      { code: 'WAREHOUSE_MGR', label: 'Warehouse Manager', backendRole: 'Warehouse Manager' },
      { code: 'WAREHOUSE_STAFF', label: 'Warehouse Staff', backendRole: 'Warehouse Staff' },
      { code: 'INVENTORY_CONTROLLER', label: 'Inventory Controller', backendRole: 'Inventory Controller' },
    ],
    TRANSPORT: [
      { code: 'TRANSPORT_MGR', label: 'Transport Manager', backendRole: 'Fleet Manager' },
      { code: 'FLEET_MGR', label: 'Fleet Manager', backendRole: 'Fleet Manager' },
      { code: 'TRANSPORT_PLANNER', label: 'Transport Planner', backendRole: 'Transport Planner' },
    ],
    PROCUREMENT: [
      { code: 'PROCUREMENT_OFFICER', label: 'Procurement Officer', backendRole: 'Procurement Officer' },
      { code: 'VENDOR_MGR', label: 'Vendor Management Specialist', backendRole: 'Vendor Management Specialist' },
    ],
    INVENTORY: [
      { code: 'INVENTORY_CONTROLLER', label: 'Inventory Controller', backendRole: 'Inventory Controller' },
      { code: 'FULFILLMENT_SPEC', label: 'Fulfillment Specialist', backendRole: 'Fulfillment Specialist' },
    ],
    CUSTOM: [
      { code: 'CUSTOMS_CLEARANCE', label: 'Customs Clearance Staff', backendRole: 'Customs Clearance Staff' },
      { code: 'CUSTOMS_OFFICER', label: 'Customs Officer', backendRole: 'Customs Officer' },
    ],
    LAST_MILE: [
      { code: 'LAST_MILE_MGR', label: 'Last Mile Manager', backendRole: 'Distribution Center Operator' },
      { code: 'FULFILLMENT_SPEC', label: 'Fulfillment Specialist', backendRole: 'Fulfillment Specialist' },
    ],
    FREIGHT: [
      { code: 'FREIGHT_FORWARDER', label: 'Freight Forwarder', backendRole: 'Freight Forwarder' },
      { code: 'OCEAN_FREIGHT', label: 'Ocean Freight Specialist', backendRole: 'Ocean Freight Specialist' },
      { code: 'AIR_FREIGHT', label: 'Air Freight Specialist', backendRole: 'Air Freight Specialist' },
    ],
  },

  LEGAL: {
    CORPORATE_LAW: [
      { code: 'CORPORATE_LAWYER', label: 'Corporate Lawyer', backendRole: 'Lawyer' },
      { code: 'CORPORATE_LEGAL_SPEC', label: 'Corporate Legal Specialist', backendRole: 'Corporate Legal Specialist' },
    ],
    IP_LAW: [
      { code: 'IP_LAWYER', label: 'IP Lawyer', backendRole: 'Intellectual Property Specialist' },
      { code: 'IP_SPECIALIST', label: 'IP Specialist', backendRole: 'Intellectual Property Specialist' },
    ],
    LABOR_LAW: [
      { code: 'LABOR_LAWYER', label: 'Labor Lawyer', backendRole: 'Legal Consultant' },
      { code: 'HR_LEGAL', label: 'HR Legal Officer', backendRole: 'Legal Executive' },
    ],
    TAX_LAW: [
      { code: 'TAX_LAWYER', label: 'Tax Lawyer', backendRole: 'Accountant' },
      { code: 'TAX_CONSULTANT', label: 'Tax Consultant', backendRole: 'Accountant' },
    ],
    COMMERCIAL_LAW: [
      { code: 'COMMERCIAL_LAWYER', label: 'Commercial Lawyer', backendRole: 'Lawyer' },
      { code: 'CONTRACT_SPEC', label: 'Contract Specialist', backendRole: 'Contract Specialist' },
    ],
    COMPLIANCE: [
      { code: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', backendRole: 'Compliance Officer' },
      { code: 'COMPLIANCE_SPEC', label: 'Compliance Specialist', backendRole: 'Compliance Officer' },
    ],
    LITIGATION: [
      { code: 'LITIGATION_LAWYER', label: 'Litigation Lawyer', backendRole: 'Lawyer' },
      { code: 'JUDGE_ASST', label: 'Judge Assistant', backendRole: 'Judge Assistant' },
      { code: 'MEDIATOR', label: 'Mediator/Arbitrator', backendRole: 'Mediator/Arbitrator' },
    ],
    LEGAL_CONSULT: [
      { code: 'LEGAL_CONSULTANT', label: 'Legal Consultant', backendRole: 'Legal Consultant' },
      { code: 'LEGAL_EXEC', label: 'Legal Executive', backendRole: 'Legal Executive' },
      { code: 'NOTARY', label: 'Notary Officer', backendRole: 'Notary Officer' },
    ],
  },

  ARTS: {
    PHOTOGRAPHY: [
      { code: 'PHOTOGRAPHER', label: 'Photographer', backendRole: 'Photographer' },
      { code: 'PHOTO_EDITOR', label: 'Photo Editor', backendRole: 'Photo Editor' },
      { code: 'PHOTO_RETOUCHER', label: 'Photo Retoucher', backendRole: 'Photo Retoucher' },
    ],
    VIDEO_PROD: [
      { code: 'VIDEOGRAPHER', label: 'Videographer', backendRole: 'Videographer' },
      { code: 'VIDEO_EDITOR', label: 'Video Editor', backendRole: 'Video Editor' },
      { code: 'VFX_ARTIST', label: 'VFX Artist', backendRole: 'VFX Artist' },
      { code: 'VIDEO_PRODUCER', label: 'Video Content Producer', backendRole: 'Video Content Producer' },
    ],
    MUSIC_AUDIO: [
      { code: 'MUSIC_PRODUCER', label: 'Music Producer', backendRole: 'Music Producer' },
      { code: 'MUSIC_COMPOSER', label: 'Music Composer', backendRole: 'Music Composer' },
      { code: 'SOUND_DESIGNER', label: 'Sound Designer', backendRole: 'Sound Designer' },
      { code: 'AUDIO_ENGINEER', label: 'Audio Engineer', backendRole: 'Audio Engineer' },
      { code: 'VOICE_ACTOR', label: 'Voice Actor', backendRole: 'Voice Actor' },
    ],
    FILM_MAKING: [
      { code: 'FILM_DIRECTOR', label: 'Film Director', backendRole: 'Film Director' },
      { code: 'SCREENWRITER', label: 'Screenwriter', backendRole: 'Screenwriter' },
      { code: 'PRODUCER', label: 'Producer', backendRole: 'Producer' },
      { code: 'CASTING_DIRECTOR', label: 'Casting Director', backendRole: 'Casting Director' },
    ],
    PERFORMING: [
      { code: 'SINGER', label: 'Singer', backendRole: 'Singer' },
      { code: 'DANCER', label: 'Dancer', backendRole: 'Dancer' },
      { code: 'ACTOR', label: 'Actor/Actress', backendRole: 'Actor / Actress' },
      { code: 'STAGE_PERFORMER', label: 'Stage Performer', backendRole: 'Stage Performer' },
    ],
    FINE_ARTS: [
      { code: 'CONCEPT_ARTIST', label: 'Concept Artist', backendRole: 'Concept Artist' },
      { code: 'DIGITAL_PAINTER', label: 'Digital Painter', backendRole: 'Digital Painter' },
      { code: 'FINE_ARTS_ARTIST', label: 'Fine Arts Artist', backendRole: 'Illustrator' },
    ],
    CREATIVE_WRITING: [
      { code: 'COPYWRITER', label: 'Copywriter', backendRole: 'Copywriter' },
      { code: 'CONTENT_WRITER', label: 'Content Creator', backendRole: 'Content Creator' },
      { code: 'CREATIVE_COPYWRITER', label: 'Creative Copywriter', backendRole: 'Creative Copywriter' },
    ],
    ART_DIRECTION: [
      { code: 'ART_DIRECTOR', label: 'Art Director', backendRole: 'Art Director (AD)' },
      { code: 'CREATIVE_DIRECTOR', label: 'Creative Director', backendRole: 'Creative Director (CD)' },
      { code: 'CHOREOGRAPHER', label: 'Choreographer', backendRole: 'Choreographer' },
    ],
  },

  SERVICE: {
    HOSPITALITY: [
      { code: 'HOTEL_RECEPTIONIST', label: 'Hotel Receptionist', backendRole: 'Hotel Receptionist' },
      { code: 'HOTEL_GM', label: 'Hotel General Manager', backendRole: 'Hotel General Manager' },
      { code: 'FRONT_OFFICE_MGR', label: 'Front Office Manager', backendRole: 'Front Office Manager' },
      { code: 'CONCIERGE', label: 'Concierge', backendRole: 'Concierge' },
    ],
    FOOD_BEV: [
      { code: 'WAITER', label: 'Waiter/Waitress', backendRole: 'Waiter/Waitress' },
      { code: 'BARISTA', label: 'Barista', backendRole: 'Barista' },
      { code: 'BARTENDER', label: 'Bartender', backendRole: 'Bartender' },
      { code: 'RESTAURANT_MGR', label: 'Restaurant Manager', backendRole: 'Restaurant Manager' },
      { code: 'FB_SUPERVISOR', label: 'F&B Supervisor', backendRole: 'F&B Supervisor' },
    ],
    TRAVEL_TOURISM: [
      { code: 'TOUR_GUIDE', label: 'Tour Guide', backendRole: 'Tour Guide' },
      { code: 'TRAVEL_CONSULTANT', label: 'Travel Consultant', backendRole: 'Travel Consultant' },
      { code: 'EVENT_PLANNER', label: 'Event Planner', backendRole: 'Event Coordinator' },
      { code: 'EVENT_MGR', label: 'Event Manager', backendRole: 'Event Manager' },
    ],
    EVENTS: [
      { code: 'EVENT_COORDINATOR', label: 'Event Coordinator', backendRole: 'Event Coordinator' },
      { code: 'EVENT_MGR', label: 'Event Manager', backendRole: 'Event Manager' },
      { code: 'EVENT_ASST', label: 'Event Assistant', backendRole: 'Event Assistant' },
      { code: 'CATERING_COORD', label: 'Catering Coordinator', backendRole: 'Catering Coordinator' },
    ],
    CUSTOMER_SERVICE: [
      { code: 'CS_REP', label: 'Customer Service Representative', backendRole: 'Customer Service Representative' },
      { code: 'CALL_CENTER_AGENT', label: 'Call Center Agent', backendRole: 'Call Center Agent' },
      { code: 'LIVE_CHAT_SUPPORT', label: 'Live Chat Support', backendRole: 'Live Chat Support' },
      { code: 'TECHNICAL_SUPPORT', label: 'Technical Support', backendRole: 'Technical Support' },
    ],
    HR_SERVICE: [
      { code: 'HR_RECRUITER', label: 'HR Recruiter', backendRole: 'HR - Recruitment' },
      { code: 'HR_TALENT_DEV', label: 'HR Talent Development', backendRole: 'HR - Talent Development' },
    ],
    CONSULTING_SVC: [
      { code: 'CONSULTANT', label: 'Consultant', backendRole: 'Business Consultant' },
      { code: 'BUSINESS_CONSULTANT', label: 'Business Consultant', backendRole: 'Business Consultant' },
    ],
    MAINTENANCE: [
      { code: 'MAINTENANCE_ENG', label: 'Maintenance Engineer', backendRole: 'Maintenance Engineer' },
      { code: 'FACILITIES_MGR', label: 'Facilities Manager', backendRole: 'Operations Executive/Manager' },
    ],
  },

  SOCIALCOMMUNITY: {
    COMMUNITY_MGR: [
      { code: 'COMMUNITY_MGR', label: 'Community Development Officer', backendRole: 'Community Development Officer' },
      { code: 'YOUTH_WORKER', label: 'Youth Worker', backendRole: 'Youth Worker' },
      { code: 'PROGRAM_COORD', label: 'Social Program Coordinator', backendRole: 'Social Program Coordinator' },
    ],
    SOCIAL_MEDIA_MGR: [
      { code: 'SOCIAL_MEDIA_MGR', label: 'Social Media Creative', backendRole: 'Social Media Creative' },
      { code: 'KOL_KOC', label: 'KOL/KOC/Influencer', backendRole: 'KOL / KOC / Influencer' },
      { code: 'STREAMER', label: 'Streamer', backendRole: 'Streamer' },
    ],
    CONTENT_CREATOR: [
      { code: 'CONTENT_CREATOR', label: 'Content Creator', backendRole: 'Content Creator' },
      { code: 'PODCASTER', label: 'Podcaster', backendRole: 'Podcaster' },
      { code: 'SOCIAL_ENTERTAINER', label: 'Social Media Entertainer', backendRole: 'Social Media Entertainer' },
    ],
    NGO_MGMT: [
      { code: 'NGO_COORD', label: 'NGO Coordinator', backendRole: 'NGO Coordinator' },
      { code: 'NGO_PROJECT_OFFICER', label: 'NGO Project Officer', backendRole: 'NGO Project Officer' },
      { code: 'PROGRAM_EVALUATOR', label: 'Program Evaluator', backendRole: 'Program Evaluator' },
    ],
    VOLUNTEER_MGMT: [
      { code: 'VOLUNTEER_COORD', label: 'Volunteer Coordinator', backendRole: 'Volunteer Coordinator' },
      { code: 'HUMANITARIAN_WORKER', label: 'Humanitarian Aid Worker', backendRole: 'Humanitarian Aid Worker' },
    ],
    FUNDRAISING: [
      { code: 'FUNDRAISING_SPEC', label: 'Fundraising Specialist', backendRole: 'Fundraising Specialist' },
      { code: 'DEV_OFFICER', label: 'Community Service Manager', backendRole: 'Community Service Manager' },
    ],
    PUBLIC_RELATIONS: [
      { code: 'PR_SPECIALIST', label: 'PR Specialist', backendRole: 'Social Media Creative' },
      { code: 'COMMUNICATIONS_MGR', label: 'Communications Manager', backendRole: 'Social Media Creative' },
    ],
    ADVOCACY: [
      { code: 'ADVOCACY_OFFICER', label: 'Advocacy Officer', backendRole: 'Community Development Officer' },
      { code: 'PUBLIC_WELFARE', label: 'Public Welfare Officer', backendRole: 'Public Welfare Officer' },
    ],
  },

  AGRICULTUREENVIRONMENT: {
    AGRI_PRODUCTION: [
      { code: 'AGRONOMIST', label: 'Agronomist', backendRole: 'Agronomist' },
      { code: 'CROP_SPEC', label: 'Crop Production Specialist', backendRole: 'Crop Production Specialist' },
      { code: 'HORTICULTURIST', label: 'Horticulturist', backendRole: 'Horticulturist' },
      { code: 'SMART_FARMING', label: 'Smart Farming Technician', backendRole: 'Smart Farming Technician' },
    ],
    AGRI_TECH: [
      { code: 'AGRI_TECH_SPEC', label: 'Agricultural Technician', backendRole: 'Agricultural Technician' },
      { code: 'BIOTECHNOLOGIST', label: 'Biotechnologist', backendRole: 'Biotechnologist' },
      { code: 'FOOD_TECH', label: 'Food Technology Specialist', backendRole: 'Food Technology Specialist' },
    ],
    ANIMAL_HUSBANDRY: [
      { code: 'VETERINARIAN', label: 'Veterinarian', backendRole: 'Veterinarian' },
      { code: 'LIVESTOCK_TECH', label: 'Livestock Technician', backendRole: 'Livestock Technician' },
      { code: 'ANIMAL_NUTRITIONIST', label: 'Animal Nutritionist', backendRole: 'Animal Nutritionist' },
      { code: 'VET_TECH', label: 'Veterinary Technician', backendRole: 'Veterinary Technician' },
    ],
    ENV_ENG: [
      { code: 'ENV_ENG', label: 'Environmental Engineer', backendRole: 'Environmental Engineer' },
      { code: 'ENV_SCIENTIST', label: 'Environmental Scientist', backendRole: 'Environmental Scientist' },
      { code: 'WASTE_MGMT_SPEC', label: 'Waste Management Specialist', backendRole: 'Waste Management Specialist' },
      { code: 'ECOLOGY_RESEARCHER', label: 'Ecology Researcher', backendRole: 'Ecology Researcher' },
    ],
    SUSTAINABILITY: [
      { code: 'SUSTAINABILITY_MGR', label: 'Sustainability Manager', backendRole: 'Environmental Engineer' },
      { code: 'CLIMATE_ANALYST', label: 'Climate Change Analyst', backendRole: 'Climate Change Analyst' },
      { code: 'GIS_SPEC', label: 'GIS Specialist', backendRole: 'GIS Specialist' },
    ],
    RENEWABLE_ENERGY: [
      { code: 'RENEWABLE_ENG', label: 'Renewable Energy Engineer', backendRole: 'Renewable Energy Engineer' },
      { code: 'RENEWABLE_TECH', label: 'Renewable Energy Technician', backendRole: 'Renewable Energy Technician' },
      { code: 'HYDROLOGIST', label: 'Hydrologist', backendRole: 'Hydrologist' },
    ],
    WASTE_MGMT: [
      { code: 'WASTE_MGMT_SPEC', label: 'Waste Management Specialist', backendRole: 'Waste Management Specialist' },
      { code: 'ENV_ENG', label: 'Environmental Engineer', backendRole: 'Environmental Engineer' },
    ],
    WATER_RESOURCES: [
      { code: 'WATER_RESOURCES_ENG', label: 'Water Resources Engineer', backendRole: 'Water Resources Engineer' },
      { code: 'WATER_QUALITY_TECH', label: 'Water Quality Technician', backendRole: 'Water Quality Technician' },
      { code: 'HYDROLOGIST', label: 'Hydrologist', backendRole: 'Hydrologist' },
    ],
  },
};

// ==================== Helper Functions ====================

/**
 * Get all roles for a given domain + industry (subCategory)
 */
export function getRolesForIndustry(domain: string, subCategory: string): RoleEntry[] {
  return ROLES_BY_DOMAIN_INDUSTRY[domain]?.[subCategory] ?? [];
}

/**
 * Get all roles for a domain (all industries combined)
 */
export function getAllRolesForDomain(domain: string): RoleEntry[] {
  const industries = ROLES_BY_DOMAIN_INDUSTRY[domain] ?? {};
  return Object.values(industries).flat();
}

/**
 * Get backend domain name from frontend code
 */
export function getBackendDomain(domainCode: string): string {
  return DOMAIN_CODE_TO_NAME[domainCode] ?? domainCode;
}

/**
 * Get backend industry name from frontend domain + subCategory
 */
export function getBackendIndustry(domainCode: string, subCategory: string): string {
  return INDUSTRY_BY_DOMAIN[domainCode]?.[subCategory] ?? subCategory;
}

/**
 * Get backend job role name from role code
 */
export function getBackendRole(domainCode: string, subCategory: string, roleCode: string): string {
  const roles = getRolesForIndustry(domainCode, subCategory);
  const found = roles.find(r => r.code === roleCode);
  return found?.backendRole ?? roleCode;
}

/**
 * Get role entry by code within a domain+industry
 */
export function getRoleEntry(domainCode: string, subCategory: string, roleCode: string): RoleEntry | undefined {
  return getRolesForIndustry(domainCode, subCategory).find(r => r.code === roleCode);
}

// ==================== Common Skills by Domain ====================

export const COMMON_SKILLS: Record<string, string[]> = {
  IT: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS', 'TypeScript', 'Vue.js', 'Angular', 'Go', 'Rust'],
  DESIGN: ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Motion Design'],
  BUSINESS: ['Digital Marketing', 'SEO', 'Content Marketing', 'Google Analytics', 'Sales', 'Project Management', 'Financial Analysis', 'Business Development'],
  ENGINEERING: ['AutoCAD', 'SolidWorks', 'MATLAB', 'Python', '3D Modeling', 'Finite Element Analysis', 'Thermodynamics'],
  EDUCATION: ['Instructional Design', 'E-Learning', 'Curriculum Development', 'Teaching', 'Assessment', 'EdTech Tools'],
  LOGISTICS: ['Supply Chain Management', 'Warehouse Operations', 'Inventory Management', 'SAP', 'Transportation Planning'],
  LEGAL: ['Contract Drafting', 'Legal Research', 'Corporate Law', 'Intellectual Property', 'Compliance'],
  ARTS: ['Photography', 'Videography', 'Video Editing', '3D Modeling', 'Animation', 'Illustration', 'Adobe Creative Suite'],
  SERVICE: ['Customer Service', 'Event Planning', 'Hotel Management', 'Restaurant Operations', 'Sales'],
  SOCIALCOMMUNITY: ['Community Management', 'Social Media', 'Fundraising', 'Volunteer Coordination', 'Content Strategy'],
  AGRICULTUREENVIRONMENT: ['Sustainable Agriculture', 'Environmental Impact Assessment', 'Soil Science', 'Crop Management', 'Water Management'],
  HEALTHCARE: ['Patient Care', 'Medical Terminology', 'Electronic Health Records', 'Pharmacology', 'Clinical Procedures', 'Healthcare Management']
};

/**
 * Check if a subCategory has roles defined
 */
export function hasRoles(domainCode: string, subCategory: string): boolean {
  return getRolesForIndustry(domainCode, subCategory).length > 0;
}

/**
 * Get all sub-categories for a domain that have roles defined
 */
export function getIndustriesWithRoles(domainCode: string): string[] {
  const industries = ROLES_BY_DOMAIN_INDUSTRY[domainCode] ?? {};
  return Object.entries(industries)
    .filter(([, roles]) => roles.length > 0)
    .map(([key]) => key);
}
