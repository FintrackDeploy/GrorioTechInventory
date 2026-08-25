package by.GroiroTechInventory.entity;

import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "equipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inventory_number", nullable = false, length = 50)
    private String inventoryNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EquipmentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EquipmentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_employee_id")
    private Employee responsibleEmployee;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    // Поле сохранено в схеме БД, но больше не редактируется через API/UI —
    // гарантию решили убрать из карточки оборудования.
    @Column(name = "warranty_until")
    private LocalDate warrantyUntil;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "mac_address", length = 17)
    private String macAddress;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ── ПК / Ноутбук ──────────────────────────────────
    @Column(length = 200)
    private String cpu;

    @Column(name = "ram_gb")
    private Integer ramGb;

    @Column(length = 200)
    private String storage;

    @Column(length = 200)
    private String gpu;

    @Column(length = 100)
    private String os;

    @Column(name = "form_factor", length = 50)
    private String formFactor;

    // ── Монитор / Проектор ────────────────────────────
    @Column(name = "diagonal_inch", precision = 5, scale = 1)
    private BigDecimal diagonalInch;

    @Column(length = 30)
    private String resolution;

    @Column(name = "panel_type", length = 30)
    private String panelType;

    // Разъёмы: VGA, HDMI, DisplayPort и т.д. — свободный текст
    @Column(length = 150)
    private String connectors;

    // Поле сохранено в схеме БД, но больше не используется через API/UI.
    @Column(name = "refresh_rate_hz")
    private Integer refreshRateHz;

    // ── Принтер / МФУ ────────────────────────────────
    @Column(name = "print_speed_ppm")
    private Integer printSpeedPpm;

    @Column(name = "print_color")
    private Boolean printColor;

    @Column(name = "print_format", length = 10)
    private String printFormat;

    // ── Мышь ─────────────────────────────────────────
    // Поле сохранено в схеме БД, но больше не используется через API/UI.
    private Integer dpi;

    private Boolean wireless;

    // ── Клавиатура ────────────────────────────────────
    @Column(name = "switch_type", length = 80)
    private String switchType;

    // Поле сохранено в схеме БД, но больше не используется через API/UI.
    @Column(length = 30)
    private String layout;

    // ── Сеть / ИБП ───────────────────────────────────
    @Column(name = "port_count")
    private Integer portCount;

    @Column(name = "power_va")
    private Integer powerVa;

    @Column(name = "battery_runtime_min")
    private Integer batteryRuntimeMin;

    // ─────────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "equipment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkLog> workLogs = new ArrayList<>();
}