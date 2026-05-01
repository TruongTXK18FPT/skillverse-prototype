import { RefObject, useCallback } from 'react';

type ScrollBehaviorOption = ScrollBehavior;

interface UseScrollToListTopOnPaginationOptions<T extends HTMLElement> {
  targetRef?: RefObject<T | null>;
  behavior?: ScrollBehaviorOption;
  block?: ScrollLogicalPosition;
  offset?: number;
}

const getScrollableAncestor = (element: Element | null) => {
  let current = element?.parentElement ?? null;

  while (current) {
    const style = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll|overlay)/.test(
      `${style.overflowY}${style.overflow}`,
    );

    if (canScrollY && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

export const useScrollToListTopOnPagination = <T extends HTMLElement = HTMLElement>({
  targetRef,
  behavior = 'smooth',
  block = 'start',
  offset = 16,
}: UseScrollToListTopOnPaginationOptions<T> = {}) => {
  const scrollToListTop = useCallback((triggerElement?: Element | null) => {
    let target = targetRef?.current;

    if (!target && triggerElement) {
      target = triggerElement.closest(
        '[data-scroll-target], section, article, .hud-card, .card, [class$="-container"], [class$="-wrapper"], .tab-pane, .panel, .admin-panel'
      ) as HTMLElement | null;
    }

    const scrollableAncestor = getScrollableAncestor(target ?? triggerElement ?? null);

    window.requestAnimationFrame(() => {

      if (target) {
        if (scrollableAncestor) {
          const top =
            target.getBoundingClientRect().top -
            scrollableAncestor.getBoundingClientRect().top +
            scrollableAncestor.scrollTop -
            offset;

          scrollableAncestor.scrollTo({
            top: Math.max(0, top),
            behavior,
          });
          return;
        }

        if (offset > 0) {
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, top), behavior });
          return;
        }

        target.scrollIntoView({ behavior, block });
        return;
      }

      if (scrollableAncestor) {
        scrollableAncestor.scrollTo({ top: 0, behavior });
        return;
      }

      window.scrollTo({ top: 0, behavior });
    });
  }, [behavior, block, offset, targetRef]);

  const withPaginationScroll = useCallback(
    <Args extends unknown[]>(onPageChange: (...args: Args) => void) => {
      return (...args: Args) => {
        const triggerElement =
          typeof document !== 'undefined' ? document.activeElement : null;

        onPageChange(...args);
        scrollToListTop(triggerElement);
      };
    },
    [scrollToListTop],
  );

  return { scrollToListTop, withPaginationScroll };
};
