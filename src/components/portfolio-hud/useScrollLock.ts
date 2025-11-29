/**
 * useScrollLock Hook
 * Prevents body scrolling when modal is open
 * Handles scrollbar width compensation to prevent layout shift
 */

import { useEffect } from 'react';

export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    // Get original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';

    // Prevent layout shift by adding padding equal to scrollbar width
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    }

    // Add class for additional CSS targeting
    document.body.classList.add('dossier-body-scroll-lock');

    // Cleanup function
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.removeProperty('--scrollbar-width');
      document.body.classList.remove('dossier-body-scroll-lock');
    };
  }, [isLocked]);
};