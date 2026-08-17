'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val === value ? '' : val);
      setSearch('');
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onChange, value]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setSearch('');
      inputRef.current?.focus();
    },
    [onChange]
  );

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(-1);
  }, [search]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[activeIndex]) {
      (items[activeIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          handleSelect(filtered[activeIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-center w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow cursor-pointer"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedOption?.label ?? ''}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? searchPlaceholder : placeholder}
          readOnly={!isOpen}
          className="flex-1 bg-transparent text-sm outline-none placeholder-gray-500 min-w-0"
          role="combobox"
          aria-controls="listbox-options"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 p-0.5 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            aria-label="Hapus pilihan"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-500 select-none">
              Tidak ditemukan
            </li>
          ) : (
            filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt.value);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : isSelected
                        ? 'text-indigo-400 bg-indigo-600/10'
                        : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
