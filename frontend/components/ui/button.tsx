import { cva, type VariantProps } from "class-variance-authority";
import { Button as ButtonPrimitive } from "@animate-ui/react/primitives/buttons/button";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm outline-none transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-4",
        icon: "size-9",
        lg: "h-10 px-6",
        sm: "h-8 px-3 text-[13px]",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border bg-card shadow-xs hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
  },
);

type ButtonProps = React.ComponentProps<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants>;

/** shadcn/ui Button on Animate UI's Button primitive: presses to 0.97 on `spring.press`, no hover scale. */
function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
