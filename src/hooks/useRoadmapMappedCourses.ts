import { startTransition, useEffect, useMemo, useState } from "react";
import { CourseDetailDTO } from "../data/courseDTOs";
import { getCoursesBatch } from "../services/courseService";
import { RoadmapNode } from "../types/Roadmap";

type UseRoadmapMappedCoursesResult = {
  courseMap: Record<string, CourseDetailDTO | null>;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook for loading course data mapped to roadmap nodes.
 * @param nodes - Array of roadmap nodes with suggestedCourseIds
 * @param enabled - Whether to fetch courses
 * @param refreshKey - Optional trigger to force re-fetch (e.g. when course data changes)
 *
 * <p>Limitation: If getCoursesBatch() encounters a network/server error, it falls back to
 * individual course fetches via Promise.allSettled(). If ALL individual fetches also fail,
 * the hook returns an empty courseMap with error=null (not an error state), because the
 * fallback mechanism swallows errors. This is acceptable for UX (empty state shows as
 * "courses not available") but means true network errors may not surface to the UI.
 */
export const useRoadmapMappedCourses = (
  nodes: RoadmapNode[],
  enabled: boolean,
  refreshKey?: number,
): UseRoadmapMappedCoursesResult => {
  const [courseMap, setCourseMap] = useState<Record<string, CourseDetailDTO | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const allSuggestedCourseIds = useMemo(
    () =>
      enabled
        ? Array.from(
            new Set(nodes.flatMap((node) => node.suggestedCourseIds ?? [])),
          )
        : [],
    [enabled, nodes],
  );

  const courseIdsKey = useMemo(
    () => allSuggestedCourseIds.map((courseId) => String(courseId)).join(","),
    [allSuggestedCourseIds],
  );

  useEffect(() => {
    if (!enabled || allSuggestedCourseIds.length === 0) {
      setCourseMap({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const loadRelatedCourses = async () => {
      try {
        const nextCourseMap = await getCoursesBatch(allSuggestedCourseIds);
        if (!cancelled) {
          startTransition(() => {
            setCourseMap(nextCourseMap);
            setError(null);
          });
        }
      } catch (err) {
        console.error("Failed to load mapped roadmap courses:", err);
        if (!cancelled) {
          setCourseMap({});
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRelatedCourses();

    return () => {
      cancelled = true;
    };
  }, [allSuggestedCourseIds, courseIdsKey, enabled, refreshKey]);

  return {
    courseMap,
    isLoading,
    error,
  };
};

export default useRoadmapMappedCourses;
