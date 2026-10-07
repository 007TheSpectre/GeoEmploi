import { useEffect, useRef } from 'react';
import { useBodyScrollLock } from './useBodyScrollLock';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const useFocusTrap = (
  isOpen,
  { onClose, initialFocusRef, returnFocus = true, lockScroll = true } = {},
) => {
  const containerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  const onCloseRef = useRef(onClose);
  const returnFocusRef = useRef(returnFocus);
  const initialFocusRefRef = useRef(initialFocusRef);

  useEffect(() => {
    onCloseRef.current = onClose;
    returnFocusRef.current = returnFocus;
    initialFocusRefRef.current = initialFocusRef;
  });

  useBodyScrollLock(Boolean(isOpen && lockScroll));

  useEffect(() => {
    if (!isOpen)
      return;

    previousActiveElementRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container)
      return;

    const getFocusableElements = () => {
      if (!container)
        return [];
      const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      return elements.filter((el) => {
        return (
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length > 0 ||
          window.getComputedStyle(el).visibility !== 'hidden'
        );
      });
    };

    const focusTimer = setTimeout(() => {
      if (!container)
        return;
      if (container.contains(document.activeElement))
        return;

      if (initialFocusRefRef.current && initialFocusRefRef.current.current) {
        initialFocusRefRef.current.current.focus();
      } else {
        const focusable = getFocusableElements();
        const firstFormField = focusable.find((el) =>
          ['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())
        );
        const target = firstFormField || focusable[0];
        if (target) {
          target.focus();
        } else {
          container.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCloseRef.current) {
          e.preventDefault();
          e.stopPropagation();
          onCloseRef.current();
        }
        return;
      }

      if (e.key !== 'Tab')
        return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (
        returnFocusRef.current &&
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
};
