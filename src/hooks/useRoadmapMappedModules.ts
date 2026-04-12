import { useMemo } from "react";
import { CourseDetailDTO, ModuleSummaryDTO } from "../data/courseDTOs";
import { RoadmapNode } from "../types/Roadmap";

type UseRoadmapMappedModulesResult = {
  /** Map of moduleId (string) -> ModuleSummaryDTO. Only modules that are both in suggestedModuleIds AND exist in courseMap are included. */
  mappedModules: Record<string, ModuleSummaryDTO>;
};

/**
 * Extract module summaries from courses already loaded by useRoadmapMappedCourses.
 * Does NOT make additional API calls — uses modules[] from CourseDetailDTO.
 *
 * For nodes with suggestedModuleIds, resolves which modules belong to which course
 * using the module index, then returns a flat map of moduleId -> ModuleSummaryDTO.
 *
 * @param courseMap - Course data loaded by useRoadmapMappedCourses
 * @param selectedNode - The currently selected roadmap node
 * @param isLoading - Pass true when courseMap is still being populated
 */
export const useRoadmapMappedModules = (
  courseMap: Record<string, CourseDetailDTO | null>,
  selectedNode: RoadmapNode | null,
): UseRoadmapMappedModulesResult => {
  const mappedModules = useMemo(() => {
    if (!selectedNode?.suggestedModuleIds?.length) {
      return {};
    }

    const result: Record<string, ModuleSummaryDTO> = {};

    // Build a flat map: courseId -> CourseDetailDTO (skip nulls)
    const validCourses = Object.values(courseMap).filter(
      (c): c is CourseDetailDTO => c !== null,
    );
    if (validCourses.length === 0) {
      return {};
    }

    const courseById = new Map<number, CourseDetailDTO>();
    for (const course of validCourses) {
      courseById.set(course.id, course);
    }

    // For each suggested module ID, find which course it belongs to
    // and extract the module from that course's modules[].
    // We need to match modules to the selectedNode's suggestedCourseIds too.
    const suggestedModuleIds = selectedNode.suggestedModuleIds ?? [];
    const suggestedCourseIds = new Set(
      (selectedNode.suggestedCourseIds ?? []).map((id) => Number(id)),
    );

    for (const moduleIdStr of suggestedModuleIds) {
      const moduleIdNum = Number(moduleIdStr);
      if (!Number.isFinite(moduleIdNum)) continue;

      // Search through courses that are in suggestedCourseIds
      for (const courseId of suggestedCourseIds) {
        const course = courseById.get(courseId);
        if (!course?.modules) continue;

        const found = course.modules.find((m) => m.id === moduleIdNum);
        if (found) {
          result[String(moduleIdNum)] = found;
          break; // Found, no need to search other courses
        }
      }

      // Fallback: search ALL loaded courses (in case module belongs to a course not in suggestedCourseIds)
      if (!result[String(moduleIdNum)]) {
        for (const course of validCourses) {
          const found = course.modules?.find((m) => m.id === moduleIdNum);
          if (found) {
            result[String(moduleIdNum)] = found;
            break;
          }
        }
      }
    }

    return result;
  }, [courseMap, selectedNode]);

  return {
    mappedModules,
  };
};

export default useRoadmapMappedModules;