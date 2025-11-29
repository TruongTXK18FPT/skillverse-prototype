import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './uplink-styles.css';

interface HoloPaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const HoloPagination: React.FC<HoloPaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Don't render if only one page
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and adjacent pages
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push(-1); // -1 represents ellipsis

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push(-1); // ellipsis

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="holo-pagination">
      {/* Background Node Line */}
      <div className="holo-node-line"></div>

      <div className="holo-pagination-content">
        {/* Previous Button */}
        <button
          className="holo-nav-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Page Hexagons */}
        <div className="holo-page-nodes">
          {pageNumbers.map((page, index) => {
            if (page === -1) {
              // Ellipsis
              return (
                <span key={`ellipsis-${index}`} className="holo-ellipsis">
                  ⬢⬢⬢
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                className={`holo-page-node ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="holo-page-number">{page}</span>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          className="holo-nav-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default HoloPagination;