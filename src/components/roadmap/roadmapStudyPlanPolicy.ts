import { CourseDetailDTO } from "../../data/courseDTOs";
import { RoadmapNode } from "../../types/Roadmap";

export type StudyPlanIntensityId = "light" | "balanced" | "intensive";
export type StudyWindowId = "morning" | "afternoon" | "evening" | "flexible";

const WEEKDAY_SEQUENCE = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const DEFAULT_DAYS_BY_WINDOW: Record<StudyWindowId, string[]> = {
  morning: ["MONDAY", "WEDNESDAY", "FRIDAY"],
  afternoon: ["TUESDAY", "THURSDAY", "SATURDAY"],
  evening: ["MONDAY", "WEDNESDAY", "FRIDAY"],
  flexible: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
};

export const STUDY_WINDOW_PRESETS: Record<
  StudyWindowId,
  {
    preferredTimeWindows: string[];
    earliestStartLocalTime: string;
    latestEndLocalTime: string;
  }
> = {
  morning: {
    preferredTimeWindows: ["07:00-10:00"],
    earliestStartLocalTime: "06:30",
    latestEndLocalTime: "21:30",
  },
  afternoon: {
    preferredTimeWindows: ["13:30-17:00"],
    earliestStartLocalTime: "08:00",
    latestEndLocalTime: "22:00",
  },
  evening: {
    preferredTimeWindows: ["18:30-22:00"],
    earliestStartLocalTime: "09:00",
    latestEndLocalTime: "22:30",
  },
  flexible: {
    preferredTimeWindows: ["08:00-10:30", "19:00-21:30"],
    earliestStartLocalTime: "07:00",
    latestEndLocalTime: "22:30",
  },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

export const resolveRoadmapWorkloadMinutes = (
  node: RoadmapNode | null | undefined,
  primaryCourse?: CourseDetailDTO | null,
): number => {
  if (!node) {
    if (
      primaryCourse?.estimatedDurationHours &&
      primaryCourse.estimatedDurationHours > 0
    ) {
      return Math.round(primaryCourse.estimatedDurationHours * 60);
    }

    return 180;
  }

  if (node.estimatedTimeMinutes && node.estimatedTimeMinutes > 0) {
    return node.estimatedTimeMinutes;
  }

  if (
    primaryCourse?.estimatedDurationHours &&
    primaryCourse.estimatedDurationHours > 0
  ) {
    return Math.round(primaryCourse.estimatedDurationHours * 60);
  }

  const learningObjectivesCount = node.learningObjectives?.filter(Boolean).length ?? 0;
  const keyConceptsCount = node.keyConcepts?.filter(Boolean).length ?? 0;
  const practicalExercisesCount = node.practicalExercises?.filter(Boolean).length ?? 0;
  const successCriteriaCount = node.successCriteria?.filter(Boolean).length ?? 0;

  const weightedMinutes =
    learningObjectivesCount * 12 +
    keyConceptsCount * 8 +
    practicalExercisesCount * 20 +
    successCriteriaCount * 6;

  return clamp(weightedMinutes || 180, 90, 16 * 60);
};

export const resolvePreferredStudyDays = (
  selectedDays: string[],
  studyWindow: StudyWindowId,
): string[] =>
  selectedDays.length > 0
    ? selectedDays
    : DEFAULT_DAYS_BY_WINDOW[studyWindow];

export const resolvePreferredTimeWindows = (
  studyWindow: StudyWindowId,
): string[] => STUDY_WINDOW_PRESETS[studyWindow].preferredTimeWindows;

const getIntensityPaceMultiplier = (intensity: StudyPlanIntensityId): number => {
  switch (intensity) {
    case "light":
      return 2.2;
    case "balanced":
      return 1.5;
    case "intensive":
      return 1;
    default:
      return 1.5;
  }
};

const getNextMatchingStudyDate = (
  currentDate: Date,
  preferredDays: string[],
): Date => {
  if (preferredDays.length === 0) {
    return currentDate;
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(currentDate, offset);
    const dayKey = WEEKDAY_SEQUENCE[candidate.getDay()];
    if (preferredDays.includes(dayKey)) {
      return candidate;
    }
  }

  return currentDate;
};

export const inferRoadmapStudyPlanDeadline = ({
  startDate,
  intensity,
  preferredDays,
  workloadMinutes,
  durationMinutes,
  maxSessionsPerDay,
  childBranchCount = 0,
}: {
  startDate: string;
  intensity: StudyPlanIntensityId;
  preferredDays: string[];
  workloadMinutes: number;
  durationMinutes: number;
  maxSessionsPerDay: number;
  childBranchCount?: number;
}): string => {
  const normalizedStart = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(normalizedStart.getTime())) {
    return startDate;
  }

  const scopedWorkloadMinutes = Math.round(
    workloadMinutes * (1 + childBranchCount * 0.35),
  );
  const dailyCapacity = Math.max(durationMinutes * maxSessionsPerDay, 30);
  const requiredStudyDays = Math.max(
    1,
    Math.ceil(scopedWorkloadMinutes / dailyCapacity),
  );
  const pacedStudyDays = Math.max(
    1,
    Math.ceil(requiredStudyDays * getIntensityPaceMultiplier(intensity)),
  );

  let current = normalizedStart;
  let consumedStudyDays = 0;
  while (consumedStudyDays < pacedStudyDays - 1) {
    current = addDays(current, 1);
    const matchingDate = getNextMatchingStudyDate(current, preferredDays);
    current = matchingDate;
    consumedStudyDays += 1;
  }

  if (current < normalizedStart) {
    return startDate;
  }

  return toIsoDate(current);
};
