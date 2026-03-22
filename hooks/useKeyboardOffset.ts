import { useEffect, RefObject } from 'react';

/**
 * Handles virtual keyboard appearance on mobile by setting a CSS custom
 * property (--keyboard-offset) on the container element.
 */
export function useKeyboardOffset(containerRef: RefObject<HTMLDivElement | null>): void {
    useEffect(() => {
        const handleViewportResize = () => {
            if (!containerRef.current) return;

            const viewport = window.visualViewport;
            if (!viewport) return;

            const keyboardHeight = window.innerHeight - viewport.height;

            if (keyboardHeight > 0) {
                containerRef.current.style.setProperty('--keyboard-offset', `${keyboardHeight}px`);
            } else {
                containerRef.current.style.setProperty('--keyboard-offset', '0px');
            }
        };

        const viewport = window.visualViewport;
        if (viewport) {
            viewport.addEventListener('resize', handleViewportResize);
            viewport.addEventListener('scroll', handleViewportResize);
        }

        window.addEventListener('resize', handleViewportResize);

        return () => {
            if (viewport) {
                viewport.removeEventListener('resize', handleViewportResize);
                viewport.removeEventListener('scroll', handleViewportResize);
            }
            window.removeEventListener('resize', handleViewportResize);
        };
    }, [containerRef]);
}
