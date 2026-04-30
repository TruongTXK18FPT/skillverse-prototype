// Portfolio Validation Utilities

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Phone validation (Vietnam format)
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // Optional field
  }
  
  const phoneRegex = /^(0|\+84)[3-9][0-9]{8}$/;
  const cleanPhone = phone.replace(/\s/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return { 
      valid: false, 
      error: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0).' 
    };
  }
  
  return { valid: true };
};

// Date validation helpers
export const parseDateStr = (dateStr: string): { month?: string; year?: string } => {
  if (!dateStr) return {};
  
  const parts = dateStr.split('/');
  if (parts.length === 2) {
    return { month: parts[0], year: parts[1] };
  }
  if (dateStr.length === 4 && /^\d{4}$/.test(dateStr)) {
    return { year: dateStr };
  }
  return {};
};

export const dateStrToDate = (dateStr: string): Date | null => {
  const parsed = parseDateStr(dateStr);
  if (!parsed.year) return null;
  
  const month = parsed.month ? parseInt(parsed.month, 10) - 1 : 0;
  const year = parseInt(parsed.year, 10);
  
  if (isNaN(year) || year < 1900 || year > 2100) return null;
  if (parsed.month && (isNaN(month) || month < 0 || month > 11)) return null;
  
  return new Date(year, month, 1);
};

export const validateDateStr = (dateStr: string, fieldName: string): ValidationResult => {
  if (!dateStr || dateStr.trim() === '') {
    return { valid: false, error: `${fieldName} là bắt buộc.` };
  }
  
  const parsed = parseDateStr(dateStr);
  if (!parsed.year) {
    return { 
      valid: false, 
      error: `${fieldName} không hợp lệ. Vui lòng nhập theo định dạng MM/YYYY hoặc YYYY.` 
    };
  }
  
  const year = parseInt(parsed.year, 10);
  if (isNaN(year) || year < 1980 || year > new Date().getFullYear() + 1) {
    return { 
      valid: false, 
      error: `${fieldName} không hợp lệ. Năm phải từ 1980 đến ${new Date().getFullYear() + 1}.` 
    };
  }
  
  if (parsed.month) {
    const month = parseInt(parsed.month, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      return { 
        valid: false, 
        error: `${fieldName} không hợp lệ. Tháng phải từ 1 đến 12.` 
      };
    }
  }
  
  return { valid: true };
};

export const validateDateRange = (
  startDate: string, 
  endDate: string,
  startLabel: string = 'Ngày bắt đầu',
  endLabel: string = 'Ngày kết thúc'
): ValidationResult => {
  if (!startDate || !endDate) {
    return { valid: true }; // Skip if either is empty
  }
  
  const start = dateStrToDate(startDate);
  const end = dateStrToDate(endDate);
  
  if (!start || !end) {
    return { valid: true }; // Skip if parse fails
  }
  
  if (end < start) {
    return { 
      valid: false, 
      error: `${endLabel} phải sau ${startLabel}.` 
    };
  }
  
  return { valid: true };
};

export const validateYearRange = (
  startYear: string,
  endYear: string,
  startLabel: string = 'Năm bắt đầu',
  endLabel: string = 'Năm kết thúc'
): ValidationResult => {
  if (!startYear || !endYear) {
    return { valid: true }; // Skip if either is empty
  }
  
  const start = parseInt(startYear, 10);
  const end = parseInt(endYear, 10);
  
  if (isNaN(start) || isNaN(end)) {
    return { valid: true }; // Skip if parse fails
  }
  
  if (end < start) {
    return { 
      valid: false, 
      error: `${endLabel} phải sau ${startLabel}.` 
    };
  }
  
  return { valid: true };
};

// Work experience validation
export interface WorkExperienceValidation {
  valid: boolean;
  errors: string[];
}

export const validateWorkExperience = (
  experience: any,
  index: number
): WorkExperienceValidation => {
  const errors: string[] = [];
  
  // At least company or position is required
  if (!experience.companyName?.trim() && !experience.position?.trim()) {
    errors.push(`Kinh nghiệm #${index + 1}: Vui lòng nhập tên công ty hoặc vị trí.`);
  }
  
  // Start date is required
  if (!experience.startDate?.trim()) {
    errors.push(`Kinh nghiệm #${index + 1}: Ngày bắt đầu là bắt buộc.`);
  } else {
    const dateValidation = validateDateStr(experience.startDate, 'Ngày bắt đầu');
    if (!dateValidation.valid) {
      errors.push(`Kinh nghiệm #${index + 1}: ${dateValidation.error}`);
    }
  }
  
  // End date is required if not current job
  if (!experience.currentJob && !experience.endDate?.trim()) {
    errors.push(`Kinh nghiệm #${index + 1}: Ngày kết thúc là bắt buộc khi không đánh dấu "Đang làm việc tại đây".`);
  } else if (!experience.currentJob && experience.endDate?.trim()) {
    const dateValidation = validateDateStr(experience.endDate, 'Ngày kết thúc');
    if (!dateValidation.valid) {
      errors.push(`Kinh nghiệm #${index + 1}: ${dateValidation.error}`);
    }
  }
  
  // Validate date range
  if (experience.startDate && experience.endDate && !experience.currentJob) {
    const rangeValidation = validateDateRange(experience.startDate, experience.endDate);
    if (!rangeValidation.valid) {
      errors.push(`Kinh nghiệm #${index + 1}: ${rangeValidation.error}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Education validation
export interface EducationValidation {
  valid: boolean;
  errors: string[];
}

export const validateEducation = (
  education: any,
  index: number
): EducationValidation => {
  const errors: string[] = [];
  
  // Institution is required
  if (!education.institution?.trim()) {
    errors.push(`Học vấn #${index + 1}: Tên trường/tổ chức là bắt buộc.`);
  }
  
  // Degree is required
  if (!education.degree?.trim()) {
    errors.push(`Học vấn #${index + 1}: Bằng cấp/chương trình là bắt buộc.`);
  }
  
  // Start year is required
  if (!education.startDate?.trim()) {
    errors.push(`Học vấn #${index + 1}: Năm bắt đầu là bắt buộc.`);
  } else {
    const year = parseInt(education.startDate, 10);
    if (isNaN(year) || year < 1980 || year > new Date().getFullYear() + 1) {
      errors.push(`Học vấn #${index + 1}: Năm bắt đầu không hợp lệ.`);
    }
  }
  
  // End year is required if graduated
  if (education.status === 'GRADUATED' && !education.endDate?.trim()) {
    errors.push(`Học vấn #${index + 1}: Năm kết thúc là bắt buộc khi trạng thái là "Đã tốt nghiệp".`);
  } else if (education.endDate?.trim()) {
    const year = parseInt(education.endDate, 10);
    if (isNaN(year) || year < 1980 || year > new Date().getFullYear() + 1) {
      errors.push(`Học vấn #${index + 1}: Năm kết thúc không hợp lệ.`);
    }
  }
  
  // Validate year range
  if (education.startDate && education.endDate) {
    const rangeValidation = validateYearRange(education.startDate, education.endDate);
    if (!rangeValidation.valid) {
      errors.push(`Học vấn #${index + 1}: ${rangeValidation.error}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Slug validation
export const validateSlug = (slug: string): ValidationResult => {
  if (!slug || slug.trim() === '') {
    return { valid: false, error: 'Đường dẫn tùy chỉnh là bắt buộc.' };
  }
  
  const cleanSlug = slug.trim().toLowerCase();
  
  if (cleanSlug.length < 3) {
    return { valid: false, error: 'Đường dẫn tùy chỉnh phải có ít nhất 3 ký tự.' };
  }
  
  if (cleanSlug.length > 60) {
    return { valid: false, error: 'Đường dẫn tùy chỉnh không được quá 60 ký tự.' };
  }
  
  if (/^[0-9-]+$/.test(cleanSlug)) {
    return { valid: false, error: 'Đường dẫn tùy chỉnh không được chỉ chứa số và dấu gạch ngang.' };
  }
  
  if (cleanSlug.startsWith('-') || cleanSlug.endsWith('-')) {
    return { valid: false, error: 'Đường dẫn tùy chỉnh không được bắt đầu hoặc kết thúc bằng dấu gạch ngang.' };
  }
  
  if (/--/.test(cleanSlug)) {
    return { valid: false, error: 'Đường dẫn tùy chỉnh không được có hai dấu gạch ngang liên tiếp.' };
  }
  
  const reservedSlugs = ['create', 'api', 'admin', 'www', 'portfolio'];
  if (reservedSlugs.includes(cleanSlug)) {
    return { valid: false, error: `"${cleanSlug}" là đường dẫn dự trữ của hệ thống. Vui lòng chọn đường dẫn khác.` };
  }
  
  return { valid: true };
};

// URL validation for social links
export const validateLinkedInUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return { valid: true }; // Optional
  }
  
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('linkedin.com')) {
      return { valid: false, error: 'URL LinkedIn không hợp lệ. Vui lòng nhập URL từ linkedin.com' };
    }
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL phải sử dụng HTTPS.' };
    }
  } catch {
    return { valid: false, error: 'URL không hợp lệ.' };
  }
  
  return { valid: true };
};

export const validateGitHubUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return { valid: true }; // Optional
  }
  
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('github.com')) {
      return { valid: false, error: 'URL GitHub không hợp lệ. Vui lòng nhập URL từ github.com' };
    }
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL phải sử dụng HTTPS.' };
    }
  } catch {
    return { valid: false, error: 'URL không hợp lệ.' };
  }
  
  return { valid: true };
};

export const validateBehanceUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return { valid: true }; // Optional
  }
  
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('behance.net')) {
      return { valid: false, error: 'URL Behance không hợp lệ. Vui lòng nhập URL từ behance.net' };
    }
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL phải sử dụng HTTPS.' };
    }
  } catch {
    return { valid: false, error: 'URL không hợp lệ.' };
  }
  
  return { valid: true };
};

export const validateDribbbleUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return { valid: true }; // Optional
  }
  
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('dribbble.com')) {
      return { valid: false, error: 'URL Dribbble không hợp lệ. Vui lòng nhập URL từ dribbble.com' };
    }
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL phải sử dụng HTTPS.' };
    }
  } catch {
    return { valid: false, error: 'URL không hợp lệ.' };
  }
  
  return { valid: true };
};

export const validatePortfolioUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return { valid: true }; // Optional
  }
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL phải sử dụng HTTPS.' };
    }
  } catch {
    return { valid: false, error: 'URL không hợp lệ.' };
  }
  
  return { valid: true };
};

// Skills and languages validation
export const validateSkills = (skills: string[]): ValidationResult => {
  if (skills.length === 0) {
    return { valid: false, error: 'Vui lòng thêm ít nhất 1 kỹ năng.' };
  }
  
  if (skills.length > 20) {
    return { valid: false, error: 'Chỉ được thêm tối đa 20 kỹ năng.' };
  }
  
  for (const skill of skills) {
    if (skill.trim().length < 2) {
      return { valid: false, error: 'Kỹ năng phải có ít nhất 2 ký tự.' };
    }
    if (skill.trim().length > 50) {
      return { valid: false, error: 'Kỹ năng không được quá 50 ký tự.' };
    }
  }
  
  return { valid: true };
};

export const validateLanguages = (languages: string[]): ValidationResult => {
  if (languages.length === 0) {
    return { valid: false, error: 'Vui lòng thêm ít nhất 1 ngôn ngữ.' };
  }
  
  if (languages.length > 10) {
    return { valid: false, error: 'Chỉ được thêm tối đa 10 ngôn ngữ.' };
  }
  
  for (const lang of languages) {
    if (lang.trim().length < 2) {
      return { valid: false, error: 'Ngôn ngữ phải có ít nhất 2 ký tự.' };
    }
    if (lang.trim().length > 30) {
      return { valid: false, error: 'Ngôn ngữ không được quá 30 ký tự.' };
    }
  }
  
  return { valid: true };
};

// File format validation
export const IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];

export const validateImageFormat = (file: File): ValidationResult => {
  if (!IMAGE_FORMATS.includes(file.type)) {
    return { 
      valid: false, 
      error: `Định dạng ảnh không được hỗ trợ. Vui lòng chọn: JPG, PNG, WebP, hoặc GIF.` 
    };
  }
  return { valid: true };
};

export const validateVideoFormat = (file: File): ValidationResult => {
  if (!VIDEO_FORMATS.includes(file.type)) {
    return { 
      valid: false, 
      error: `Định dạng video không được hỗ trợ. Vui lòng chọn: MP4, WebM, hoặc MOV.` 
    };
  }
  return { valid: true };
};

// Personal info validation
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || fullName.trim() === '') {
    return { valid: false, error: 'Họ và tên là bắt buộc.' };
  }
  
  if (fullName.trim().length < 2) {
    return { valid: false, error: 'Họ và tên phải có ít nhất 2 ký tự.' };
  }
  
  if (fullName.trim().length > 100) {
    return { valid: false, error: 'Họ và tên không được quá 100 ký tự.' };
  }
  
  return { valid: true };
};

export const validateProfessionalTitle = (title: string): ValidationResult => {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Chức danh là bắt buộc.' };
  }
  
  if (title.trim().length < 2) {
    return { valid: false, error: 'Chức danh phải có ít nhất 2 ký tự.' };
  }
  
  if (title.trim().length > 100) {
    return { valid: false, error: 'Chức danh không được quá 100 ký tự.' };
  }
  
  return { valid: true };
};

export const validateCareerGoals = (goals: string): ValidationResult => {
  if (!goals || goals.trim() === '') {
    return { valid: true }; // Optional
  }
  
  if (goals.trim().length > 500) {
    return { valid: false, error: 'Mục tiêu nghề nghiệp không được quá 500 ký tự.' };
  }
  
  return { valid: true };
};

export const validateLocation = (location: string): ValidationResult => {
  if (!location || location.trim() === '') {
    return { valid: true }; // Optional
  }
  
  if (location.trim().length > 100) {
    return { valid: false, error: 'Địa điểm không được quá 100 ký tự.' };
  }
  
  return { valid: true };
};
