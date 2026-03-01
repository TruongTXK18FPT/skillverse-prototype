export type LearningContentType = 'lesson' | 'quiz' | 'assignment';

export interface CourseLearningOrigin {
  pathname: string;
  search?: string;
  hash?: string;
  label?: string;
}

export interface CourseLearningLocationState {
  courseId?: number;
  preview?: boolean;
  resumeItem?: {
    moduleId: number;
    lessonId: number;
    itemType: LearningContentType;
  };
  origin?: CourseLearningOrigin;
}

export const COURSE_LEARNING_RETURN_KEY = 'course-learning-return-context';
const COURSE_LEARNING_CONTEXT_MAX_AGE_MS = 1000 * 60 * 60 * 4;

interface StoredCourseLearningContext extends CourseLearningLocationState {
  storedAt: number;
}

export const buildCourseLearningOrigin = (
  pathname: string,
  options?: {
    search?: string;
    hash?: string;
  label?: string;
  }
): CourseLearningOrigin => ({
  pathname,
  search: options?.search ?? '',
  hash: options?.hash ?? '',
  label: options?.label,
});

export const buildCourseLearningSearch = (
  state: Pick<CourseLearningLocationState, 'courseId' | 'preview'>
) => {
  const params = new URLSearchParams();

  if (state.courseId) {
    params.set('courseId', String(state.courseId));
  }

  if (state.preview) {
    params.set('preview', '1');
  }

  const search = params.toString();
  return search ? `?${search}` : '';
};

export const buildCourseLearningDestination = (
  state: CourseLearningLocationState
) => ({
  pathname: '/course-learning',
  search: buildCourseLearningSearch(state),
});

export const clearCourseLearningReturnContext = () => {
  sessionStorage.removeItem(COURSE_LEARNING_RETURN_KEY);
};

export const persistCourseLearningReturnContext = (
  state: CourseLearningLocationState
) => {
  if (!state.courseId) {
    clearCourseLearningReturnContext();
    return;
  }

  const payload: StoredCourseLearningContext = {
    ...state,
    storedAt: Date.now(),
  };

  sessionStorage.setItem(COURSE_LEARNING_RETURN_KEY, JSON.stringify(payload));
};

export const readStoredCourseLearningReturnContext =
  (): CourseLearningLocationState | null => {
    const raw = sessionStorage.getItem(COURSE_LEARNING_RETURN_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredCourseLearningContext;

      if (!parsed || typeof parsed.courseId !== 'number' || !Number.isFinite(parsed.courseId)) {
        clearCourseLearningReturnContext();
        return null;
      }

      if (typeof parsed.storedAt !== 'number') {
        clearCourseLearningReturnContext();
        return null;
      }

      if (Date.now() - parsed.storedAt > COURSE_LEARNING_CONTEXT_MAX_AGE_MS) {
        clearCourseLearningReturnContext();
        return null;
      }

      return {
        courseId: parsed.courseId,
        preview: Boolean(parsed.preview),
        origin: parsed.origin,
        resumeItem: parsed.resumeItem,
      };
    } catch {
      clearCourseLearningReturnContext();
      return null;
    }
  };

export const resolveCourseLearningOrigin = (
  state: CourseLearningLocationState | null | undefined,
  fallbackPath = '/courses'
) => {
  if (state?.origin?.pathname) {
    return {
      pathname: state.origin.pathname,
      search: state.origin.search ?? '',
      hash: state.origin.hash ?? '',
      label: state.origin.label ?? 'trang trước',
    };
  }

  return {
    pathname: fallbackPath,
    search: '',
    hash: '',
    label: 'khóa học',
  };
};
