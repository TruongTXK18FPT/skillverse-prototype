// Codelab (Coding Exercise) DTOs - Matching Backend Structure

export enum ProgrammingLanguage {
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  JAVASCRIPT = 'JAVASCRIPT',
  TYPESCRIPT = 'TYPESCRIPT',
  CPP = 'CPP',
  CSHARP = 'CSHARP',
  GO = 'GO',
  RUST = 'RUST'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT'
}

// Coding Exercise Detail DTO
export interface CodingExerciseDetailDTO {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  language: ProgrammingLanguage;
  starterCode?: string;
  solutionCode?: string;
  moduleId: number;
  testCases: CodingTestCaseDTO[];
  createdAt: string;
  updatedAt: string;
}

// Coding Exercise Summary DTO
export interface CodingExerciseSummaryDTO {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  language: ProgrammingLanguage;
  testCaseCount: number;
  moduleId?: number;
}

// Coding Exercise Create DTO
export interface CodingExerciseCreateDTO {
  title: string;
  description: string;
  difficulty: string;
  language: ProgrammingLanguage;
  starterCode?: string;
  solutionCode?: string;
  moduleId: number;
  testCases: CodingTestCaseCreateDTO[];
}

// Coding Exercise Update DTO
export interface CodingExerciseUpdateDTO {
  title?: string;
  description?: string;
  difficulty?: string;
  language?: ProgrammingLanguage;
  starterCode?: string;
  solutionCode?: string;
}

// Coding Test Case DTO
export interface CodingTestCaseDTO {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

// Coding Test Case Create DTO
export interface CodingTestCaseCreateDTO {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

// Coding Test Case Update DTO
export interface CodingTestCaseUpdateDTO {
  input?: string;
  expectedOutput?: string;
  isHidden?: boolean;
  orderIndex?: number;
}

// Coding Submission Detail DTO
export interface CodingSubmissionDetailDTO {
  id: number;
  codingExerciseId: number;
  studentId: number;
  studentName: string;
  code: string;
  language: ProgrammingLanguage;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  output?: string;
  submittedAt: string;
}

// Coding Submission Create DTO
export interface CodingSubmissionCreateDTO {
  codingExerciseId: number;
  code: string;
  language: ProgrammingLanguage;
}

// Run Code DTO (for testing without submission)
export interface RunCodeDTO {
  code: string;
  language: ProgrammingLanguage;
  input?: string;
}

// Run Code Result DTO
export interface RunCodeResultDTO {
  output: string;
  executionTime: number;
  memoryUsed: number;
  status: SubmissionStatus;
  errorMessage?: string;
}
