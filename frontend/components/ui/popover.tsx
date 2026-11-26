"use client";

import { Popover as PopoverPrimitive } from "@animate-ui/react/primitives/radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  showArrow = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  showArrow?: boolean;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden",
          className,
        )}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...props}
      >
        {props.children}
        {showArrow && (
          <PopoverPrimitive.Arrow className="-my-px fill-popover drop-shadow-[0_1px_0_var(--border)]" />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
