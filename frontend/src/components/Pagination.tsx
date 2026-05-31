import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Навигация по страницам"
    >
      {/* Previous */}
      <button
        id="pagination-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          text-gray-400 hover:text-primary-300 hover:bg-primary-500/10
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-200"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Назад</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-3 py-2 text-sm text-gray-500"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              id={`pagination-page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  page === currentPage
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-400 hover:text-primary-300 hover:bg-primary-500/10'
                }`}
              aria-label={`Страница ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        id="pagination-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          text-gray-400 hover:text-primary-300 hover:bg-primary-500/10
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-200"
        aria-label="Следующая страница"
      >
        <span className="hidden sm:inline">Далее</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default Pagination;
