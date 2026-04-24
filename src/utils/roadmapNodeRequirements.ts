import type { NodeAssignmentResponse } from '../types/NodeMentoring';
import type { RoadmapNode } from '../types/Roadmap';

export type EditableRequirementField =
  | 'learningObjectives'
  | 'keyConcepts'
  | 'practicalExercises'
  | 'successCriteria'
  | 'prerequisites';

export const normalizeRequirementItems = (
  items?: string[] | null,
): string[] =>
  (items ?? [])
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item));

export const multilineTextToList = (value?: string | null): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

export const listToMultilineText = (
  items?: string[] | null,
): string => normalizeRequirementItems(items).join('\n');

export const hasMentorAssignmentContent = (
  assignment?: Partial<NodeAssignmentResponse> | null,
): boolean =>
  Boolean(assignment?.title?.trim() || assignment?.description?.trim());

const normalizeLookupKey = (value?: string | null): string =>
  (value ?? '').trim().toLowerCase();

const buildNodeLookups = (nodes?: Partial<RoadmapNode>[] | null) => {
  const byId = new Map<string, string>();
  const byNormalizedTitle = new Map<string, string>();

  (nodes ?? []).forEach((node) => {
    const id = node?.id?.trim();
    const title = node?.title?.trim();

    if (!id || !title) {
      return;
    }

    byId.set(id, title);
    byNormalizedTitle.set(normalizeLookupKey(title), id);
  });

  return { byId, byNormalizedTitle };
};

export const resolvePrerequisiteLabels = (
  prerequisites?: string[] | null,
  nodes?: Partial<RoadmapNode>[] | null,
): string[] => {
  const { byId } = buildNodeLookups(nodes);

  return normalizeRequirementItems(prerequisites).map((item) => byId.get(item) ?? item);
};

export const resolvePrerequisiteIds = (
  prerequisites?: string[] | null,
  nodes?: Partial<RoadmapNode>[] | null,
): string[] => {
  const { byId, byNormalizedTitle } = buildNodeLookups(nodes);

  return normalizeRequirementItems(prerequisites).map((item) => {
    if (byId.has(item)) {
      return item;
    }

    return byNormalizedTitle.get(normalizeLookupKey(item)) ?? item;
  });
};

export const getRoadmapNodeRequirementSections = (
  node?: Partial<RoadmapNode> | null,
  allNodes?: Partial<RoadmapNode>[] | null,
): Array<{
  key: EditableRequirementField;
  title: string;
  items: string[];
}> => {
  if (!node) {
    return [];
  }

  return [
    {
      key: 'learningObjectives',
      title: 'Mục tiêu học tập',
      items: normalizeRequirementItems(node.learningObjectives),
    },
    {
      key: 'keyConcepts',
      title: 'Khái niệm trọng tâm',
      items: normalizeRequirementItems(node.keyConcepts),
    },
    {
      key: 'practicalExercises',
      title: 'Bài tập cần hoàn thành',
      items: normalizeRequirementItems(node.practicalExercises),
    },
    {
      key: 'successCriteria',
      title: 'Tiêu chí hoàn thành',
      items: normalizeRequirementItems(node.successCriteria),
    },
    {
      key: 'prerequisites',
      title: 'Điều kiện tiên quyết',
      items: resolvePrerequisiteLabels(node.prerequisites, allNodes),
    },
  ].filter((section) => section.items.length > 0);
};

export const hasRoadmapNodeRequirementContent = (
  node?: Partial<RoadmapNode> | null,
): boolean =>
  Boolean(
    node?.description?.trim() || getRoadmapNodeRequirementSections(node).length,
  );
