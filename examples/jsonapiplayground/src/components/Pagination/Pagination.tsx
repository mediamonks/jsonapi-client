interface PaginationProps {
  currentPage: number
  pageCount: number
  onPageChange: (value: number) => void
}

export const Pagination = ({ currentPage, pageCount, onPageChange }: PaginationProps) => (
  <nav>
    <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
      Prev
    </button>

    {Array.from({ length: pageCount }).map((_, index) => (
      <button
        key={index}
        type="button"
        disabled={index + 1 === currentPage}
        onClick={() => onPageChange(index + 1)}
      >
        {index + 1}
      </button>
    ))}

    <button
      type="button"
      disabled={currentPage >= pageCount}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Next
    </button>
  </nav>
)
