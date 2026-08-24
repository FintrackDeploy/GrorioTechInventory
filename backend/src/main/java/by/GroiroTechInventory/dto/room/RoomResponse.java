package by.GroiroTechInventory.dto.room;

import by.GroiroTechInventory.enums.RoomType;

import java.util.List;

public record RoomResponse(
        Long id,
        Long floorId,
        Integer floorNumber,
        String number,
        String name,
        RoomType roomType,
        List<EmployeeRef> employees,  // сотрудники кабинета
        int equipmentCount,
        int inRepair,
        int inStorage,
        String mapStatus
) {
    public record EmployeeRef(Long id, String fullName, String position) {}
}