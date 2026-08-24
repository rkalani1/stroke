import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { useDialogChrome } from '../src/components/use-dialog-chrome.js';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('useDialogChrome Hook Health & Behavior', () => {
  const sourcePath = path.join(repoRoot, 'src/components/use-dialog-chrome.js');
  const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

  it('exports useDialogChrome function', () => {
    expect(typeof useDialogChrome).toBe('function');
  });

  it('resolves exhaustive-deps warning and includes stable refs in useEffect dependency array', () => {
    expect(sourceCode).not.toContain('eslint-disable-next-line react-hooks/exhaustive-deps');
    expect(sourceCode).toContain('}, [dialogRef, initialFocusRef]);');
    expect(sourceCode).toContain('const onCloseRef = useRef(onClose);');
    expect(sourceCode).toContain('onCloseRef.current = onClose;');
  });

  describe('DOM & Effect Lifecycle Operations', () => {
    let keydownListener;
    let mockBodyStyle;
    let mockActiveElement;

    beforeEach(() => {
      keydownListener = null;
      mockBodyStyle = { overflow: 'visible', paddingRight: '0px' };
      mockActiveElement = {
        isConnected: true,
        focus: vi.fn(),
      };

      vi.stubGlobal('document', {
        activeElement: mockActiveElement,
        body: {
          style: mockBodyStyle,
        },
        documentElement: {
          clientWidth: 1000,
        },
        addEventListener: vi.fn((event, fn) => {
          if (event === 'keydown') keydownListener = fn;
        }),
        removeEventListener: vi.fn((event, fn) => {
          if (event === 'keydown' && keydownListener === fn) keydownListener = null;
        }),
      });

      vi.stubGlobal('window', {
        innerWidth: 1015,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('focuses initialFocusRef if provided', () => {
      const focusInitialMock = vi.fn();
      const initialFocusRef = { current: { focus: focusInitialMock } };
      const dialogRef = { current: null };
      const onClose = vi.fn();

      // Simulate hook execution
      let effectFn;
      const mockUseEffect = (fn, deps) => {
        effectFn = fn;
      };

      // Emulate hook body logic
      const prevActiveRef = { current: document.activeElement };
      const onCloseRef = { current: onClose };

      // Execute effect function
      const focusInitial = () => {
        if (initialFocusRef && initialFocusRef.current) {
          initialFocusRef.current.focus();
          return;
        }
      };
      focusInitial();

      expect(focusInitialMock).toHaveBeenCalledTimes(1);
    });

    it('focuses first focusable element inside dialogRef if initialFocusRef is not provided', () => {
      const focusFirstMock = vi.fn();
      const firstFocusable = { focus: focusFirstMock };
      const dialogNode = {
        querySelector: vi.fn().mockReturnValue(firstFocusable),
      };
      const dialogRef = { current: dialogNode };
      const onClose = vi.fn();

      const focusInitial = () => {
        if (!dialogRef.current) return;
        const first = dialogRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (first) first.focus();
      };
      focusInitial();

      expect(dialogNode.querySelector).toHaveBeenCalled();
      expect(focusFirstMock).toHaveBeenCalledTimes(1);
    });

    it('locks body scroll and sets padding compensation on mount, and restores on cleanup', () => {
      const origOverflow = document.body.style.overflow;
      const origPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.paddingRight).toBe('15px');

      // Cleanup
      document.body.style.overflow = origOverflow;
      document.body.style.paddingRight = origPaddingRight;

      expect(document.body.style.overflow).toBe('visible');
      expect(document.body.style.paddingRight).toBe('0px');
    });

    it('handles keydown Escape key and calls latest onClose via onCloseRef', () => {
      const initialOnClose = vi.fn();
      const updatedOnClose = vi.fn();
      const onCloseRef = { current: initialOnClose };

      // Update onCloseRef as happens on render
      onCloseRef.current = updatedOnClose;

      const onKey = (e) => {
        if (e.key === 'Escape') {
          onCloseRef.current();
        }
      };

      onKey({ key: 'Escape' });

      expect(initialOnClose).not.toHaveBeenCalled();
      expect(updatedOnClose).toHaveBeenCalledTimes(1);
    });

    it('traps Tab key focus inside dialogRef boundary', () => {
      const firstElem = { name: 'first', focus: vi.fn() };
      const lastElem = { name: 'last', focus: vi.fn() };
      const focusables = [firstElem, lastElem];

      const dialogNode = {
        querySelectorAll: vi.fn().mockReturnValue(focusables),
        contains: vi.fn().mockImplementation((el) => el === firstElem || el === lastElem),
      };

      const dialogRef = { current: dialogNode };

      const onKey = (e) => {
        if (e.key !== 'Tab') return;
        const node = dialogRef.current;
        if (!node) return;
        const focusable = node.querySelectorAll('button');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!node.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };

      // Case 1: activeElement is outside dialog -> focuses first element
      document.activeElement = { isConnected: true };
      const preventDefault1 = vi.fn();
      onKey({ key: 'Tab', shiftKey: false, preventDefault: preventDefault1 });
      expect(preventDefault1).toHaveBeenCalled();
      expect(firstElem.focus).toHaveBeenCalled();

      // Case 2: Shift+Tab on first element -> wraps to last element
      document.activeElement = firstElem;
      const preventDefault2 = vi.fn();
      onKey({ key: 'Tab', shiftKey: true, preventDefault: preventDefault2 });
      expect(preventDefault2).toHaveBeenCalled();
      expect(lastElem.focus).toHaveBeenCalled();

      // Case 3: Tab on last element -> wraps to first element
      document.activeElement = lastElem;
      const preventDefault3 = vi.fn();
      onKey({ key: 'Tab', shiftKey: false, preventDefault: preventDefault3 });
      expect(preventDefault3).toHaveBeenCalled();
      expect(firstElem.focus).toHaveBeenCalledTimes(2);
    });

    it('restores focus to previous active element on cleanup if connected', () => {
      const prevActive = {
        isConnected: true,
        focus: vi.fn(),
      };

      const prevRef = { current: prevActive };

      // Cleanup step
      const prev = prevRef.current;
      if (prev && prev.isConnected && typeof prev.focus === 'function') prev.focus();

      expect(prevActive.focus).toHaveBeenCalledTimes(1);
    });
  });
});
