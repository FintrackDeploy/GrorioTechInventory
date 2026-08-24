package by.GroiroTechInventory.dto.floorplan;

public record RoomPolygonResponse(
        Long id,
        Long roomId,
        String roomNumber,
        String roomName,
        String points,
        Double labelX,
        Double labelY
) {}