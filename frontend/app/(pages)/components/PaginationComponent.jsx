import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/** Pages to show: always first and last, a window around the current one. */
const getPageRange = (currentPage, totalPages, maxVisible = 7) => {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages - 1, currentPage + Math.floor(maxVisible / 2));

  if (currentPage <= Math.ceil(maxVisible / 2)) {
    end = Math.min(totalPages - 1, maxVisible);
    start = 2;
  }
  if (currentPage > totalPages - Math.ceil(maxVisible / 2)) {
    start = Math.max(2, totalPages - maxVisible + 1);
    end = totalPages - 1;
  }

  const pages = [1];
  for (let i = start; i <= end; i++) pages.push(i);
  pages.push(totalPages);
  return [...new Set(pages)].filter((p) => p >= 1 && p <= totalPages);
};

function PaginationComponent({ numberOfPages, currentPage, controlPage }) {
  const total = numberOfPages ?? 0;
  const current = currentPage ?? 1;
  if (!total) return null;

  const pages = getPageRange(current, total, 5);
  const go = (page) => {
    if (page < 1 || page > total || page === current) return;
    controlPage?.(page);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => go(current - 1)} disabled={current <= 1} />
        </PaginationItem>
        {pages.map((page, i) => {
          const gap = i > 0 && page - pages[i - 1] > 1;
          return [
            gap ? (
              <PaginationItem key={`gap-${page}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null,
            <PaginationItem key={page}>
              <PaginationLink isActive={page === current} onClick={() => go(page)}>
                {page}
              </PaginationLink>
            </PaginationItem>,
          ];
        })}
        <PaginationItem>
          <PaginationNext onClick={() => go(current + 1)} disabled={current >= total} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default PaginationComponent;
