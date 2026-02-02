import { useState, useCallback } from "react";

export function useToggleSet<T>(initialValues?: Iterable<T>) {
  const [set, setSet] = useState<Set<T>>(new Set(initialValues));

  const toggle = useCallback((value: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((values: T[]) => {
    setSet(new Set(values));
  }, []);

  const clear = useCallback(() => {
    setSet(new Set());
  }, []);

  const selectUpTo = useCallback(
    (values: T[], predicate: (value: T) => boolean) => {
      setSet(new Set(values.filter(predicate)));
    },
    [],
  );

  return { set, toggle, selectAll, clear, selectUpTo, size: set.size, has: set.has.bind(set) };
}
