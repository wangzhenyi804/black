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
    const showPages = 5; // Number of page numbers to show (excluding first, last and ellipsis)

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      const left = Math.max(2, current - 2);
      const right = Math.min(totalPages - 1, current + 2);

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-transparent border-t border-border">
      <div className="flex items-center gap-4 text-xs text-text-muted order-2 sm:order-1 font-medium">
        <p>
          显示 <span className="text-text font-bold">{start}</span> 到 <span className="text-text font-bold">{end}</span> 条，
          共 <span className="text-primary font-bold">{total}</span> 条数据
        </p>
        <div className="flex items-center gap-2">
          <span className="opacity-60">每页</span>
          <div className="w-20">
            <Select
              value={size}
              onChange={(val) => onSizeChange(Number(val))}
              options={sizeOptions.map(opt => ({ value: opt, label: String(opt) }))}
              size="sm"
            />
          </div>
          <span className="opacity-60">条</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 order-1 sm:order-2">
        <nav className="inline-flex gap-1" aria-label="Pagination">
          <button
            onClick={() => onPageChange(Math.max(1, current - 1))}
            disabled={current === 1}
            className="relative inline-flex items-center p-2 text-text-muted bg-black/5 dark:bg-white/5 border border-border rounded-xl hover:bg-black/10 dark:hover:bg-white/10 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-text-muted">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`relative inline-flex items-center min-w-[36px] h-8 justify-center px-2 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 ${
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
            className="relative inline-flex items-center p-2 text-text-muted bg-black/5 dark:bg-white/5 border border-border rounded-xl hover:bg-black/10 dark:hover:bg-white/10 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>

        <form onSubmit={handleJump} className="flex items-center gap-2 ml-2">
          <span className="text-xs text-text-muted font-medium opacity-60">跳至</span>
          <input
            type="text"
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value.replace(/\D/g, ''))}
            className="w-12 h-8 px-1 text-center bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/30 font-bold"
            placeholder="页码"
          />
          <span className="text-xs text-text-muted font-medium opacity-60">页</span>
        </form>
      </div>
    </div>
  );
}
