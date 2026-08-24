package by.GroiroTechInventory.dto.floor;

public record FloorResponse(
        Long id,
        Integer number,
        String name,
        int roomsCount
) {
}