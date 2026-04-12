import { startTransition, useEffect, useMemo, useState } from "react";
import { EnrollmentDetailDTO } from "../data/enrollmentDTOs";
import { getEnrollmentsByCourseIds } from "../services/enrollmentService";

type UseRoadmapCourseEnrollmentsResult = {
  enrollmentByCourseId: Record<string, EnrollmentDetailDTO | null>;
  isLoading: boolean;
};

/**
 * Hook for loading user enrollments mapped to roadmap course IDs.
 * Uses batch endpoint to avoid pagination page-size issues.
 * @param userId - The user's ID
 * @param relevantCourseIds - Course IDs to check enrollment for
 * @param enabled - Whether to fetch enrollments
 * @param refreshKey - Optional trigger to force a re-fetch (e.g. when user enrolls somewhere else)
 */
export const useRoadmapCourseEnrollments = (
  userId: number | null | undefined,
  relevantCourseIds: Array<string | number>,
  enabled: boolean,
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
        // MEDIUM-3 fix: Use batch endpoint instead of pagination with hardcoded page 200.
        // Batch endpoint returns exactly the enrollments for the course IDs we need,
        // regardless of how many total enrollments the user has.
        const enrollments = await getEnrollmentsByCourseIds(userId, normalizedCourseIds);
        if (cancelled) {
          return;
        }

        const nextEnrollmentMap: Record<string, EnrollmentDetailDTO | null> = {};
        for (const courseId of normalizedCourseIds) {
          const courseIdStr = String(courseId);
          const enrollment =
            enrollments.find(
              (item) => String(item.courseId) === courseIdStr,
            ) ?? null;
          nextEnrollmentMap[courseIdStr] = enrollment;
        }

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
