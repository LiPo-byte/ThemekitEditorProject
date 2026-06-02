import { useEffect, useRef, useState } from 'react';

type UseEnterAnimationOptions = {
  durationMs?: number;
  initialPlayWhenTrue?: boolean;
};

export const useEnterAnimation = (
  trigger: boolean,
  options: UseEnterAnimationOptions = {},
) => {
  const { durationMs = 300, initialPlayWhenTrue = true } = options;
  const [playEnterAnimation, setPlayEnterAnimation] = useState(
    initialPlayWhenTrue ? trigger : false,
  );
  const prevTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTriggerRef.current) {
      setPlayEnterAnimation(true);
    }
    prevTriggerRef.current = trigger;
  }, [trigger]);

  useEffect(() => {
    if (!playEnterAnimation) return;
    const timer = window.setTimeout(() => {
      setPlayEnterAnimation(false);
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, playEnterAnimation]);

  return playEnterAnimation;
};
