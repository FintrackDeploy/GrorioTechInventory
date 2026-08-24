package by.GroiroTechInventory.dto.equipment;

import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EquipmentRequest(
        @NotBlank(message = "Инвентарный номер обязателен") String inventoryNumber,
        @NotNull(message = "Тип оборудования обязателен") EquipmentType type,
        @NotNull(message = "Статус обязателен") EquipmentStatus status,
        Long roomId,
        Long responsibleEmployeeId,
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
        Integer batteryRuntimeMin
) {
}