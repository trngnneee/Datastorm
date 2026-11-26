import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { Root as PaginationRoot } from "@animate-ui/react/primitives/pagination";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** shadcn/ui pagination on Animate UI's Root: the current page's surface slides on `spring.selection`. */
function Pagination({
  className,
  ...props
}: React.ComponentProps<typeof PaginationRoot>) {
  return (
    <PaginationRoot
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  size?: "default" | "icon" | "sm";
} & React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          size,
          variant: isActive ? "outline" : "ghost",
        }),
        "tabular-nums",
        isActive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
      data-active={isActive}
      data-slot="pagination-link"
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("gap-1 px-2.5 sm:pe-3.5", className)}
      size="default"
      {...props}
    >
      <ChevronLeftIcon size={16} aria-hidden />
      <span className="hidden sm:inline">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("gap-1 px-2.5 sm:ps-3.5", className)}
      size="default"
      {...props}
    >
      <span className="hidden sm:inline">Next</span>
      <ChevronRightIcon size={16} aria-hidden />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 items-center justify-center text-muted-foreground",
        className,
      )}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon size={16} />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
