/**
 * Debounce utility - delays function execution until after wait milliseconds
 * have elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle utility - ensures function is called at most once per wait milliseconds.
 * Uses leading edge execution (fires immediately on first call).
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();

    if (lastCallTime === null || now - lastCallTime >= wait) {
      lastCallTime = now;
      fn(...args);
    } else if (timeoutId === null) {
      const remaining = wait - (now - lastCallTime);
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}
