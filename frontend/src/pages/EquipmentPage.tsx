import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";

import { EquipmentFilterBar } from "../components/equipment/EquipmentFilterBar";
import { EquipmentFormModal } from "../components/equipment/EquipmentFormModal";
import { EquipmentGroupFormModal } from "../components/equipment/EquipmentGroupFormModal";
import { EquipmentGroupViewModal } from "../components/equipment/EquipmentGroupViewModal";

import EquipmentCategoryList from "../components/inventory/EquipmentCategoryList";
import EquipmentToolbar from "../components/inventory/EquipmentToolbar";
import EquipmentStats from "../components/inventory/EquipmentStats";

import { useAuth } from "../context/AuthContext";

import {
  createEquipment,
  createEquipmentBatch,
  deleteEquipment,
  fetchEquipmentPage,
  updateEquipment,
  updateEquipmentStatus,
} from "../api/equipmentApi";

import type { EquipmentFilters } from "../api/equipmentApi";

import { fetchAllRooms } from "../api/roomApi";
import { fetchAllActiveEmployees } from "../api/employeeApi";
import { extractApiErrorMessage } from "../api/client";

import {
  COMPUTER_TYPES,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_GROUPS,
  EQUIPMENT_TYPE_LABELS,
  NETWORK_TYPES,
} from "../types/equipment";

import type {
  EquipmentBatchRequest,
  EquipmentRequest,
  EquipmentResponse,
  EquipmentStatus,
  EquipmentType,
} from "../types/equipment";

import type { RoomResponse } from "../types/room";
import type { EmployeeResponse } from "../types/employee";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = Object.keys(
  EQUIPMENT_STATUS_LABELS,
) as EquipmentStatus[];

function specSummary(item: EquipmentResponse): string {
  if (COMPUTER_TYPES.includes(item.type)) {
    const parts: string[] = [];

    if (item.cpu) {
      parts.push(item.cpu);
    }

    if (item.ramGb) {
      parts.push(`${item.ramGb} ГБ`);
    }

    if (item.storage) {
      parts.push(item.storage);
    }

    if (item.gpu) {
      parts.push(item.gpu);
    }

    if (item.os) {
      parts.push(item.os);
    }

    return parts.join(" · ") || "—";
  }

  if (
    item.type === "MONITOR" ||
    item.type === "PROJECTOR"
  ) {
    const parts: string[] = [];

    if (item.diagonalInch) {
      parts.push(`${item.diagonalInch}"`);
    }

    if (item.resolution) {
      parts.push(item.resolution);
    }

    if (item.panelType) {
      parts.push(item.panelType);
    }

    if (item.connectors) {
      parts.push(item.connectors);
    }

    return parts.join(" · ") || "—";
  }

  if (
    item.type === "PRINTER" ||
    item.type === "MFP"
  ) {
    const parts: string[] = [];

    if (item.printFormat) {
      parts.push(item.printFormat);
    }

    if (item.printSpeedPpm) {
      parts.push(
        `${item.printSpeedPpm} стр/мин`,
      );
    }

    if (item.printColor !== null) {
      parts.push(
        item.printColor
          ? "цветной"
          : "ч/б",
      );
    }

    return parts.join(" · ") || "—";
  }

  if (item.type === "MOUSE") {
    if (item.wireless !== null) {
      return item.wireless
        ? "Беспроводная"
        : "Проводная";
    }

    return "—";
  }

  if (item.type === "KEYBOARD") {
    const parts: string[] = [];

    if (item.switchType) {
      parts.push(item.switchType);
    }

    if (item.wireless !== null) {
      parts.push(
        item.wireless
          ? "Беспроводная"
          : "Проводная",
      );
    }

    return parts.join(" · ") || "—";
  }

  if (
    item.type === "SWITCH" ||
    item.type === "ROUTER" ||
    item.type === "ACCESS_POINT"
  ) {
    const parts: string[] = [];

    if (item.portCount) {
      parts.push(
        `${item.portCount} порт.`,
      );
    }

    if (item.ipAddress) {
      parts.push(item.ipAddress);
    }

    return parts.join(" · ") || "—";
  }

  if (item.type === "UPS") {
    const parts: string[] = [];

    if (item.powerVa) {
      parts.push(`${item.powerVa} ВА`);
    }

    if (item.batteryRuntimeMin) {
      parts.push(
        `${item.batteryRuntimeMin} мин`,
      );
    }

    return parts.join(" · ") || "—";
  }

  if (
    item.type === "PHONE" ||
    item.type === "TABLET" ||
    item.type === "SPEAKERS"
  ) {
    return item.notes || "—";
  }

  return item.notes || "—";
}

function getCategoryForType(
  type: EquipmentType,
): string {
  const group =
    EQUIPMENT_TYPE_GROUPS.find(
      (group) =>
        group.types.includes(type),
    );

  return (
    group?.label ||
    EQUIPMENT_TYPE_LABELS[type] ||
    "Другое"
  );
}

function getEquipmentSearchText(
  item: EquipmentResponse,
): string {
  return [
    item.inventoryNumber,
    EQUIPMENT_TYPE_LABELS[item.type],
    item.roomNumber,
    item.responsibleEmployeeName,
    item.ipAddress,
    item.macAddress,
    item.cpu,
    item.ramGb,
    item.storage,
    item.gpu,
    item.os,
    item.resolution,
    item.panelType,
    item.connectors,
    item.notes,
    EQUIPMENT_STATUS_LABELS[item.status],
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined,
    )
    .join(" ")
    .toLowerCase();
}

export function EquipmentPage() {
  const { user } = useAuth();

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "ENGINEER";

  const isAdmin =
    user?.role === "ADMIN";

  const [searchParams] =
    useSearchParams();

  const [rooms, setRooms] =
    useState<RoomResponse[]>([]);

  const [employees, setEmployees] =
    useState<EmployeeResponse[]>([]);

  const [filters, setFilters] =
    useState<EquipmentFilters>({});

  const [
    debouncedFilters,
    setDebouncedFilters,
  ] = useState<EquipmentFilters>({});

  const [page, setPage] =
    useState(0);

  const [data, setData] =
    useState<
      PageResponse<EquipmentResponse> | null
    >(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [editingItem, setEditingItem] =
    useState<EquipmentResponse | null>(
      null,
    );

  const [isCreating, setIsCreating] =
    useState(false);

  const [
    isCreatingGroup,
    setIsCreatingGroup,
  ] = useState(false);

  const [
    viewingGroupNumber,
    setViewingGroupNumber,
  ] = useState<string | null>(null);

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] = useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("all");

  /*
   * Справочники
   */
  useEffect(() => {
    fetchAllRooms()
      .then(setRooms)
      .catch(() => setRooms([]));

    fetchAllActiveEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  /*
   * roomId из URL
   *
   * Например:
   * /equipment?roomId=5
   */
  useEffect(() => {
    const roomIdParam =
      searchParams.get("roomId");

    if (!roomIdParam) {
      return;
    }

    const roomId =
      Number(roomIdParam);

    if (Number.isNaN(roomId)) {
      return;
    }

    setPage(0);

    setFilters((prev) => ({
      ...prev,
      roomId,
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /*
   * Debounce серверных фильтров
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedFilters(filters);
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [filters]);

  /*
   * Загрузка
   */
  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        await fetchEquipmentPage(
          debouncedFilters,
          page,
          PAGE_SIZE,
        );

      setData(result);
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось загрузить оборудование",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters, page]);

  /*
   * Создание оборудования
   */
  async function handleCreate(
    payload: EquipmentRequest,
  ) {
    try {
      await createEquipment(payload);

      setIsCreating(false);
      setPage(0);

      await load();
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось создать оборудование",
        ),
      );
    }
  }

  /*
   * Создание комплекта
   */
  async function handleCreateGroup(
    payload: EquipmentBatchRequest,
  ) {
    try {
      await createEquipmentBatch(
        payload,
      );

      setIsCreatingGroup(false);
      setPage(0);

      await load();
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось создать комплект",
        ),
      );
    }
  }

  /*
   * Редактирование
   */
  async function handleUpdate(
    payload: EquipmentRequest,
  ) {
    if (!editingItem) {
      return;
    }

    try {
      await updateEquipment(
        editingItem.id,
        payload,
      );

      setEditingItem(null);

      await load();
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось изменить оборудование",
        ),
      );
    }
  }

  /*
   * Удаление
   */
  async function handleDelete(
    item: EquipmentResponse,
  ) {
    const confirmed =
      window.confirm(
        `Удалить оборудование ${item.inventoryNumber}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteEquipment(
        item.id,
      );

      await load();
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось удалить оборудование",
        ),
      );
    }
  }

  /*
   * Изменение статуса
   */
  async function handleStatusChange(
    item: EquipmentResponse,
    status: EquipmentStatus,
  ) {
    if (item.status === status) {
      return;
    }

    setStatusUpdatingId(item.id);

    try {
      await updateEquipmentStatus(
        item.id,
        status,
      );

      await load();
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось изменить статус",
        ),
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  /*
   * Категории.
   *
   * Используем реальные группы,
   * которые уже есть в equipment.ts.
   */
  const categories =
    EQUIPMENT_TYPE_GROUPS.map(
      (group) => group.label,
    );

  /*
   * Локальный поиск.
   *
   * Серверный q-фильтр остаётся
   * внутри EquipmentFilterBar.
   */
  const visibleEquipment =
    data?.content.filter(
      (item) => {
        const category =
          getCategoryForType(
            item.type,
          );

        const matchesCategory =
          activeCategory === "all" ||
          category === activeCategory;

        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          getEquipmentSearchText(
            item,
          ).includes(
            normalizedSearch,
          );

        return (
          matchesCategory &&
          matchesSearch
        );
      },
    ) ?? [];

  /*
   * Статистика.
   */
  const totalEquipment =
    data?.totalElements ?? 0;

  const visibleCount =
    visibleEquipment.length;

  const inUseCount =
    data?.content.filter(
      (item) =>
        item.status === "IN_USE",
    ).length ?? 0;

  const storageCount =
    data?.content.filter(
      (item) =>
        item.status === "STORAGE",
    ).length ?? 0;

  const repairCount =
    data?.content.filter(
      (item) =>
        item.status === "REPAIR",
    ).length ?? 0;

  const statsItems = [
    {
      title: "Всего",
      value: totalEquipment,
    },
    {
      title: "В эксплуатации",
      value: inUseCount,
    },
    {
      title: "На складе",
      value: storageCount,
    },
    {
      title: "В ремонте",
      value: repairCount,
    },
  ];

  /*
   * Компонент EquipmentStats из
   * первоначальной версии может принимать
   * просто items.
   *
   * Если твой EquipmentStats принимает
   * другой интерфейс, его лучше привести
   * к этому формату.
   */
  const equipmentForUi =
    visibleEquipment.map(
      (item) => ({
        ...item,

        /*
         * Дополнительные поля для нового UI.
         *
         * Они не отправляются на backend.
         */
        category:
          getCategoryForType(
            item.type,
          ),

        name:
          EQUIPMENT_TYPE_LABELS[
            item.type
          ],

        model:
          specSummary(item),

        employee:
          item.responsibleEmployeeName,

        location:
          item.roomNumber,

        specification:
          specSummary(item),
      }),
    );

  const filteredRoom =
    filters.roomId
      ? rooms.find(
          (room) =>
            room.id ===
            filters.roomId,
        )
      : null;

  return (
    <AppShell title="Оборудование">
      <div className="space-y-5">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">
              Оборудование
            </h1>

            <p className="mt-1 text-sm text-ink-faint">
              Управление оборудованием и комплектами
            </p>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setIsCreatingGroup(
                    true,
                  )
                }
                title="Завести несколько единиц техники одним инвентарным номером"
                className="rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
              >
                + Комплект
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsCreating(true)
                }
                className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
              >
                + Оборудование
              </button>
            </div>
          )}
        </div>

        {/* ===================================================
            STATS
        ==================================================== */}

        <EquipmentStats
          items={statsItems}
        />

        {/* ===================================================
            SEARCH
        ==================================================== */}

        <EquipmentToolbar
          search={search}
          setSearch={setSearch}
          categories={categories}
          active={activeCategory}
          setActive={setActiveCategory}
        />

        {/* ===================================================
            EXISTING SERVER FILTERS
        ==================================================== */}

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {filteredRoom && (
            <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-soft/40 px-4 py-2 text-xs text-brand-strong">
              <span>
                Показана техника кабинета{" "}
                <strong>
                  {filteredRoom.number}
                </strong>

                {filteredRoom.name
                  ? ` — ${filteredRoom.name}`
                  : ""}
              </span>

              <button
                type="button"
                onClick={() => {
                  setPage(0);

                  setFilters(
                    (prev) => ({
                      ...prev,
                      roomId: null,
                    }),
                  );
                }}
                className="text-brand underline hover:text-brand-strong"
              >
                Показать всё
              </button>
            </div>
          )}

          <EquipmentFilterBar
            filters={filters}
            onChange={(next) => {
              setPage(0);
              setFilters(next);
            }}
            rooms={rooms}
            employees={employees}
          />
        </div>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* ===================================================
            LOADING
        ==================================================== */}

        {isLoading && (
          <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />

            <p className="mt-3 text-sm text-ink-faint">
              Загрузка оборудования…
            </p>
          </div>
        )}

        {/* ===================================================
            LIST
        ==================================================== */}

        {!isLoading &&
          visibleEquipment.length > 0 && (
            <EquipmentCategoryList
              items={
                equipmentForUi
              }
              canEdit={canEdit}
              isAdmin={isAdmin}
              statusUpdatingId={
                statusUpdatingId
              }
              onStatusChange={
                handleStatusChange
              }
              onEdit={
                setEditingItem
              }
              onDelete={
                handleDelete
              }
              onViewGroup={
                setViewingGroupNumber
              }
              specSummary={
                specSummary
              }
            />
          )}

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {!isLoading &&
          visibleEquipment.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-soft text-xl text-ink-faint">
                □
              </div>

              <h3 className="mt-4 text-sm font-semibold text-ink">
                Оборудование не найдено
              </h3>

              <p className="mt-1 text-xs text-ink-faint">
                Попробуйте изменить поиск
                или параметры фильтра.
              </p>

              {(search ||
                activeCategory !==
                  "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(
                      "all",
                    );
                  }}
                  className="mt-4 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:border-brand/40 hover:text-brand"
                >
                  Сбросить поиск
                </button>
              )}
            </div>
          )}

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {data && (
          <div className="rounded-xl border border-line bg-surface">
            <Pagination
              page={data.number}
              totalPages={
                data.totalPages
              }
              totalElements={
                data.totalElements
              }
              onPageChange={
                setPage
              }
            />
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE
      ====================================================== */}

      {isCreating && (
        <EquipmentFormModal
          equipment={null}
          rooms={rooms}
          employees={employees}
          onClose={() =>
            setIsCreating(false)
          }
          onSubmit={handleCreate}
        />
      )}

      {/* =====================================================
          EDIT
      ====================================================== */}

      {editingItem && (
        <EquipmentFormModal
          equipment={
            editingItem
          }
          rooms={rooms}
          employees={employees}
          onClose={() =>
            setEditingItem(null)
          }
          onSubmit={handleUpdate}
        />
      )}

      {/* =====================================================
          CREATE GROUP
      ====================================================== */}

      {isCreatingGroup && (
        <EquipmentGroupFormModal
          rooms={rooms}
          employees={employees}
          onClose={() =>
            setIsCreatingGroup(false)
          }
          onSubmit={
            handleCreateGroup
          }
        />
      )}

      {/* =====================================================
          GROUP VIEW
      ====================================================== */}

      {viewingGroupNumber && (
        <EquipmentGroupViewModal
          inventoryNumber={
            viewingGroupNumber
          }
          onClose={() =>
            setViewingGroupNumber(
              null,
            )
          }
          onEditItem={(item) => {
            setViewingGroupNumber(
              null,
            );

            setEditingItem(item);
          }}
        />
      )}
    </AppShell>
  );
}
