// Course DTOs - Matching Backend Structure
import { CoursePurchaseOption } from './purchaseDTOs';

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLIC = 'PUBLIC',
  ARCHIVED = 'ARCHIVED'
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Author DTO
export interface AuthorDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  fullName?: string; // Computed field
}

// Media DTO
export interface MediaDTO {
  id: number;
  url: string;
  type: string;
  fileName: string;
  fileSize?: number;
  uploadedBy?: number;
  uploadedByName?: string;
  uploadedAt?: string;
}

// Course Summary DTO (for list view)
export interface CourseSummaryDTO {
  id: number;
  title: string;
  description: string;
  shortDescription?: string; // For list view
  level: CourseLevel;
  status: CourseStatus;
  author: AuthorDTO;
  authorName?: string; // Computed field
  thumbnail?: MediaDTO;
  thumbnailUrl?: string; // Computed field
  enrollmentCount: number;
  moduleCount?: number; // Total module count
  price?: number;
  currency?: string;
  averageRating?: number; // Average rating
  totalReviews?: number; // Total reviews
  createdAt: string;
  updatedAt: string;
  submittedDate?: string;
  publishedDate?: string;
  purchaseOption?: CoursePurchaseOption; // Purchase configuration
}

// Module Summary DTO (used in CourseDetailDTO)
export interface ModuleSummaryDTO {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
}

// Course Detail DTO (for detailed view)
export interface CourseDetailDTO {
  id: number;
  title: string;
  description: string;
  shortDescription?: string;
  level: CourseLevel;
  status: CourseStatus;
  author: AuthorDTO;
  authorName?: string;
  thumbnail?: MediaDTO;
  thumbnailUrl?: string;
  modules: ModuleSummaryDTO[]; // Modules contain lessons, quizzes, assignments, coding exercises
  enrollmentCount: number;
  price?: number;
  currency?: string;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
  submittedDate?: string;
  publishedDate?: string;
  purchaseOption?: CoursePurchaseOption; // Purchase configuration
}

// Course Create DTO
export interface CourseCreateDTO {
  title: string;
  description: string;
  level: CourseLevel;
  thumbnailMediaId?: number;
  price?: number;
  currency?: string;
  purchaseOption?: CoursePurchaseOption; // Optional purchase setup
}

// Course Update DTO
export interface CourseUpdateDTO {
  title?: string;
  description?: string;
  level?: CourseLevel;
  thumbnailMediaId?: number;
  price?: number;
  currency?: string;
}

// Lesson Summary DTO
export interface LessonSummaryDTO {
  id: number;
  title: string;
  type: LessonType;
  orderIndex: number;
  durationSec: number;
}

// Quiz Summary DTO
export interface QuizSummaryDTO {
  id: number;
  title: string;
  description: string;
  passScore: number;
  questionCount: number;
  moduleId?: number;
}

// Assignment Summary DTO
export interface AssignmentSummaryDTO {
  id: number;
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
  dueAt?: string;
  moduleId?: number;
}

// Coding Exercise Summary DTO
export interface CodingExerciseSummaryDTO {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  testCaseCount: number;
  moduleId?: number;
}

// Enums
export enum LessonType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  CODELAB = 'CODELAB'
}

export enum SubmissionType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  LINK = 'LINK'
}

// Page Response (matching Spring Boot Pageable)
export interface PageResponse<T> {
  content: T[]; // Content array
  page: number; // Current page
  size: number; // Page size
  totalElements: number; // Total items
  totalPages: number; // Total pages
  first: boolean; // Is first page
  last: boolean; // Is last page
  empty: boolean; // Is empty
}
