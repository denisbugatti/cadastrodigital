/**
 * FormFlow — Organic Flow Design
 * Keyboard navigation hook for conversational form.
 */

import { useEffect } from "react";

interface UseKeyboardNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  isFirst: boolean;
  isThankYou: boolean;
  isTextInput?: boolean;
}

export function useKeyboardNavigation({
  onNext,
  onPrev,
  canGoNext,
  isFirst,
  isThankYou,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a textarea
      const target = e.target as HTMLElement;
      const isTextarea = target.tagName === "TEXTAREA";

      if (e.key === "Enter" && !e.shiftKey && !isTextarea) {
        e.preventDefault();
        if (canGoNext && !isThankYou) {
          onNext();
        }
      }

      // Enter in textarea only advances with Cmd/Ctrl+Enter
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && isTextarea) {
        e.preventDefault();
        if (canGoNext && !isThankYou) {
          onNext();
        }
      }

      // Arrow up or Page up to go back
      if ((e.key === "ArrowUp" || e.key === "PageUp") && !isFirst) {
        e.preventDefault();
        onPrev();
      }

      // Arrow down or Page down to go next
      if ((e.key === "ArrowDown" || e.key === "PageDown") && canGoNext && !isThankYou) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, canGoNext, isFirst, isThankYou]);
}
