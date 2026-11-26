"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMotionTokens } from "@animate-ui/react/utils/motion";
import { useGlobalLoading } from "../../../context/loadingContext";

/** Slim indeterminate bar under the top bar while any request is in flight. */
export function LoadingBar() {
  const { isLoading } = useGlobalLoading();
  const { transition } = useMotionTokens();

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
      role="progressbar"
      aria-label="Loading data"
      aria-busy={isLoading}
      aria-hidden={!isLoading}
    >
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            key="bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: transition.fade }}
            transition={transition.fade}
            className="absolute inset-0"
          >
            <div className="loading-sweep absolute inset-y-0 w-1/3 rounded-full bg-primary" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
