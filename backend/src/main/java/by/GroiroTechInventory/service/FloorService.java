package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.floor.FloorRequest;
import by.GroiroTechInventory.dto.floor.FloorResponse;
import by.GroiroTechInventory.entity.Floor;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorService {

    private final FloorRepository floorRepository;

    public List<FloorResponse> findAll() {
        return floorRepository.findAll().stream().map(this::toResponse).toList();
    }

    public FloorResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public FloorResponse create(FloorRequest request) {
        Floor floor = Floor.builder()
                .number(request.number())
                .name(request.name())
                .build();
        return toResponse(floorRepository.save(floor));
    }

    @Transactional
    public FloorResponse update(Long id, FloorRequest request) {
        Floor floor = getEntity(id);
        floor.setNumber(request.number());
        floor.setName(request.name());
        return toResponse(floor);
    }

    @Transactional
    public void delete(Long id) {
        floorRepository.delete(getEntity(id));
    }

    private Floor getEntity(Long id) {
        return floorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Этаж не найден: id=" + id));
    }

    private FloorResponse toResponse(Floor floor) {
        return new FloorResponse(
                floor.getId(),
                floor.getNumber(),
                floor.getName(),
                floor.getRooms().size()
        );
    }
}