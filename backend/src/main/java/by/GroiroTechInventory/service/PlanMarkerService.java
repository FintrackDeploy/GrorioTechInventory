package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.planmarker.PlanMarkerRequest;
import by.GroiroTechInventory.dto.planmarker.PlanMarkerResponse;
import by.GroiroTechInventory.entity.Floor;
import by.GroiroTechInventory.entity.PlanMarker;
import by.GroiroTechInventory.entity.PlanMarkerType;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.FloorRepository;
import by.GroiroTechInventory.repository.PlanMarkerRepository;
import by.GroiroTechInventory.repository.PlanMarkerTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanMarkerService {

    private final PlanMarkerRepository markerRepository;
    private final PlanMarkerTypeRepository markerTypeRepository;
    private final FloorRepository floorRepository;

    public List<PlanMarkerResponse> findByFloor(Long floorId) {
        return markerRepository.findByFloorIdOrderById(floorId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public PlanMarkerResponse create(Long floorId, PlanMarkerRequest request) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new NotFoundException("Этаж не найден: id=" + floorId));
        PlanMarkerType type = getType(request.markerTypeId());

        PlanMarker marker = PlanMarker.builder()
                .floor(floor)
                .markerType(type)
                .points(request.points())
                .label(blankToNull(request.label()))
                .build();

        return toResponse(markerRepository.save(marker));
    }

    @Transactional
    public PlanMarkerResponse update(Long id, PlanMarkerRequest request) {
        PlanMarker marker = getEntity(id);
        marker.setMarkerType(getType(request.markerTypeId()));
        marker.setPoints(request.points());
        marker.setLabel(blankToNull(request.label()));
        return toResponse(marker);
    }

    @Transactional
    public void delete(Long id) {
        markerRepository.delete(getEntity(id));
    }

    private PlanMarker getEntity(Long id) {
        return markerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Маркер не найден: id=" + id));
    }

    private PlanMarkerType getType(Long id) {
        return markerTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Тип маркера не найден: id=" + id));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private PlanMarkerResponse toResponse(PlanMarker m) {
        PlanMarkerType type = m.getMarkerType();
        return new PlanMarkerResponse(
                m.getId(),
                m.getFloor().getId(),
                type.getId(),
                type.getName(),
                type.getColor(),
                type.getKind(),
                m.getPoints(),
                m.getLabel()
        );
    }
}