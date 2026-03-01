// Quiz DTOs - Matching Backend Structure

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER'
}

export enum QuizGradingMethod {
  HIGHEST = 'HIGHEST',
  AVERAGE = 'AVERAGE',
  FIRST = 'FIRST',
  LAST = 'LAST'
}

// Quiz Detail DTO
export interface QuizDetailDTO {
  id: number;
  title: string;
  description: string;
  passScore: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  roundingIncrement?: number;
  gradingMethod?: QuizGradingMethod;
  isAssessment?: boolean;
  cooldownHours?: number;
  orderIndex?: number;
  moduleId: number;
  questions: QuizQuestionDetailDTO[];
  createdAt: string;
  updatedAt: string;
}

// Quiz Summary DTO
export interface QuizSummaryDTO {
  id: number;
  title: string;
  description: string;
  passScore: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  roundingIncrement?: number;
  gradingMethod?: QuizGradingMethod;
  isAssessment?: boolean;
  cooldownHours?: number;
  orderIndex?: number;
  questionCount: number;
  moduleId?: number;
}

// Quiz Create DTO
export interface QuizCreateDTO {
  title: string;
  description: string;
  passScore: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  roundingIncrement?: number;
  gradingMethod?: QuizGradingMethod;
  isAssessment?: boolean;
  cooldownHours?: number;
  questions?: QuizQuestionCreateDTO[]; // Optional - can be added later
}

// Quiz Update DTO
export interface QuizUpdateDTO {
  title?: string;
  description?: string;
  passScore?: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  roundingIncrement?: number;
  gradingMethod?: QuizGradingMethod;
  isAssessment?: boolean;
  cooldownHours?: number;
}

// Quiz Question Detail DTO
export interface QuizQuestionDetailDTO {
  id: number;
  questionText: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options: QuizOptionDTO[];
  correctOptionCount?: number;
}

// Quiz Question Create DTO
export interface QuizQuestionCreateDTO {
  id?: number;
  clientId?: string;
  questionText: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options: QuizOptionCreateDTO[];
}

// Quiz Question Update DTO
export interface QuizQuestionUpdateDTO {
  questionText?: string;
  questionType?: QuestionType;
  score?: number;
  orderIndex?: number;
}

// Quiz Option DTO
export interface QuizOptionDTO {
  id: number;
  optionText: string;
  correct: boolean;
  orderIndex: number;
}

// Quiz Option Create DTO
export interface QuizOptionCreateDTO {
  id?: number;
  clientId?: string;
  optionText: string;
  correct: boolean;
  orderIndex?: number;
  feedback?: string;
}

// Quiz Option Update DTO
export interface QuizOptionUpdateDTO {
  optionText?: string;
  correct?: boolean;
}

// Quiz Attempt DTO
export interface QuizAttemptDTO {
  id: number;
  quizId: number;
  score: number;
  passed: boolean;
  quizTitle?: string;
  userId?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  submittedAt?: string;
  createdAt?: string;
  // Legacy fields (kept for backward compatibility)
  studentId?: number;
  startedAt?: string;
  completedAt?: string;
  answers?: QuizAnswerDTO[];
}

// Quiz Answer DTO
export interface QuizAnswerDTO {
  questionId: number;
  selectedOptionIds: number[];
  textAnswer?: string; // For SHORT_ANSWER questions
  isCorrect: boolean;
  scoreEarned: number;
}

// Submit Quiz DTO
export interface SubmitQuizDTO {
  quizId: number;
  answers: {
    questionId: number;
    selectedOptionIds?: number[]; // For MULTIPLE_CHOICE and TRUE_FALSE
    textAnswer?: string; // For SHORT_ANSWER
  }[];
}

// Quiz Attempt Status DTO (for retry logic)
export interface QuizAttemptStatusDTO {
  quizId: number;
  userId: number;
  attemptsUsed: number;
  maxAttempts: number;
  canRetry: boolean;
  hasPassed: boolean;
  bestScore: number;
  secondsUntilRetry: number;
  nextRetryAt: string | null;
  recentAttempts: QuizAttemptDTO[];
}

export interface QuizAttemptAnswerReviewDTO {
  questionId: number;
  questionOrderIndex?: number | null;
  questionText: string;
  questionType: QuestionType;
  submittedAnswer?: QuizAttemptSubmittedAnswerReviewDTO | null;
  optionsSnapshot?: QuizAttemptAnswerOptionReviewDTO[];
  submittedAnswerText?: string | null;
  correctAnswerText?: string | null;
  answered: boolean;
  correct: boolean;
  scoreEarned: number;
  maxScore: number;
}

export interface QuizAttemptSubmittedAnswerReviewDTO {
  selectedOptionIds?: number[];
  selectedOptionTexts?: string[];
  textAnswer?: string | null;
}

export interface QuizAttemptAnswerOptionReviewDTO {
  optionId: number;
  orderIndex?: number | null;
  optionText: string;
  correct: boolean;
  selected: boolean;
  feedback?: string | null;
}

export interface QuizAttemptReviewDTO {
  attempt: QuizAttemptDTO;
  answers: QuizAttemptAnswerReviewDTO[];
}
