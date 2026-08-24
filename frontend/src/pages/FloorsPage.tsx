import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { FloorList } from "../components/floors/FloorList";
import { FloorFormModal } from "../components/floors/FloorFormModal";
import { FloorMapView } from "../components/floors/FloorMapView";
import { useAuth } from "../context/AuthContext";
import { createFloor, deleteFloor, fetchFloors, updateFloor } from "../api/floorApi";
import { extractApiErrorMessage } from "../api/client";
import type { FloorRequest, FloorResponse } from "../types/floor";

export function FloorsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canEdit = user?.role === "ADMIN" || user?.role === "ENGINEER";

  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingFloor, setEditingFloor] = useState<FloorResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function loadFloors(preserveSelection = true) {
    try {
      const data = await fetchFloors();
      setFloors(data);
      if (!preserveSelection || (selectedId !== null && !data.some((f) => f.id === selectedId))) {
        setSelectedId(data[0]?.id ?? null);
      } else if (selectedId === null && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setLoadError(extractApiErrorMessage(err, "Не удалось загрузить список этажей"));
    }
  }

  useEffect(() => {
    setIsLoading(true);
    loadFloors(false).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(payload: FloorRequest) {
    const created = await createFloor(payload);
    await loadFloors();
    setSelectedId(created.id);
  }

  async function handleUpdate(payload: FloorRequest) {
    if (!editingFloor) return;
    await updateFloor(editingFloor.id, payload);
    await loadFloors();
  }

  async function handleDelete(floor: FloorResponse) {
    if (
      !window.confirm(
        `Удалить этаж №${floor.number}${floor.name ? ` (${floor.name})` : ""}? Все кабинеты этажа тоже будут удалены.`,
      )
    ) {
      return;
    }
    try {
      await deleteFloor(floor.id);
      await loadFloors(false);
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить этаж"));
    }
  }

  const selectedFloor = floors.find((f) => f.id === selectedId) ?? null;

  return (
    <AppShell title="Этажи и планы">
      {isLoading ? (
        <div className="text-sm text-ink-faint">Загрузка…</div>
      ) : loadError ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {loadError}
        </div>
      ) : (
        <div className="flex gap-4">
          <FloorList
            floors={floors}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isAdmin={isAdmin}
            onCreate={() => setIsCreating(true)}
            onEdit={setEditingFloor}
            onDelete={handleDelete}
          />

          {selectedFloor ? (
            <FloorMapView floor={selectedFloor} isAdmin={isAdmin} canEdit={canEdit} />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line-strong text-sm text-ink-faint">
              {isAdmin ? "Добавьте первый этаж, чтобы начать" : "Этажей пока нет"}
            </div>
          )}
        </div>
      )}

      {isCreating && (
        <FloorFormModal
          floor={null}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingFloor && (
        <FloorFormModal
          floor={editingFloor}
          onClose={() => setEditingFloor(null)}
          onSubmit={handleUpdate}
        />
      )}
    </AppShell>
  );
}