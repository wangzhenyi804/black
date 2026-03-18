import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
}

export default function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = '请选择', 
  className = '', 
  required = false,
  size = 'md' 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Loose comparison to handle number/string mismatches (e.g. "1" == 1)
  const selectedOption = options.find(opt => opt.value == value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm' 
    ? 'px-3 py-2 text-base lg:text-xs' 
    : 'px-4 py-3 text-base lg:text-sm';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontSize: '16px' }} // Inline style to override and ensure 16px on mobile
        className={`w-full flex items-center justify-between bg-black/5 dark:bg-white/5 border border-border rounded-xl ${sizeClasses} lg:!text-inherit transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
          isOpen ? 'ring-2 ring-primary/20 border-primary' : ''
        }`}
      >
        <span className={selectedOption ? 'text-text' : 'text-text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="p-1 space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  value === option.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} className="text-primary" />}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-text-muted">
                暂无选项
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden input for form submission if needed */}
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
