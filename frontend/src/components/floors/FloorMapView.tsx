import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from "react";
import axios from "axios";
import { fetchFloorPlan, uploadFloorPlan } from "../../api/floorPlanApi";
import {
  createMarker,
  createMarkerType,
  deleteMarker,
  deleteMarkerType,
  fetchMarkers,
  fetchMarkerTypes,
  updateMarker,
  updateMarkerType,
} from "../../api/markerApi";
import { extractApiErrorMessage } from "../../api/client";
import { formatPoints, parsePoints, toSvgPoints } from "../../utils/polygon";
import type { Point } from "../../utils/polygon";
import type {
  FloorPlanResponse,
  PlanMarkerResponse,
  PlanMarkerTypeRequest,
  PlanMarkerTypeResponse,
} from "../../types/floorPlan";
import type { FloorResponse } from "../../types/floor";
import { MarkerTypeFormModal } from "./MarkerTypeFormModal";

interface FloorMapViewProps {
  floor: FloorResponse;
  isAdmin: boolean;
  canEdit: boolean; // ADMIN или ENGINEER — можно ставить/редактировать маркеры и типы
}

export function FloorMapView({ floor, isAdmin, canEdit }: FloorMapViewProps) {
  const floorId = floor.id;

  const [plan, setPlan] = useState<FloorPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [markerTypes, setMarkerTypes] = useState<PlanMarkerTypeResponse[]>([]);
  const [markers, setMarkers] = useState<PlanMarkerResponse[]>([]);

  // Режим расстановки: выбранный тип маркера. Пока он не null — клики по
  // плану добавляют точку/вершину этого типа.
  const [activeTypeId, setActiveTypeId] = useState<number | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [isSavingMarker, setIsSavingMarker] = useState(false);

  // Видимость маркеров на плане. По умолчанию всё СКРЫТО — иначе при
  // большом числе маркеров разных типов план превращается в россыпь точек,
  // на которой ничего не разобрать. Пользователь сам включает нужные типы.
  const [visibleTypeIds, setVisibleTypeIds] = useState<Set<number>>(new Set());

  // Выбранный (для просмотра/редактирования подписи) существующий маркер
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  // Модалка создания/редактирования типа маркера
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<PlanMarkerTypeResponse | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      const planData = await fetchFloorPlan(floorId);
      setPlan(planData);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      if (status !== 404) {
        console.error("Не удалось загрузить план этажа:", err);
        setActionError(extractApiErrorMessage(err, "Не удалось загрузить план этажа"));
      }
      setPlan(null);
    }

    try {
      const markersData = await fetchMarkers(floorId);
      setMarkers(markersData);
    } catch (err) {
      console.error("Не удалось загрузить маркеры этажа:", err);
      setMarkers([]);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    setActiveTypeId(null);
    setDrawingPoints([]);
    setSelectedMarkerId(null);
    setActionError(null);
    setVisibleTypeIds(new Set());
    reload().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  // Типы маркеров общие для всех этажей — грузим один раз
  useEffect(() => {
    fetchMarkerTypes().then(setMarkerTypes).catch(() => setMarkerTypes([]));
  }, []);

  const activeType = useMemo(
    () => markerTypes.find((t) => t.id === activeTypeId) ?? null,
    [markerTypes, activeTypeId],
  );
  const selectedMarker = useMemo(
    () => markers.find((m) => m.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId],
  );

  // Тип, который сейчас расставляется, обязан быть виден — иначе не видно,
  // куда уже поставлены точки этого же типа.
  const effectiveVisibleTypeIds = useMemo(() => {
    if (activeTypeId === null) return visibleTypeIds;
    const next = new Set(visibleTypeIds);
    next.add(activeTypeId);
    return next;
  }, [visibleTypeIds, activeTypeId]);

  const visibleMarkers = useMemo(
    () => markers.filter((m) => effectiveVisibleTypeIds.has(m.markerTypeId)),
    [markers, effectiveVisibleTypeIds],
  );

  function toggleVisibleType(id: number) {
    setVisibleTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleUploadFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setActionError(null);
    try {
      await uploadFloorPlan(floorId, file);
      await reload();
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Не удалось загрузить план"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function svgPointFromEvent(e: ReactMouseEvent<SVGSVGElement>): Point | null {
    if (!svgRef.current || !plan?.originalWidth || !plan?.originalHeight) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * plan.originalWidth;
    const y = ((e.clientY - rect.top) / rect.height) * plan.originalHeight;
    return [x, y];
  }

  function handleSvgClick(e: ReactMouseEvent<SVGSVGElement>) {
    if (!canEdit || !activeType) return;
    const point = svgPointFromEvent(e);
    if (!point) return;

    if (activeType.kind === "POINT") {
      void placePointMarker(activeType.id, point);
    } else {
      setDrawingPoints((prev) => [...prev, point]);
    }
  }

  async function placePointMarker(markerTypeId: number, point: Point) {
    setIsSavingMarker(true);
    setActionError(null);
    try {
      const created = await createMarker(floorId, {
        markerTypeId,
        points: formatPoints([point]),
        label: null,
      });
      setMarkers((prev) => [...prev, created]);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Не удалось создать маркер"));
    } finally {
      setIsSavingMarker(false);
    }
  }

  async function finishLineMarker() {
    if (!activeType || drawingPoints.length < 2) return;
    setIsSavingMarker(true);
    setActionError(null);
    try {
      const created = await createMarker(floorId, {
        markerTypeId: activeType.id,
        points: formatPoints(drawingPoints),
        label: null,
      });
      setMarkers((prev) => [...prev, created]);
      setDrawingPoints([]);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Не удалось сохранить маркер"));
    } finally {
      setIsSavingMarker(false);
    }
  }

  function toggleActiveType(id: number) {
    if (activeTypeId === id) {
      setActiveTypeId(null);
      setDrawingPoints([]);
    } else {
      setActiveTypeId(id);
      setDrawingPoints([]);
      setSelectedMarkerId(null);
      // Включаем видимость типа насовсем, чтобы после выхода из режима
      // расстановки только что поставленные точки не пропали с плана.
      setVisibleTypeIds((prev) => new Set(prev).add(id));
    }
  }

  function handleMarkerClick(e: ReactMouseEvent, marker: PlanMarkerResponse) {
    e.stopPropagation();
    if (activeTypeId !== null) return; // в режиме расстановки клики по меткам не выбирают их
    setSelectedMarkerId(marker.id);
    setEditLabel(marker.label ?? "");
  }

  async function handleSaveLabel() {
    if (!selectedMarker) return;
    setIsSavingLabel(true);
    setActionError(null);
    try {
      const updated = await updateMarker(selectedMarker.id, {
        markerTypeId: selectedMarker.markerTypeId,
        points: selectedMarker.points,
        label: editLabel.trim() || null,
      });
      setMarkers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Не удалось сохранить подпись"));
    } finally {
      setIsSavingLabel(false);
    }
  }

  async function handleDeleteMarker(id: number) {
    if (!window.confirm("Удалить маркер с плана?")) return;
    try {
      await deleteMarker(id);
      setMarkers((prev) => prev.filter((m) => m.id !== id));
      if (selectedMarkerId === id) setSelectedMarkerId(null);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Не удалось удалить маркер"));
    }
  }

  async function handleTypeSubmit(payload: PlanMarkerTypeRequest) {
    if (editingType) {
      const updated = await updateMarkerType(editingType.id, payload);
      setMarkerTypes((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setMarkers((prev) =>
        prev.map((m) =>
          m.markerTypeId === updated.id
            ? { ...m, markerTypeName: updated.name, markerTypeColor: updated.color, kind: updated.kind }
            : m,
        ),
      );
    } else {
      const created = await createMarkerType(payload);
      setMarkerTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  async function handleDeleteType(type: PlanMarkerTypeResponse) {
    if (
      !window.confirm(`Удалить тип «${type.name}»? Все маркеры этого типа на всех этажах будут удалены.`)
    ) {
      return;
    }
    try {
      await deleteMarkerType(type.id);
      setMarkerTypes((prev) => prev.filter((t) => t.id !== type.id));
      setMarkers((prev) => prev.filter((m) => m.markerTypeId !== type.id));
      setVisibleTypeIds((prev) => {
        const next = new Set(prev);
        next.delete(type.id);
        return next;
      });
      if (activeTypeId === type.id) setActiveTypeId(null);
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить тип маркера"));
    }
  }

  if (isLoading) {
    return <div className="text-sm text-ink-faint">Загрузка плана…</div>;
  }

  const hasPlan = Boolean(plan?.imageUrl);

  const instructions = !hasPlan
    ? "План этажа ещё не загружен"
    : activeType
      ? activeType.kind === "POINT"
        ? `Кликайте по плану — каждый клик добавит «${activeType.name}»`
        : `Кликайте по плану, чтобы задать маршрут «${activeType.name}» — минимум 2 точки`
      : "Включите нужные типы в «Показать на плане», затем кликните по метке для подробностей";

  return (
    <div className="flex flex-1 gap-4">
      {/* ── Левая панель: план ── */}
      <div className="flex flex-1 flex-col rounded-lg border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {floor.name || `Этаж ${floor.number}`}
            </h2>
            <p className="text-xs text-ink-faint">{instructions}</p>
          </div>

          {isAdmin && (
            <label className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong">
              {isUploading ? "Загрузка…" : hasPlan ? "Заменить план" : "Загрузить план"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleUploadFile}
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        {actionError && (
          <div className="mb-3 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {actionError}
          </div>
        )}

        {/* Палитра типов для РАССТАНОВКИ — только у тех, кто может редактировать.
            Выбор здесь одновременно включает и видимость этого типа (см.
            toggleActiveType), а видимостью остальных типов управляет блок
            "Показать на плане" в правой панели. */}
        {hasPlan && canEdit && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {markerTypes.map((t) => {
              const isActive = activeTypeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleActiveType(t.id)}
                  title={t.kind === "POINT" ? "Точка" : "Линия"}
                  className={[
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    isActive ? "border-transparent text-white" : "border-line text-ink-soft hover:border-line-strong",
                  ].join(" ")}
                  style={isActive ? { background: t.color } : undefined}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: isActive ? "white" : t.color }}
                  />
                  {t.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setEditingType(null);
                setIsTypeModalOpen(true);
              }}
              className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-ink-faint hover:border-brand hover:text-brand"
            >
              + Тип
            </button>
          </div>
        )}

        {!hasPlan && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-line-strong py-16 text-center">
            <div className="tag-mono text-xs uppercase tracking-[0.15em] text-ink-faint">Нет плана</div>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">
              {isAdmin
                ? "Загрузите изображение плана этажа, чтобы расставлять на нём маркеры."
                : "Обратитесь к администратору, чтобы загрузить план этого этажа."}
            </p>
          </div>
        )}

        {hasPlan && plan && (
          <>
            <div className="relative w-full overflow-hidden rounded-md border border-line bg-canvas">
              <img
                src={plan.imageUrl!}
                alt={`План этажа ${plan.floorNumber}`}
                className="block w-full select-none"
                draggable={false}
              />
              <svg
                ref={svgRef}
                viewBox={`0 0 ${plan.originalWidth} ${plan.originalHeight}`}
                className={`absolute inset-0 h-full w-full ${activeType ? "cursor-crosshair" : ""}`}
                onClick={handleSvgClick}
              >
                {/* Только видимые маркеры — остальные скрыты, чтобы план не
                    превращался в нечитаемую россыпь точек. */}
                {visibleMarkers.map((m) => {
                  const pts = parsePoints(m.points);
                  if (pts.length === 0) return null;
                  const isSelected = m.id === selectedMarkerId;

                  if (m.kind === "POINT") {
                    const [x, y] = pts[0];
                    const r = Math.max((plan.originalWidth ?? 800) * 0.007, 6);
                    return (
                      <g
                        key={m.id}
                        onClick={(e) => handleMarkerClick(e, m)}
                        className={activeTypeId === null ? "cursor-pointer" : ""}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? r * 1.4 : r}
                          fill={m.markerTypeColor}
                          stroke="white"
                          strokeWidth={isSelected ? 3 : 2}
                        />
                        {m.label && (
                          <text
                            x={x}
                            y={y - r - 5}
                            textAnchor="middle"
                            fontSize={Math.max((plan.originalWidth ?? 800) * 0.011, 10)}
                            fontFamily="IBM Plex Mono, monospace"
                            fill="var(--color-ink)"
                            className="pointer-events-none select-none"
                          >
                            {m.label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  // LINE
                  return (
                    <g
                      key={m.id}
                      onClick={(e) => handleMarkerClick(e, m)}
                      className={activeTypeId === null ? "cursor-pointer" : ""}
                    >
                      <polyline
                        points={toSvgPoints(m.points)}
                        fill="none"
                        stroke={m.markerTypeColor}
                        strokeWidth={isSelected ? 4 : 2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {pts.map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r={3} fill={m.markerTypeColor} stroke="white" strokeWidth={1} />
                      ))}
                    </g>
                  );
                })}

                {/* Маркер в процессе расстановки (линия) */}
                {drawingPoints.length > 0 && activeType && (
                  <>
                    <polyline
                      points={drawingPoints.map(([x, y]) => `${x},${y}`).join(" ")}
                      fill="none"
                      stroke={activeType.color}
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                    />
                    {drawingPoints.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r={5} fill={activeType.color} stroke="white" strokeWidth={1.5} />
                    ))}
                  </>
                )}
              </svg>
            </div>

            {/* Панель управления расстановкой линии */}
            {activeType?.kind === "LINE" && (
              <div
                className="mt-3 rounded-md border px-4 py-3"
                style={{ borderColor: activeType.color, background: `${activeType.color}14` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: activeType.color }}>
                      Разметка: {activeType.name}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-soft">
                      {drawingPoints.length < 2
                        ? `Кликайте по плану — нужно минимум 2 точки (сейчас: ${drawingPoints.length})`
                        : `${drawingPoints.length} точек · можно сохранить`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {drawingPoints.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDrawingPoints((prev) => prev.slice(0, -1))}
                        className="rounded border border-line px-2.5 py-1 text-xs text-ink-soft hover:bg-white"
                      >
                        ← Отменить точку
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDrawingPoints([])}
                      className="rounded border border-line px-2.5 py-1 text-xs text-ink-soft hover:bg-white"
                    >
                      Очистить
                    </button>
                    <button
                      type="button"
                      onClick={finishLineMarker}
                      disabled={drawingPoints.length < 2 || isSavingMarker}
                      className="rounded px-2.5 py-1 text-xs text-white disabled:opacity-50"
                      style={{ background: activeType.color }}
                    >
                      {isSavingMarker ? "Сохранение…" : "✓ Сохранить маршрут"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Правая панель ── */}
      <div className="w-80 shrink-0 rounded-lg border border-line bg-surface p-4">
        {selectedMarker ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: selectedMarker.markerTypeColor }} />
              <div>
                <div className="text-sm font-semibold text-ink">{selectedMarker.markerTypeName}</div>
                <div className="tag-mono text-[10px] uppercase text-ink-faint">
                  {selectedMarker.kind === "POINT" ? "Точка" : "Линия"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                Подпись
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Например: розетка у окна"
                disabled={!canEdit}
                className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:bg-neutral-soft"
              />
            </div>

            {canEdit && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveLabel}
                  disabled={isSavingLabel}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-60"
                >
                  {isSavingLabel ? "Сохранение…" : "Сохранить"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMarker(selectedMarker.id)}
                  className="rounded-md border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger-soft"
                >
                  Удалить
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedMarkerId(null)}
              className="mt-4 text-xs text-ink-faint hover:text-ink"
            >
              ← Все маркеры
            </button>
          </div>
        ) : (
          <>
            {/* Видимость маркеров на плане — по умолчанию всё скрыто */}
            <div className="mb-4 border-b border-line pb-4">
              <div className="flex items-center justify-between">
                <h3 className="tag-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Показать на плане
                </h3>
                {markerTypes.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleTypeIds(new Set(markerTypes.map((t) => t.id)))}
                      className="text-[10px] text-brand hover:text-brand-strong"
                    >
                      Все
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleTypeIds(new Set())}
                      className="text-[10px] text-ink-faint hover:text-ink"
                    >
                      Скрыть
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {markerTypes.map((t) => {
                  const isVisible = effectiveVisibleTypeIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleVisibleType(t.id)}
                      className={[
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        isVisible ? "border-transparent text-white" : "border-line text-ink-soft hover:border-line-strong",
                      ].join(" ")}
                      style={isVisible ? { background: t.color } : undefined}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: isVisible ? "white" : t.color }}
                      />
                      {t.name}
                    </button>
                  );
                })}
                {markerTypes.length === 0 && (
                  <p className="text-xs text-ink-faint">Типов ещё нет</p>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-ink">Маркеры на плане ({markers.length})</h3>
            {markers.length === 0 && (
              <p className="mt-2 text-xs text-ink-faint">
                {canEdit
                  ? "Выберите тип выше и кликните по плану, чтобы добавить маркер."
                  : "На этом плане пока нет маркеров."}
              </p>
            )}
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {markers.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMarkerId(m.id);
                      setEditLabel(m.label ?? "");
                      // Открывая маркер из списка, автоматически показываем
                      // его тип на плане — иначе выделение было бы не видно.
                      setVisibleTypeIds((prev) => new Set(prev).add(m.markerTypeId));
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-ink-soft hover:bg-neutral-soft"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.markerTypeColor }} />
                    <span className="flex-1 truncate">{m.label || m.markerTypeName}</span>
                    <span className="tag-mono text-[10px] text-ink-faint">
                      {m.kind === "POINT" ? "•" : "╱"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <h3 className="tag-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Типы маркеров
                </h3>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingType(null);
                      setIsTypeModalOpen(true);
                    }}
                    className="text-[11px] text-brand hover:text-brand-strong"
                  >
                    + Новый
                  </button>
                )}
              </div>
              <ul className="mt-2 space-y-1">
                {markerTypes.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-center justify-between rounded px-1 py-1 text-xs text-ink-soft hover:bg-neutral-soft"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
                      <span className="truncate">{t.name}</span>
                    </span>
                    {canEdit && (
                      <span className="hidden shrink-0 gap-2 group-hover:flex">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingType(t);
                            setIsTypeModalOpen(true);
                          }}
                          className="text-[10px] text-ink-faint hover:text-brand"
                        >
                          изм.
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteType(t)}
                            className="text-[10px] text-ink-faint hover:text-danger"
                          >
                            удал.
                          </button>
                        )}
                      </span>
                    )}
                  </li>
                ))}
                {markerTypes.length === 0 && (
                  <li className="py-2 text-center text-ink-faint">Типов ещё нет</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      {isTypeModalOpen && (
        <MarkerTypeFormModal
          markerType={editingType}
          onClose={() => setIsTypeModalOpen(false)}
          onSubmit={handleTypeSubmit}
        />
      )}
    </div>
  );
}