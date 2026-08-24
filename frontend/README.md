# GroiroTechInventory — Frontend

React + TypeScript + Vite клиент для IT Asset Management System.

## Стек
- React 19 + TypeScript
- Vite 7 (dev-сервер проксирует `/api` и `/uploads` на `http://localhost:8080`)
- React Router — маршрутизация, защищённые роуты
- Axios — HTTP-клиент с интерцептором JWT и обработкой 401
- Tailwind CSS v4 — дизайн-токены в `src/index.css` (`@theme`)

## Запуск

```bash
npm install
npm run dev
```

Бэкенд (Spring Boot) должен быть запущен на `http://localhost:8080`.
Логин по умолчанию: `admin` / `admin123` (см. `001-initial-schema.yaml`,
обязательно смените в проде).

## Структура

```
src/
  api/          — axios-клиент и обёртки над REST-эндпоинтами
  context/      — AuthContext (сессия, JWT в localStorage)
  routes/       — ProtectedRoute (guard по авторизации/ролям)
  components/
    layout/     — Sidebar, Topbar, AppShell
  pages/        — страницы (LoginPage, DashboardPage, ...)
  types/        — TS-типы, зеркалящие DTO бэкенда
```

## Текущий статус

Готово: логин, каркас приложения (сайдбар с разделами меню, шапка,
защищённые роуты, хранение и обновление сессии).

Дальше: разделы меню — карта этажей, кабинеты, оборудование, заявки,
сотрудники, пользователи (CRUD-таблицы и формы поверх уже готового API-клиента).

## Переменные окружения

См. `.env.example`. Для локальной разработки не требуются — используется
прокси Vite.
