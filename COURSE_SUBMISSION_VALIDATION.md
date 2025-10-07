# Course Submission Validation Rules

## 📅 Updated: October 7, 2025

## 🎯 Overview

This document explains the validation rules for submitting courses for approval in the SkillVerse platform.

---

## ✅ Submission Requirements

### For a course to be submitted for approval, it MUST meet these criteria:

1. **Status**: Course status must be `DRAFT`
2. **Content**: Course must have **at least one module**

### Validation Function

```typescript
/**
 * Check if course can be submitted for approval
 * Requirements: Must be DRAFT status and have at least one module
 */
export const canSubmitForApproval = (course: CourseDetailDTO): boolean => {
  return course.status === CourseStatus.DRAFT &&
    course.modules && 
    course.modules.length > 0; // Must have at least one module (modules contain lessons)
};
```

---

## 📊 Course Structure

### Understanding the Hierarchy

```
Course
├── Modules (required for submission)
    ├── Lessons (contained within modules)
    ├── Quizzes (contained within modules)
    ├── Assignments (contained within modules)
    └── Coding Exercises (contained within modules)
```

**Key Point**: Modules are the top-level organizational unit. Each module can contain multiple lessons, quizzes, assignments, and coding exercises.

---

## 🔍 Validation Logic Breakdown

### 1. Status Check
```typescript
course.status === CourseStatus.DRAFT
```
- Only courses in `DRAFT` status can be submitted
- Courses with other statuses (`PENDING`, `PUBLIC`, `ARCHIVED`) cannot be submitted

### 2. Module Check
```typescript
course.modules && course.modules.length > 0
```
- Ensures `modules` array exists (not null/undefined)
- Ensures at least one module has been created
- Modules contain the actual course content (lessons, quizzes, etc.)

---

## 📝 Course Status Flow

```
DRAFT → (submit) → PENDING → (approve) → PUBLIC
                              ↓ (reject)
                            DRAFT
```

### Status Descriptions

| Status | Description | Can Submit? |
|--------|-------------|-------------|
| `DRAFT` | Course is being created/edited | ✅ Yes (if has modules) |
| `PENDING` | Course is awaiting admin review | ❌ No |
| `PUBLIC` | Course is published and visible to students | ❌ No |
| `ARCHIVED` | Course is no longer active | ❌ No |

---

## 🎨 UI Integration

### Course Manager Tab

The "Submit for Approval" button should only appear when:

```typescript
import { canSubmitForApproval } from '../services/courseService';

// In your component
{course.status === 'DRAFT' && canSubmitForApproval(course) && (
  <button className="cm-btn cm-submit" onClick={() => onSubmit(course.id)}>
    <Upload className="w-4 h-4" />
    Gửi Duyệt
  </button>
)}
```

### Visual Indicators

**Before Module Creation:**
- "Submit" button: Hidden (course cannot be submitted)
- User sees: Only "Edit" and "Delete" buttons
- Status badge: Blue "DRAFT"

**After Module Creation:**
- "Submit" button: Visible ✅
- User can click to submit for approval
- Status changes to "PENDING" after submission

---

## 🚨 Validation Errors

### Common Issues

#### 1. **No Modules Created**
```typescript
// Will return false
canSubmitForApproval({
  status: 'DRAFT',
  modules: [], // Empty array
  // ... other fields
})
```
**Fix**: Create at least one module before submitting

#### 2. **Status Not DRAFT**
```typescript
// Will return false
canSubmitForApproval({
  status: 'PENDING', // Wrong status
  modules: [{ /* module data */ }],
  // ... other fields
})
```
**Fix**: Only DRAFT courses can be submitted

#### 3. **Modules Undefined**
```typescript
// Will return false
canSubmitForApproval({
  status: 'DRAFT',
  modules: undefined, // Not initialized
  // ... other fields
})
```
**Fix**: Ensure course data is fully loaded

---

## 💡 Best Practices

### 1. **Client-Side Validation**
Always validate before showing the submit button:
```typescript
const isSubmittable = canSubmitForApproval(course);

return (
  <div className="cm-actions">
    {/* Always show Edit for DRAFT */}
    {course.status === 'DRAFT' && (
      <button onClick={() => onEdit(course)}>Edit</button>
    )}
    
    {/* Only show Submit when valid */}
    {isSubmittable && (
      <button onClick={() => onSubmit(course.id)}>Submit</button>
    )}
  </div>
);
```

### 2. **Server-Side Validation**
The backend should also validate:
```java
// Backend validation in CourseService.java
public void submitForApproval(Long courseId, Long actorId) {
    Course course = findById(courseId);
    
    // Check status
    if (course.getStatus() != CourseStatus.DRAFT) {
        throw new InvalidStatusException("Only DRAFT courses can be submitted");
    }
    
    // Check modules
    if (course.getModules() == null || course.getModules().isEmpty()) {
        throw new ValidationException("Course must have at least one module");
    }
    
    // Update status
    course.setStatus(CourseStatus.PENDING);
    courseRepository.save(course);
}
```

### 3. **User Feedback**
Provide clear feedback when submission is blocked:
```typescript
const handleSubmitClick = () => {
  if (!canSubmitForApproval(course)) {
    if (!course.modules || course.modules.length === 0) {
      toast.error('Vui lòng tạo ít nhất một chương trước khi gửi duyệt');
      return;
    }
  }
  
  onSubmit(course.id);
};
```

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] **Test 1**: Create new course → Submit button hidden
- [ ] **Test 2**: Add module → Submit button appears
- [ ] **Test 3**: Submit course → Status changes to PENDING
- [ ] **Test 4**: PENDING course → Submit button hidden
- [ ] **Test 5**: Admin approves → Status changes to PUBLIC
- [ ] **Test 6**: PUBLIC course → Submit button hidden

### Automated Testing

```typescript
describe('canSubmitForApproval', () => {
  it('should return false for course without modules', () => {
    const course = {
      status: CourseStatus.DRAFT,
      modules: []
    } as CourseDetailDTO;
    
    expect(canSubmitForApproval(course)).toBe(false);
  });
  
  it('should return true for DRAFT course with modules', () => {
    const course = {
      status: CourseStatus.DRAFT,
      modules: [{ id: 1, title: 'Module 1' }]
    } as CourseDetailDTO;
    
    expect(canSubmitForApproval(course)).toBe(true);
  });
  
  it('should return false for non-DRAFT status', () => {
    const course = {
      status: CourseStatus.PENDING,
      modules: [{ id: 1, title: 'Module 1' }]
    } as CourseDetailDTO;
    
    expect(canSubmitForApproval(course)).toBe(false);
  });
});
```

---

## 📚 Related Functions

### Helper Functions in courseService.ts

#### 1. **canEditCourse**
```typescript
export const canEditCourse = (
  course: CourseDetailDTO | CourseSummaryDTO, 
  userId: number
): boolean => {
  return course.author.id === userId && 
    (course.status === CourseStatus.DRAFT || 
     course.status === CourseStatus.PENDING);
};
```
- Checks if user can edit the course
- Must be course author
- Must be DRAFT or PENDING status

#### 2. **getCourseStatusColor**
```typescript
export const getCourseStatusColor = (status: CourseStatus): string => {
  switch (status) {
    case CourseStatus.DRAFT: return 'gray';
    case CourseStatus.PENDING: return 'orange';
    case CourseStatus.PUBLIC: return 'green';
    case CourseStatus.ARCHIVED: return 'red';
    default: return 'gray';
  }
};
```
- Returns color for status badges

#### 3. **getCourseStatusText**
```typescript
export const getCourseStatusText = (status: CourseStatus): string => {
  switch (status) {
    case CourseStatus.DRAFT: return 'Draft';
    case CourseStatus.PENDING: return 'Pending Review';
    case CourseStatus.PUBLIC: return 'Public';
    case CourseStatus.ARCHIVED: return 'Archived';
    default: return status;
  }
};
```
- Returns display text for status

---

## 🔄 Workflow Example

### Complete Course Creation → Submission Flow

```typescript
// 1. Create course (DRAFT status)
const newCourse = await createCourse(authorId, {
  title: "Advanced React Patterns",
  description: "Learn advanced React patterns",
  level: CourseLevel.ADVANCED
});

console.log(canSubmitForApproval(newCourse)); // false - no modules yet

// 2. Add a module
const module = await createModule(newCourse.id, {
  title: "Hooks Deep Dive",
  description: "Understanding React Hooks",
  orderIndex: 1
});

// 3. Fetch updated course
const updatedCourse = await getCourse(newCourse.id);
console.log(canSubmitForApproval(updatedCourse)); // true - has module now

// 4. Submit for approval
if (canSubmitForApproval(updatedCourse)) {
  await submitCourseForApproval(updatedCourse.id, authorId);
  // Course status is now PENDING
}
```

---

## 🎯 Summary

**Key Takeaways:**

1. ✅ **Modules are required** - A course must have at least one module to be submitted
2. ✅ **DRAFT status only** - Only courses in DRAFT status can be submitted
3. ✅ **Validate on both sides** - Check on frontend (UI) and backend (API)
4. ✅ **Clear user feedback** - Show/hide submit button and provide error messages
5. ✅ **Proper hierarchy** - Modules contain lessons, quizzes, assignments, and coding exercises

**Updated Validation:**
- ❌ OLD: Required at least one lesson
- ✅ NEW: Requires at least one module (which can contain lessons and other content)

This change better reflects the course structure where modules are the primary organizational unit.

---

**Related Files:**
- `courseService.ts` - Contains `canSubmitForApproval` function
- `courseDTOs.ts` - Contains `CourseDetailDTO` interface
- `CourseManagerTab.tsx` - Uses validation for UI display
- Backend: `CourseService.java` - Server-side validation

**Last Updated:** October 7, 2025
**Status:** ✅ Production Ready
