import { QuestionType } from '../../../data/quizDTOs';
import { LessonDraft, ModuleDraft } from './courseBuilderTypes';

export interface AssignmentCriteriaItemErrors {
  name?: string;
  maxPoints?: string;
}

export interface AssignmentFieldErrors {
  submissionType?: string;
  maxScore?: string;
  passingScore?: string;
  criteriaTotal?: string;
  criteriaItems?: Record<number, AssignmentCriteriaItemErrors>;
}

export interface AssignmentValidationResult {
  errorsByLesson: Record<string, AssignmentFieldErrors>;
  firstMessage: string | null;
}

export interface QuizOptionErrors {
  text?: string;
}

export interface QuizQuestionErrors {
  text?: string;
  score?: string;
  options?: string;
  optionItems?: Record<number, QuizOptionErrors>;
}

export interface QuizLessonErrors {
  lesson?: string;
  questions?: Record<string, QuizQuestionErrors>;
}

export interface QuizValidationResult {
  errorsByLesson: Record<string, QuizLessonErrors>;
  firstMessage: string | null;
}

export const validateAssignmentScore = (lesson: LessonDraft): boolean => {
  if (lesson.type !== 'assignment' || !lesson.assignmentCriteria?.length) return true;

  const totalCriteriaPoints = lesson.assignmentCriteria.reduce((sum, c) => {
    const points = Number(c.maxPoints);
    return sum + (Number.isFinite(points) ? points : 0);
  }, 0);

  const maxScore = Number.isFinite(Number(lesson.assignmentMaxScore))
    ? Number(lesson.assignmentMaxScore)
    : 100;

  return totalCriteriaPoints === maxScore;
};

export const validateAssignmentsBeforeSave = (modulesToCheck: ModuleDraft[]): AssignmentValidationResult => {
  const errorsByLesson: Record<string, AssignmentFieldErrors> = {};
  let firstMessage: string | null = null;

  const setFirst = (message: string) => {
    if (!firstMessage) firstMessage = message;
  };

  for (let mIndex = 0; mIndex < modulesToCheck.length; mIndex++) {
    const mod = modulesToCheck[mIndex];
    for (let lIndex = 0; lIndex < (mod.lessons || []).length; lIndex++) {
      const lesson = mod.lessons[lIndex];
      if (lesson.type !== 'assignment') continue;

      const lessonLabel = lesson.title?.trim() || `Bài học ${lIndex + 1}`;
      const lessonError: AssignmentFieldErrors = {};

      if (!lesson.assignmentSubmissionType) {
        const msg = `Bài tập "${lessonLabel}" (Module ${mIndex + 1}) chưa chọn hình thức nộp bài.`;
        lessonError.submissionType = 'Vui lòng chọn hình thức nộp bài.';
        setFirst(msg);
      }

      const maxScore = Number(lesson.assignmentMaxScore);
      if (!Number.isFinite(maxScore) || maxScore <= 0) {
        const msg = `Bài tập "${lessonLabel}" (Module ${mIndex + 1}) cần Điểm tối đa > 0.`;
        lessonError.maxScore = 'Điểm tối đa phải lớn hơn 0.';
        setFirst(msg);
      }

      if (lesson.assignmentPassingScore !== undefined && lesson.assignmentPassingScore !== null) {
        const passingScore = Number(lesson.assignmentPassingScore);
        if (!Number.isFinite(passingScore) || passingScore < 0) {
          const msg = `Bài tập "${lessonLabel}" (Module ${mIndex + 1}) có Điểm đạt không hợp lệ.`;
          lessonError.passingScore = 'Điểm đạt phải >= 0.';
          setFirst(msg);
        } else if (Number.isFinite(maxScore) && passingScore > maxScore) {
          const msg = `Bài tập "${lessonLabel}" (Module ${mIndex + 1}) có Điểm đạt > Điểm tối đa.`;
          lessonError.passingScore = 'Điểm đạt không được vượt quá Điểm tối đa.';
          setFirst(msg);
        }
      }

      if (lesson.assignmentCriteria && lesson.assignmentCriteria.length > 0) {
        let total = 0;
        const criteriaItems: Record<number, AssignmentCriteriaItemErrors> = {};

        for (let cIndex = 0; cIndex < lesson.assignmentCriteria.length; cIndex++) {
          const crit = lesson.assignmentCriteria[cIndex];
          const critErrors: AssignmentCriteriaItemErrors = {};
          const critName = (crit.name || '').trim();
          if (!critName) {
            const msg = `Tiêu chí ${cIndex + 1} của "${lessonLabel}" (Module ${mIndex + 1}) chưa có tên.`;
            critErrors.name = 'Tên tiêu chí là bắt buộc.';
            setFirst(msg);
          }
          const critPoints = Number(crit.maxPoints);
          if (!Number.isFinite(critPoints) || critPoints <= 0) {
            const msg = `Tiêu chí "${critName || `#${cIndex + 1}`}" của "${lessonLabel}" (Module ${mIndex + 1}) cần điểm > 0.`;
            critErrors.maxPoints = 'Điểm tiêu chí phải > 0.';
            setFirst(msg);
          }
          total += Number.isFinite(critPoints) ? critPoints : 0;
          if (Object.keys(critErrors).length > 0) {
            criteriaItems[cIndex] = critErrors;
          }
        }

        if (Object.keys(criteriaItems).length > 0) {
          lessonError.criteriaItems = criteriaItems;
        }

        if (Number.isFinite(maxScore) && total !== maxScore) {
          const msg = `Tổng điểm tiêu chí của "${lessonLabel}" (Module ${mIndex + 1}) phải bằng Điểm tối đa (${total} / ${maxScore}).`;
          lessonError.criteriaTotal = 'Tổng điểm tiêu chí phải bằng Điểm tối đa.';
          setFirst(msg);
        }
      }

      if (Object.keys(lessonError).length > 0) {
        errorsByLesson[lesson.id] = lessonError;
      }
    }
  }

  return { errorsByLesson, firstMessage };
};

export const validateQuizzesBeforeSave = (modulesToCheck: ModuleDraft[]): QuizValidationResult => {
  const errorsByLesson: Record<string, QuizLessonErrors> = {};
  let firstMessage: string | null = null;

  const setFirst = (message: string) => {
    if (!firstMessage) firstMessage = message;
  };

  for (let mIndex = 0; mIndex < modulesToCheck.length; mIndex++) {
    const mod = modulesToCheck[mIndex];
    for (let lIndex = 0; lIndex < (mod.lessons || []).length; lIndex++) {
      const lesson = mod.lessons[lIndex];
      if (lesson.type !== 'quiz') continue;

      const lessonLabel = lesson.title?.trim() || `Bài học ${lIndex + 1}`;
      const questions = lesson.questions || [];
      const lessonErrors: QuizLessonErrors = {};

      if (questions.length === 0) {
        const msg = `Quiz "${lessonLabel}" (Module ${mIndex + 1}) chưa có câu hỏi.`;
        lessonErrors.lesson = 'Quiz cần ít nhất 1 câu hỏi.';
        setFirst(msg);
      }

      const questionErrors: Record<string, QuizQuestionErrors> = {};

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];
        const qErrors: QuizQuestionErrors = {};
        const questionLabel = `Câu ${qIndex + 1} của "${lessonLabel}" (Module ${mIndex + 1})`;

        if (!question.text?.trim()) {
          qErrors.text = 'Nội dung câu hỏi là bắt buộc.';
          setFirst(`${questionLabel} chưa có nội dung.`);
        }

        const scoreValue = Number(question.score);
        if (!Number.isFinite(scoreValue) || scoreValue <= 0) {
          qErrors.score = 'Điểm phải lớn hơn 0.';
          setFirst(`${questionLabel} cần điểm > 0.`);
        }

        const options = question.options || [];
        const optionItems: Record<number, QuizOptionErrors> = {};
        let hasCorrect = false;
        let filledCount = 0;

        for (let oIndex = 0; oIndex < options.length; oIndex++) {
          const opt = options[oIndex];
          const text = (opt.text || '').trim();
          if (text) {
            filledCount += 1;
          } else {
            optionItems[oIndex] = { text: 'Nội dung đáp án là bắt buộc.' };
            setFirst(`${questionLabel} còn đáp án chưa có nội dung.`);
          }
          if (opt.correct) {
            hasCorrect = true;
          }
        }

        const minOptions = question.type === QuestionType.SHORT_ANSWER ? 1 : 2;
        if (options.length === 0 || filledCount < minOptions) {
          qErrors.options = `Cần ít nhất ${minOptions} đáp án có nội dung.`;
          setFirst(`${questionLabel} cần ít nhất ${minOptions} đáp án có nội dung.`);
        }

        if (!hasCorrect) {
          qErrors.options = qErrors.options || 'Cần chọn ít nhất 1 đáp án đúng.';
          setFirst(`${questionLabel} chưa có đáp án đúng.`);
        }

        if (Object.keys(optionItems).length > 0) {
          qErrors.optionItems = optionItems;
        }

        if (Object.keys(qErrors).length > 0) {
          questionErrors[question.id] = qErrors;
        }
      }

      if (Object.keys(questionErrors).length > 0) {
        lessonErrors.questions = questionErrors;
      }

      if (Object.keys(lessonErrors).length > 0) {
        errorsByLesson[lesson.id] = lessonErrors;
      }
    }
  }

  return { errorsByLesson, firstMessage };
};
