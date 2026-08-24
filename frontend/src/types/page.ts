// Зеркалит org.springframework.data.domain.Page при сериализации в JSON
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // текущая страница, с 0
  size: number;
}
