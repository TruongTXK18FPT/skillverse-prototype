import { startTransition, useEffect, useMemo, useState } from "react";
import { EnrollmentDetailDTO } from "../data/enrollmentDTOs";
import { getUserEnrollments } from "../services/enrollmentService";

type UseRoadmapCourseEnrollmentsResult = {
  enrollmentByCourseId: Record<string, EnrollmentDetailDTO | null>;
  isLoading: boolean;
};

const DEFAULT_PAGE_SIZE = 200;

export const useRoadmapCourseEnrollments = (
  userId: number | null | undefined,
  relevantCourseIds: Array<string | number>,
  enabled: boolean,
  /** Optional trigger to force a re-fetch (e.g. when user enrolls somewhere else) */
  refreshKey?: number,
): UseRoadmapCourseEnrollmentsResult => {
  const [enrollmentByCourseId, setEnrollmentByCourseId] = useState<
    Record<string, EnrollmentDetailDTO | null>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const normalizedCourseIds = useMemo(
    () =>
      Array.from(
        new Set(
          relevantCourseIds
            .map((courseId) => String(courseId).trim())
            .filter(Boolean),
        ),
      ),
    [relevantCourseIds],
  );

  const courseIdsKey = useMemo(
    () => normalizedCourseIds.join(","),
    [normalizedCourseIds],
  );

  useEffect(() => {
    if (!enabled || !userId || normalizedCourseIds.length === 0) {
      setEnrollmentByCourseId({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const loadEnrollments = async () => {
      try {
        const response = await getUserEnrollments(userId, 0, DEFAULT_PAGE_SIZE);
        if (cancelled) {
          return;
        }

        const nextEnrollmentMap = normalizedCourseIds.reduce<
          Record<string, EnrollmentDetailDTO | null>
        >((accumulator, courseId) => {
          const enrollment =
            response.content.find(
              (item) => String(item.courseId) === courseId,
            ) ?? null;
          accumulator[courseId] = enrollment;
          return accumulator;
        }, {});

        startTransition(() => {
          setEnrollmentByCourseId(nextEnrollmentMap);
        });
      } catch (error) {
        console.error("Failed to load roadmap course enrollments:", error);
        if (!cancelled) {
          setEnrollmentByCourseId({});
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [courseIdsKey, enabled, normalizedCourseIds, userId, refreshKey]);

  return {
    enrollmentByCourseId,
    isLoading,
  };
};

export default useRoadmapCourseEnrollments;
