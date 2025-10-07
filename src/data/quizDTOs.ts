// Quiz DTOs - Matching Backend Structure

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_BLANK = 'FILL_BLANK'
}

// Quiz Detail DTO
export interface QuizDetailDTO {
  id: number;
  title: string;
  description: string;
  passScore: number;
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
  questionCount: number;
  moduleId?: number;
}

// Quiz Create DTO
export interface QuizCreateDTO {
  title: string;
  description: string;
  passScore: number;
  questions?: QuizQuestionCreateDTO[]; // Optional - can be added later
}

// Quiz Update DTO
export interface QuizUpdateDTO {
  title?: string;
  description?: string;
  passScore?: number;
}

// Quiz Question Detail DTO
export interface QuizQuestionDetailDTO {
  id: number;
  questionText: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options: QuizOptionDTO[];
}

// Quiz Question Create DTO
export interface QuizQuestionCreateDTO {
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
  optionText: string;
  correct: boolean;
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
  studentId: number;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
  answers: QuizAnswerDTO[];
}

// Quiz Answer DTO
export interface QuizAnswerDTO {
  questionId: number;
  selectedOptionIds: number[];
  isCorrect: boolean;
  scoreEarned: number;
}

// Submit Quiz DTO
export interface SubmitQuizDTO {
  quizId: number;
  answers: {
    questionId: number;
    selectedOptionIds: number[];
  }[];
}
