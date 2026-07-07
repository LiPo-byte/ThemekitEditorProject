export type ElementAbsoluteSize = {
  width: number;
  height: number;
};

export const getElementAbsoluteSize = (
  element: HTMLElement | null | undefined,
): ElementAbsoluteSize => {
  if (!element) {
    return { width: 0, height: 0 };
  }
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  };
};
