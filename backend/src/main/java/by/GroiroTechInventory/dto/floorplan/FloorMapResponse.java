package by.GroiroTechInventory.dto.floorplan;

import java.util.List;

public record FloorMapResponse(
        Long floorId,
        Integer floorNumber,
        String floorName,
        String imageUrl,
        Integer originalWidth,
        Integer originalHeight,
        List<RoomMapItem> rooms
) {
    public record RoomMapItem(
            Long roomId,
            String roomNumber,
            String roomName,
            String points,
            Double labelX,
            Double labelY,
            int totalEquipment,
            int inRepair,       // статус REPAIR
            int inStorage,      // статус STORAGE
            String mapStatus    // "OK" | "WARNING" | "CRITICAL" | "EMPTY"
    ) {}
}