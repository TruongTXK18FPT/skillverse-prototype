export type RoadmapListNode = {
  id?: string;
  parentId?: string | null;
  children?: string[] | null;
  type?: string | null;
  isCore?: boolean | null;
  mainPathIndex?: number | null;
  orderIndex?: number | null;
};

const numericOrMax = (value: number | null | undefined): number =>
  Number.isFinite(value ?? NaN) ? Number(value) : Number.MAX_SAFE_INTEGER;

const isMainNode = (node: RoadmapListNode): boolean => {
  const type = node.type?.toString().toUpperCase();
  if (type === "SIDE" || node.isCore === false) return false;
  return type === "MAIN" || node.isCore === true || !node.parentId;
};

const compareNodeOrder = (
  left: RoadmapListNode,
  right: RoadmapListNode,
  originalIndex: Map<string, number>,
): number => {
  const mainDiff = numericOrMax(left.mainPathIndex) - numericOrMax(right.mainPathIndex);
  if (mainDiff !== 0) return mainDiff;

  const orderDiff = numericOrMax(left.orderIndex) - numericOrMax(right.orderIndex);
  if (orderDiff !== 0) return orderDiff;

  return (originalIndex.get(left.id ?? "") ?? 0) - (originalIndex.get(right.id ?? "") ?? 0);
};

const belongsToParent = (
  child: RoadmapListNode,
  parent: RoadmapListNode,
  childIds: Set<string>,
): boolean => {
  if (!child.id || child.id === parent.id) return false;
  if (child.parentId && child.parentId === parent.id) return true;
  if (childIds.has(child.id)) return true;
  return (
    child.parentId == null &&
    child.mainPathIndex != null &&
    parent.mainPathIndex != null &&
    child.mainPathIndex === parent.mainPathIndex &&
    !isMainNode(child)
  );
};

export const orderRoadmapNodesForWorkspace = <T extends RoadmapListNode>(nodes: T[]): T[] => {
  if (!Array.isArray(nodes) || nodes.length <= 1) {
    return nodes;
  }

  const originalIndex = new Map<string, number>();
  nodes.forEach((node, index) => {
    if (node.id) {
      originalIndex.set(node.id, index);
    }
  });

  const explicitMainNodes = nodes
    .filter(isMainNode)
    .sort((left, right) => compareNodeOrder(left, right, originalIndex));
  const mainNodes = explicitMainNodes.length > 0 ? explicitMainNodes : [...nodes];

  const ordered: T[] = [];
  const used = new Set<string>();

  mainNodes.forEach((mainNode) => {
    if (!mainNode.id || used.has(mainNode.id)) return;

    ordered.push(mainNode);
    used.add(mainNode.id);

    const childIds = new Set(mainNode.children ?? []);
    const children = nodes
      .filter((candidate) => candidate.id && !used.has(candidate.id) && belongsToParent(candidate, mainNode, childIds))
      .sort((left, right) => compareNodeOrder(left, right, originalIndex));

    children.forEach((child) => {
      if (!child.id || used.has(child.id)) return;
      ordered.push(child);
      used.add(child.id);
    });
  });

  nodes.forEach((node) => {
    if (!node.id || used.has(node.id)) return;
    ordered.push(node);
    used.add(node.id);
  });

  return ordered;
};
