import { useEffect, useState } from "react";
import { Modal } from "../shared/Modal";
import { fetchEquipmentGroup } from "../../api/equipmentApi";
import { EQUIPMENT_TYPE_LABELS } from "../../types/equipment";
import type { EquipmentResponse } from "../../types/equipment";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";

interface EquipmentGroupViewModalProps {
  inventoryNumber: string;
  onClose: () => void;
  onEditItem: (item: EquipmentResponse) => void;
}

export function EquipmentGroupViewModal({
  inventoryNumber,
  onClose,
  onEditItem,
}: EquipmentGroupViewModalProps) {
  const [items, setItems] = useState<EquipmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchEquipmentGroup(inventoryNumber)
      .then(setItems)
      .catch(() => setError("Не удалось загрузить комплект"))
      .finally(() => setIsLoading(false));
  }, [inventoryNumber]);

  return (
    <Modal title={`Комплект: ${inventoryNumber}`} onClose={onClose} widthClassName="max-w-lg">
      {isLoading && <div className="py-6 text-center text-sm text-ink-faint">Загрузка…</div>}
      {error && (
        <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      {!isLoading && !error && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
            >
              <div>
                <div className="text-sm text-ink">{EQUIPMENT_TYPE_LABELS[item.type]}</div>
                <div className="text-xs text-ink-faint">
                  {item.roomNumber ? `каб. ${item.roomNumber}` : "без кабинета"}
                  {item.responsibleEmployeeName ? ` · ${item.responsibleEmployeeName}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EquipmentStatusBadge status={item.status} />
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="text-xs text-ink-faint hover:text-brand"
                >
                  Изменить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}