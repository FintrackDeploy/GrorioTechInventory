import { useEffect, useRef, useState } from "react";
import { searchEquipment } from "../../api/equipmentApi";
import { EQUIPMENT_TYPE_LABELS } from "../../types/equipment";
import type { EquipmentResponse } from "../../types/equipment";

interface EquipmentPickerProps {
  value: EquipmentResponse | null;
  onChange: (equipment: EquipmentResponse) => void;
}

export function EquipmentPicker({ value, onChange }: EquipmentPickerProps) {
  const [query, setQuery] = useState(value?.inventoryNumber ?? "");
  const [results, setResults] = useState<EquipmentResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && query === value.inventoryNumber) return; // синхронизация выбранного значения, не поиск
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const handle = setTimeout(async () => {
      try {
        const items = await searchEquipment(query);
        setResults(items);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSelect(eq: EquipmentResponse) {
    onChange(eq);
    setQuery(eq.inventoryNumber);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Инв. номер, IP, MAC, CPU…"
        className="tag-mono w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
      />
      {isOpen && query.trim() && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-lg">
          {isSearching && <div className="px-3 py-2 text-sm text-ink-faint">Поиск…</div>}
          {!isSearching && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-ink-faint">Ничего не найдено</div>
          )}
          {!isSearching &&
            results.map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => handleSelect(eq)}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-soft"
              >
                <span className="tag-mono text-ink">{eq.inventoryNumber}</span>
                <span className="text-xs text-ink-faint">
                  {EQUIPMENT_TYPE_LABELS[eq.type]}
                  {eq.roomNumber ? ` · каб. ${eq.roomNumber}` : ""}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}