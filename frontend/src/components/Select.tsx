import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  size?: 'sm' | 'md';
  position?: 'top' | 'bottom' | 'auto'; // 增加 auto
}

export default function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = '请选择', 
  className = '', 
  required = false,
  size = 'md',
  position = 'auto'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number; bottom: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Loose comparison to handle number/string mismatches (e.g. "1" == 1)
  const selectedOption = options.find(opt => 
    opt.value !== undefined && opt.value !== null && value !== undefined && value !== null && 
    String(opt.value) === String(value)
  );

  useEffect(() => {
    if (isOpen) {
      console.log('[Select] Opened. Current value:', value, 'Selected option:', selectedOption);
    }
  }, [isOpen, value, selectedOption]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // 检查点击是否在触发器或下拉菜单内部
      const isInsideTrigger = dropdownRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);
      
      if (!isInsideTrigger && !isInsideMenu) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 计算位置
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          bottom: rect.bottom
        });
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    console.log('[Select] Selecting value:', val);
    onChange(val);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm' 
    ? 'px-3 py-2 text-xs lg:text-xs' 
    : 'px-4 py-3 text-sm lg:text-sm';

  // 决定菜单渲染方向
  const renderPosition = () => {
    if (position !== 'auto') return position;
    if (!dropdownRect) return 'bottom';
    // 如果下方空间不足 250px 且上方空间更大，则向上弹出
    const spaceBelow = window.innerHeight - dropdownRect.bottom;
    return spaceBelow < 250 && dropdownRect.top > spaceBelow ? 'top' : 'bottom';
  };

  const actualPosition = renderPosition();

  const dropdownMenu = isOpen && dropdownRect && (
    <div 
      ref={menuRef}
      className="fixed z-[10000] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{
        width: dropdownRect.width,
        left: dropdownRect.left,
        ...(actualPosition === 'top' 
          ? { bottom: window.innerHeight - dropdownRect.top + 8 } 
          : { top: dropdownRect.bottom + 8 }
        )
      }}
    >
      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
              String(value) === String(option.value)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text'
            }`}
          >
            <span>{option.label}</span>
            {String(value) === String(option.value) && <Check size={14} className="text-primary" />}
          </button>
        ))}
        {options.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-text-muted">
            暂无选项
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-black/5 dark:bg-white/5 border border-border rounded-xl ${sizeClasses} transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
          isOpen ? 'ring-2 ring-primary/20 border-primary' : ''
        }`}
      >
        <span className={selectedOption ? 'text-text' : 'text-text-muted truncate mr-2'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && createPortal(dropdownMenu, document.body)}
      
      {required && (
        <input 
          type="text" 
          className="sr-only" 
          value={value} 
          required 
          onChange={() => {}} 
          tabIndex={-1}
        />
      )}
    </div>
  );
}
