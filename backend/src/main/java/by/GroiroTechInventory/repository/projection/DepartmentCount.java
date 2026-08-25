package by.GroiroTechInventory.repository.projection;

// Проекция для сводки "отдел → количество сотрудников" — сайдбар фильтра
// на странице сотрудников.
public interface DepartmentCount {
    String getDepartment();
    Long getCnt();
}