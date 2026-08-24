package by.GroiroTechInventory.entity;

import by.GroiroTechInventory.enums.MarkerKind;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plan_marker_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanMarkerType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    // Hex-цвет маркера, например "#ef4444"
    @Column(nullable = false, length = 20)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MarkerKind kind;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}