package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.planmarker.PlanMarkerTypeRequest;
import by.GroiroTechInventory.dto.planmarker.PlanMarkerTypeResponse;
import by.GroiroTechInventory.entity.PlanMarkerType;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.PlanMarkerTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanMarkerTypeService {

    private final PlanMarkerTypeRepository markerTypeRepository;

    public List<PlanMarkerTypeResponse> findAll() {
        return markerTypeRepository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PlanMarkerTypeResponse create(PlanMarkerTypeRequest request) {
        if (markerTypeRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new DataIntegrityViolationException("Тип маркера с таким названием уже существует: " + request.name());
        }
        PlanMarkerType type = PlanMarkerType.builder()
                .name(request.name().trim())
                .color(request.color().trim())
                .kind(request.kind())
                .build();
        return toResponse(markerTypeRepository.save(type));
    }

    @Transactional
    public PlanMarkerTypeResponse update(Long id, PlanMarkerTypeRequest request) {
        PlanMarkerType type = getEntity(id);
        if (markerTypeRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new DataIntegrityViolationException("Тип маркера с таким названием уже существует: " + request.name());
        }
        type.setName(request.name().trim());
        type.setColor(request.color().trim());
        type.setKind(request.kind());
        return toResponse(type);
    }

    @Transactional
    public void delete(Long id) {
        markerTypeRepository.delete(getEntity(id));
    }

    private PlanMarkerType getEntity(Long id) {
        return markerTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Тип маркера не найден: id=" + id));
    }

    private PlanMarkerTypeResponse toResponse(PlanMarkerType t) {
        return new PlanMarkerTypeResponse(t.getId(), t.getName(), t.getColor(), t.getKind());
    }
}