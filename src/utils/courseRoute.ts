const COURSE_PUBLIC_ID_PREFIX = "c_";
const DEFAULT_COURSE_SLUG = "khoa-hoc";

export const slugifyCourseTitle = (title?: string): string => {
  if (!title) {
    return DEFAULT_COURSE_SLUG;
  }

  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || DEFAULT_COURSE_SLUG;
};

export const encodeCoursePublicId = (courseId: number): string => {
  if (!Number.isFinite(courseId) || courseId <= 0) {
    throw new Error("Invalid course id");
  }
  return `${COURSE_PUBLIC_ID_PREFIX}${Math.trunc(courseId).toString(36)}`;
};

export const decodeCoursePublicId = (
  coursePublicId?: string | null
): number | undefined => {
  if (!coursePublicId || !coursePublicId.startsWith(COURSE_PUBLIC_ID_PREFIX)) {
    return undefined;
  }

  const encodedPart = coursePublicId.slice(COURSE_PUBLIC_ID_PREFIX.length);
  if (!encodedPart) {
    return undefined;
  }

  const decoded = Number.parseInt(encodedPart, 36);
  if (!Number.isFinite(decoded) || decoded <= 0) {
    return undefined;
  }

  return decoded;
};

export const resolveCourseIdFromRouteParams = (params: {
  legacyId?: string;
  coursePublicId?: string;
}): number | undefined => {
  const rawLegacyId = params.legacyId?.trim();
  if (rawLegacyId) {
    const parsed = Number(rawLegacyId);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    const decodedLegacy = decodeCoursePublicId(rawLegacyId);
    if (decodedLegacy) {
      return decodedLegacy;
    }
  }

  return decodeCoursePublicId(params.coursePublicId);
};

export const buildCourseDetailPath = (course: {
  id: number;
  title?: string;
}): string => {
  const slug = slugifyCourseTitle(course.title);
  const publicId = encodeCoursePublicId(course.id);
  return `/courses/${slug}/${publicId}`;
};

export const buildCourseLearningPath = (course: {
  id: number;
  title?: string;
}): string => {
  const slug = slugifyCourseTitle(course.title);
  const publicId = encodeCoursePublicId(course.id);
  return `/course-learning/${slug}/${publicId}`;
};
