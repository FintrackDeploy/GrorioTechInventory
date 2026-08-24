package by.GroiroTechInventory.dto.room;

import by.GroiroTechInventory.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RoomRequest(
        @NotNull(message = "Этаж обязателен") Long floorId,
        @NotBlank(message = "Номер кабинета обязателен") String number,
        String name,
        @NotNull(message = "Тип помещения обязателен") RoomType roomType,
        List<Long> employeeIds   // сотрудники кабинета
) {
}