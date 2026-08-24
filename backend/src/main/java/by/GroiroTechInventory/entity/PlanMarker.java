package by.GroiroTechInventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plan_markers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanMarker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marker_type_id", nullable = false)
    private PlanMarkerType markerType;

    // "x,y" для точки, "x1,y1 x2,y2 ..." для линии — те же пиксельные
    // координаты исходного изображения плана, что раньше использовались
    // для полигонов кабинетов.
    @Column(nullable = false, columnDefinition = "TEXT")
    private String points;

    @Column(length = 200)
    private String label;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}