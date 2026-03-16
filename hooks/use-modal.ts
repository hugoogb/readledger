import { useState, useCallback } from "react";

export function useModal(onClose?: () => void) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  return { isOpen, open, close };
}
