package by.GroiroTechInventory.dto.equipment;

import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record EquipmentResponse(
        Long id,
        String inventoryNumber,
        EquipmentType type,
        EquipmentStatus status,
        Long roomId,
        String roomNumber,
        Long responsibleEmployeeId,
        String responsibleEmployeeName,
        LocalDate purchaseDate,
        String ipAddress,
        String macAddress,
        String notes,

        // ── ПК / Ноутбук ──────────────────────────────────
        String cpu,
        Integer ramGb,
        String storage,
        String gpu,
        String os,
        String formFactor,

        // ── Монитор / Проектор ────────────────────────────
        BigDecimal diagonalInch,
        String resolution,
        String panelType,
        String connectors,

        // ── Принтер / МФУ ────────────────────────────────
        Integer printSpeedPpm,
        Boolean printColor,
        String printFormat,

        // ── Мышь / Клавиатура ─────────────────────────────
        Boolean wireless,

        // ── Клавиатура ────────────────────────────────────
        String switchType,

        // ── Сеть / ИБП ───────────────────────────────────
        Integer portCount,
        Integer powerVa,
        Integer batteryRuntimeMin,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}