"use client";

import { Effect, Effects } from "@animate-ui/react/primitives/effects/effect";

/**
 * Page-content entrances at the subtle level (Animate UI page recipe):
 * fade + 16px rise + light blur on `spring.entrance`, once, when in view.
 */
export function Reveal({ children, delay = 0, surface = false, className, asChild }) {
  return (
    <Effect
      fade
      slide={{ offset: 16 }}
      blur={{ initialBlur: surface ? 4 : 2 }}
      inView
      inViewOnce
      delay={delay}
      className={className}
      asChild={asChild}
    >
      {children}
    </Effect>
  );
}

/** Children come in one after the other, `holdDelay` ms apart. */
export function RevealGroup({ children, holdDelay = 80, delay = 0, asChild = true }) {
  return (
    <Effects
      fade
      slide={{ offset: 16 }}
      blur={{ initialBlur: 4 }}
      inView
      inViewOnce
      delay={delay}
      holdDelay={holdDelay}
      asChild={asChild}
    >
      {children}
    </Effects>
  );
}
