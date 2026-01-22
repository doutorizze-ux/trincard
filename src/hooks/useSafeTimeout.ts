import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para gerenciar timeouts de forma segura, evitando memory leaks
 */
export function useSafeTimeout() {
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      callback();
    }, delay);
    
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  const clearSafeTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId);
    timeoutRefs.current.delete(timeoutId);
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  return { setSafeTimeout, clearSafeTimeout };
}

/**
 * Hook para gerenciar intervals de forma segura, evitando memory leaks
 */
export function useSafeInterval() {
  const intervalRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const setSafeInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = setInterval(callback, delay);
    intervalRefs.current.add(intervalId);
    return intervalId;
  }, []);

  const clearSafeInterval = useCallback((intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
    intervalRefs.current.delete(intervalId);
  }, []);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(intervalId => {
        clearInterval(intervalId);
      });
      intervalRefs.current.clear();
    };
  }, []);

  return { setSafeInterval, clearSafeInterval };
}