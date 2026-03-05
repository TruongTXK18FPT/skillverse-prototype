// CV Template System - Structured JSON-based CV Data & Template Types
// Instead of AI generating raw HTML, AI generates structured JSON data
// and React components render it using beautiful templates

// ==================== CV STRUCTURED DATA ====================

export interface CVStructuredData {
  personalInfo: CVPersonalInfo;
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: CVSkillCategory[];
  projects: CVProject[];
  certificates: CVCertificate[];
  languages: CVLanguage[];
  endorsements: CVEndorsement[];
}

export interface CVPersonalInfo {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  behanceUrl?: string;
  dribbbleUrl?: string;
  avatarUrl?: string;
}

export interface CVExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string; // null = Present
  isCurrent: boolean;
  description: string;
  achievements: string[];
  technologies?: string[];
}

export interface CVEducation {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  relevantCourses?: string[];
}

export interface CVSkillCategory {
  category: string;
  skills: CVSkill[];
}

export interface CVSkill {
  name: string;
  level: number; // 1-5 or 1-100
}

export interface CVProject {
  id: string;
  title: string;
  description: string;
  role?: string;
  technologies: string[];
  outcomes: string[];
  url?: string;
  duration?: string;
  clientName?: string;
  rating?: number;
}

export interface CVCertificate {
  id: string;
  title: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[];
}

export interface CVLanguage {
  name: string;
  proficiency: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
}

export interface CVEndorsement {
  quote: string;
  authorName: string;
  authorTitle?: string;
  skillEndorsed?: string;
  rating?: number;
}

// ==================== TEMPLATE DEFINITIONS ====================

export type CVTemplateName = "PROFESSIONAL" | "CREATIVE" | "MINIMAL" | "MODERN";

export interface CVTemplateConfig {
  name: CVTemplateName;
  displayName: string;
  description: string;
  descriptionVi: string;
  icon: string;
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const CV_TEMPLATES: CVTemplateConfig[] = [
  {
    name: "PROFESSIONAL",
    displayName: "Professional",
    description: "Clean two-column layout ideal for corporate positions",
    descriptionVi: "Bố cục 2 cột chuyên nghiệp, phù hợp doanh nghiệp",
    icon: "💼",
    previewColors: {
      primary: "#1e3a8a",
      secondary: "#3b82f6",
      accent: "#d97706",
      background: "#ffffff",
      text: "#1f2937",
    },
  },
  {
    name: "MODERN",
    displayName: "Modern",
    description: "Gradient accents with card-based design",
    descriptionVi: "Thiết kế hiện đại với gradient và thẻ nổi",
    icon: "✨",
    previewColors: {
      primary: "#8b5cf6",
      secondary: "#06b6d4",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#0f172a",
    },
  },
  {
    name: "MINIMAL",
    displayName: "Minimal",
    description: "Ultra-clean single-column, content-focused",
    descriptionVi: "Tối giản một cột, tập trung nội dung",
    icon: "📄",
    previewColors: {
      primary: "#000000",
      secondary: "#6b7280",
      accent: "#374151",
      background: "#ffffff",
      text: "#000000",
    },
  },
  {
    name: "CREATIVE",
    displayName: "Creative",
    description: "Bold colors and infographic-style layout",
    descriptionVi: "Bố cục sáng tạo với màu sắc nổi bật",
    icon: "🎨",
    previewColors: {
      primary: "#ec4899",
      secondary: "#3b82f6",
      accent: "#fbbf24",
      background: "#ffffff",
      text: "#581c87",
    },
  },
];

// ==================== EMPTY/DEFAULT DATA ====================

export const EMPTY_CV_DATA: CVStructuredData = {
  personalInfo: {
    fullName: "",
    professionalTitle: "",
    email: "",
    phone: "",
    location: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certificates: [],
  languages: [],
  endorsements: [],
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Parse JSON string from backend cvJson field into structured data
 */
export function parseCVJson(
  json: string | undefined | null,
): CVStructuredData | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as CVStructuredData;
  } catch {
    return null;
  }
}

/**
 * Generate a unique ID for new items
 */
export function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
