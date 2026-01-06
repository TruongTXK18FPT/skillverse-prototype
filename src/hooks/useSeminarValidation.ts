import { useState } from 'react';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  title?: string;
  description?: string;
  meetingLink?: string;
  startTime?: string;
  endTime?: string;
  price?: string;
  maxCapacity?: string;
  general?: string[];
}

/**
 * Custom hook for seminar form validation with Vietnamese error messages
 */
export const useSeminarValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validates seminar form data
   * Returns true if valid, false if errors exist
   */
  const validateForm = (formData: {
    title: string;
    description?: string;
    meetingLink: string;
    startTime: string;
    endTime: string;
    price: number;
    maxCapacity?: number;
  }): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }

    // Description validation
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Mô tả không được vượt quá 5000 ký tự';
    }

    // Meeting link validation
    if (!formData.meetingLink || formData.meetingLink.trim().length === 0) {
      newErrors.meetingLink = 'Link meeting là bắt buộc';
    } else if (!isValidMeetingLink(formData.meetingLink)) {
      newErrors.meetingLink = 'Link meeting không hợp lệ (chỉ chấp nhận Google Meet, Zoom, Microsoft Teams)';
    }

    // DateTime validation
    const dateTimeErrors = validateDateTimes(formData.startTime, formData.endTime);
    Object.assign(newErrors, dateTimeErrors);

    // Price validation
    if (formData.price < 0) {
      newErrors.price = 'Giá vé không được âm';
    } else if (formData.price > 100000000) {
      newErrors.price = 'Giá vé không được vượt quá 100,000,000 VNĐ';
    }

    // Max capacity validation
    if (formData.maxCapacity !== undefined && formData.maxCapacity !== null) {
      if (formData.maxCapacity < 0) {
        newErrors.maxCapacity = 'Số lượng vé không được âm';
      } else if (formData.maxCapacity > 10000) {
        newErrors.maxCapacity = 'Số lượng vé không được vượt quá 10,000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validates meeting link format
   */
  const isValidMeetingLink = (link: string): boolean => {
    if (!link || link.trim().length === 0) {
      return false;
    }

    // Auto-prepend https:// if missing protocol
    let urlString = link.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }

    // Check if it's a valid URL
    try {
      const url = new URL(urlString);
      const lowerHost = url.hostname.toLowerCase();
      
      // Accept Google Meet, Zoom, Microsoft Teams
      return (
        lowerHost.includes('meet.google.com') ||
        lowerHost.includes('zoom.us') ||
        lowerHost.includes('teams.microsoft.com') ||
        lowerHost.includes('teams.live.com')
      );
    } catch {
      return false;
    }
  };

  /**
   * Validates start and end date/time
   */
  const validateDateTimes = (startTime: string, endTime: string): Partial<FormErrors> => {
    const errors: Partial<FormErrors> = {};
    const now = new Date();

    // Parse dates
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    // Start time validation
    if (!startTime || !start) {
      errors.startTime = 'Thời gian bắt đầu là bắt buộc';
    } else {
      if (start < now) {
        errors.startTime = 'Thời gian bắt đầu phải sau thời điểm hiện tại';
      }
      
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
      if (start > fiveYearsFromNow) {
        errors.startTime = 'Thời gian bắt đầu không được quá xa trong tương lai (tối đa 5 năm)';
      }
    }

    // End time validation
    if (!endTime || !end) {
      errors.endTime = 'Thời gian kết thúc là bắt buộc';
    } else {
      if (end < now) {
        errors.endTime = 'Thời gian kết thúc phải sau thời điểm hiện tại';
      }
      
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
      if (end > fiveYearsFromNow) {
        errors.endTime = 'Thời gian kết thúc không được quá xa trong tương lai (tối đa 5 năm)';
      }
    }

    // Compare start and end time
    if (start && end) {
      if (end <= start) {
        errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }

      // Check minimum duration (30 minutes)
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 30) {
        errors.endTime = 'Hội thảo phải kéo dài ít nhất 30 phút';
      }

      // Check maximum duration (8 hours)
      if (durationMinutes > 480) {
        errors.endTime = 'Hội thảo không nên kéo dài quá 8 giờ';
      }
    }

    return errors;
  };

  /**
   * Validates submission timing (must be at least 24 hours in advance)
   */
  const validateSubmission = (startTime: string): { isValid: boolean; error?: string } => {
    if (!startTime) {
      return { isValid: false, error: 'Thời gian bắt đầu không hợp lệ' };
    }

    const start = new Date(startTime);
    const now = new Date();

    if (start < now) {
      return { isValid: false, error: 'Không thể gửi duyệt hội thảo đã qua thời gian bắt đầu' };
    }

    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < 24) {
      return {
        isValid: false,
        error: 'Hội thảo phải được gửi duyệt trước ít nhất 24 giờ so với thời gian bắt đầu'
      };
    }

    return { isValid: true };
  };

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    setErrors({});
  };
  /**
   * Validate single field on change - uses same logic as validateForm
   */
  const validateField = (field: keyof FormErrors, value: any) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        delete newErrors.title;
        if (!value || value.trim().length === 0) {
          newErrors.title = 'Tiêu đề là bắt buộc';
        } else if (value.length > 200) {
          newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
        }
        break;
        
      case 'description':
        delete newErrors.description;
        if (value && value.length > 5000) {
          newErrors.description = 'Mô tả không được vượt quá 5000 ký tự';
        }
        break;
        
      case 'meetingLink':
        delete newErrors.meetingLink;
        if (!value || value.trim().length === 0) {
          newErrors.meetingLink = 'Link meeting là bắt buộc';
        } else if (!isValidMeetingLink(value)) {
          newErrors.meetingLink = 'Link meeting không hợp lệ (chỉ chấp nhận Google Meet, Zoom, Microsoft Teams)';
        }
        break;
        
      case 'startTime':
      case 'endTime':
        // Clear datetime errors - full validation on submit
        delete newErrors.startTime;
        delete newErrors.endTime;
        break;
        
      case 'price':
        delete newErrors.price;
        if (value < 0) {
          newErrors.price = 'Giá vé không được âm';
        } else if (value > 100000000) {
          newErrors.price = 'Giá vé không được vượt quá 100,000,000 VNĐ';
        }
        break;
        
      case 'maxCapacity':
        delete newErrors.maxCapacity;
        if (value !== undefined && value !== null) {
          if (value < 0) {
            newErrors.maxCapacity = 'Số lượng vé không được âm';
          } else if (value > 10000) {
            newErrors.maxCapacity = 'Số lượng vé không được vượt quá 10,000';
          }
        }
        break;
    }
    
    setErrors(newErrors);
  };
  /**
   * Parse backend error response
   */
  const parseBackendErrors = (error: any): void => {
    const newErrors: FormErrors = {};

    if (error?.response?.data) {
      const data = error.response.data;

      // Handle ValidationException with array of errors
      if (data.details?.errors && Array.isArray(data.details.errors)) {
        newErrors.general = data.details.errors;
      }
      // Handle field-specific validation errors
      else if (data.details && typeof data.details === 'object') {
        const validFields = [
          'title', 'description', 'meetingLink', 'startTime', 
          'endTime', 'price', 'maxCapacity'
        ] as const;
        
        Object.entries(data.details).forEach(([field, message]) => {
          if (validFields.includes(field as any)) {
            // TypeScript-safe assignment for string fields
            const fieldKey = field as 'title' | 'description' | 'meetingLink' | 'startTime' | 'endTime' | 'price' | 'maxCapacity';
            newErrors[fieldKey] = message as string;
          } else {
            // Add to general errors if field not recognized
            if (!newErrors.general) newErrors.general = [];
            newErrors.general.push(`${field}: ${message}`);
          }
        });
      }
      // Handle simple error message
      else if (data.message) {
        newErrors.general = [data.message];
      }
    } else if (error?.message) {
      newErrors.general = [error.message];
    } else {
      newErrors.general = ['Có lỗi xảy ra, vui lòng thử lại'];
    }

    setErrors(newErrors);
  };

  return {
    errors,
    validateForm,
    validateField,
    validateSubmission,
    clearErrors,
    parseBackendErrors
  };
};
