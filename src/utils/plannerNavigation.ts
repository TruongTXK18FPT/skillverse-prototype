type BuildRoadmapPlanningPathOptions = {
  nodeId?: string | null;
  expandedIds?: string[] | null;
  source?: string | null;
  taskId?: string | null;
};

export const PLANNER_MIGRATION_SOURCE = "study-planner-migration";

export const parseExpandedNodeIds = (
  input: URLSearchParams | string | null | undefined,
): string[] => {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const rawValue = params?.get("expanded") ?? "";

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildRoadmapPlanningPath = (
  roadmapId?: number | string | null,
  options: BuildRoadmapPlanningPathOptions = {},
): string => {
  if (!roadmapId) {
    return "/roadmap";
  }

  const params = new URLSearchParams();
  if (options.nodeId) {
    params.set("nodeId", options.nodeId);
  }
  if (options.expandedIds && options.expandedIds.length > 0) {
    params.set("expanded", options.expandedIds.join(","));
  }
  if (options.source) {
    params.set("source", options.source);
  }
  if (options.taskId) {
    params.set("taskId", options.taskId);
  }

  const query = params.toString();
  return query ? `/roadmap/${roadmapId}?${query}` : `/roadmap/${roadmapId}`;
};
