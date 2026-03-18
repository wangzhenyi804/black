import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Select from './Select';

interface PaginationProps {
  current: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  sizeOptions?: number[];
}

export default function Pagination({
  current,
  size,
  total,
  onPageChange,
  onSizeChange,
  sizeOptions = [10, 20, 30, 50]
}: PaginationProps) {
  const totalPages = Math.ceil(total / size);
  const start = total === 0 ? 0 : (current - 1) * size + 1;
  const end = Math.min(current * size, total);
  
  const [jumpTo, setJumpTo] = useState('');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpTo);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpTo('');
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const showPages = isMobile ? 3 : 5; // Fewer pages on mobile

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      const buffer = isMobile ? 1 : 2;
      const left = Math.max(2, current - buffer);
      const right = Math.min(totalPages - 1, current + buffer);

      if (left > 2) {
        pages.push('...');
      }

      for (let i = left; i <= right; i++) {
        pages.push(i);
      }

      if (right < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 py-3 sm:px-4 sm:py-4 bg-transparent border-t border-border">
      {/* Stats and Page Size - More compact on mobile */}
      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-text-muted order-2 sm:order-1 font-medium w-full sm:w-auto justify-between sm:justify-start border-t border-border/5 pt-3 sm:pt-0 sm:border-t-0">
        <p className="whitespace-nowrap">
          <span className="hidden xs:inline">显示</span> <span className="text-text font-bold">{start}-{end}</span>
          <span className="hidden xs:inline"> / 共 <span className="text-primary font-bold">{total}</span> 条</span>
          <span className="xs:hidden"> / {total}</span>
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="opacity-60 hidden sm:inline">每页</span>
          <div className="w-14 sm:w-20">
            <Select
              value={size}
              onChange={(val) => onSizeChange(Number(val))}
              options={sizeOptions.map(opt => ({ value: opt, label: String(opt) }))}
              size="sm"
            />
          </div>
          <span className="opacity-60 hidden sm:inline">条</span>
        </div>
      </div>

      {/* Navigation and Jump - More compact on mobile */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto">
        <nav className="inline-flex gap-1" aria-label="Pagination">
          <button
            onClick={() => onPageChange(Math.max(1, current - 1))}
            disabled={current === 1}
            className="relative inline-flex items-center p-1.5 sm:p-2 text-text-muted bg-black/5 dark:bg-white/5 border border-border rounded-lg sm:rounded-xl hover:bg-black/10 dark:hover:bg-white/10 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="relative inline-flex items-center px-1.5 sm:px-3 py-1 sm:py-2 text-xs font-medium text-text-muted">
                    <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`relative inline-flex items-center min-w-[28px] sm:min-w-[36px] h-7 sm:h-8 justify-center px-1.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all active:scale-95 ${
                      current === page
                        ? 'z-10 bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-black/5 dark:bg-white/5 border border-border text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text hover:border-primary/30'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, current + 1))}
            disabled={current === totalPages || totalPages === 0}
            className="relative inline-flex items-center p-1.5 sm:p-2 text-text-muted bg-black/5 dark:bg-white/5 border border-border rounded-lg sm:rounded-xl hover:bg-black/10 dark:hover:bg-white/10 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </nav>

        {/* Jump input hidden on very small screens or simplified */}
        <form onSubmit={handleJump} className="hidden xs:flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2">
          <span className="text-[10px] sm:text-xs text-text-muted font-medium opacity-60 hidden sm:inline">跳至</span>
          <input
            type="text"
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value.replace(/\D/g, ''))}
            className="w-10 sm:w-12 h-7 sm:h-8 px-1 text-center bg-black/5 dark:bg-white/5 border border-border rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/30 font-bold"
            placeholder="页"
          />
          <span className="text-[10px] sm:text-xs text-text-muted font-medium opacity-60 hidden sm:inline">页</span>
        </form>
      </div>
    </div>
  );
}
