import React from 'react';
import '../../styles/Pagination.css';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 5;

  const getPageNumbers = () => {
    let pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage <= 3) {
      pages = [1, 2, 3, 4, '...', totalPages];
    } else if (currentPage >= totalPages - 2) {
      pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [
        1,
        '...',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        '...',
        totalPages,
      ];
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination-container" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`pagination-button nav-button ${currentPage === 1 ? 'disabled' : ''}`}
      >
        <span className="pagination-nav-icon">←</span>
        <span>Previous</span>
      </button>

      <div className="pagination-pages">
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`pagination-button ${page === currentPage ? 'active' : ''}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="pagination-ellipsis" aria-hidden="true">
              {page}
            </span>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`pagination-button nav-button ${currentPage === totalPages ? 'disabled' : ''}`}
      >
        <span>Next</span>
        <span className="pagination-nav-icon">→</span>
      </button>
      
      <div className="pagination-info">
        <span className="pagination-info-label">Page</span>
        <strong>{currentPage}</strong>
        <span className="pagination-info-divider">/</span>
        <span>{totalPages}</span>
      </div>
    </nav>
  );
};

export default Pagination;
