import { startTransition, useEffect, useMemo, useState } from "react";
import { CourseDetailDTO } from "../data/courseDTOs";
import { getCoursesBatch } from "../services/courseService";
import { RoadmapNode } from "../types/Roadmap";

type UseRoadmapMappedCoursesResult = {
  courseMap: Record<string, CourseDetailDTO | null>;
  isLoading: boolean;
};

/**
 * Hook for loading course data mapped to roadmap nodes.
 * @param nodes - Array of roadmap nodes with suggestedCourseIds
 * @param enabled - Whether to fetch courses
 * @param refreshKey - Optional trigger to force re-fetch (e.g. when course data changes)
 */
export const useRoadmapMappedCourses = (
  nodes: RoadmapNode[],
  enabled: boolean,
  refreshKey?: number,
): UseRoadmapMappedCoursesResult => {
  const [courseMap, setCourseMap] = useState<Record<string, CourseDetailDTO | null>>({});
  const [isLoading, setIsLoading] = useState(false);

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
          });
        }
      } catch (error) {
        console.error("Failed to load mapped roadmap courses:", error);
        if (!cancelled) {
          setCourseMap({});
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
  };
};

export default useRoadmapMappedCourses;
