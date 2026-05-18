# Онлайн-платформа для управления штатным расписанием организации

Веб-приложение для HR-менеджеров и сотрудников: ведение штатного расписания, подразделений, должностей, личных дел сотрудников, заявок на отпуск, формирование отчётов в XLSX/PDF.

## Технологический стек

| Слой | Технологии |
| --- | --- |
| Frontend | React 18 + TypeScript, Vite, Material UI 5, Redux Toolkit, React Router 6, Recharts, Axios, date-fns |
| Backend | Node.js + Express + TypeScript, JWT, bcryptjs, Zod, Morgan |
| База данных | PostgreSQL 14+ + Prisma ORM |
| Отчёты | ExcelJS (XLSX), PDFKit (PDF) |

## Структура репозитория

```
.
├── client/                     # React + Vite фронтенд
│   └── src/
│       ├── api/                # HTTP-клиенты (auth, employees, ...)
│       ├── app/                # Redux store
│       ├── components/         # Layout, ProtectedRoute, общие компоненты
│       ├── features/           # Redux slices (auth, ui, filters)
│       ├── pages/              # Страницы приложения
│       ├── theme/              # MUI-тема (light/dark)
│       ├── types/              # TypeScript-модели
│       └── utils/              # Форматтеры и хелперы
├── server/                     # Express + Prisma бэкенд
│   ├── prisma/
│   │   ├── schema.prisma       # 9 таблиц в 3НФ
│   │   └── seed.ts             # Сидинг (~280 записей)
│   └── src/
│       ├── config/             # Загрузка .env
│       ├── middleware/         # auth, errorHandler
│       ├── routes/             # REST-роуты
│       └── utils/              # prisma, jwt, http-ошибки
└── package.json                # npm workspaces (server + client)
```

## Быстрый старт

### Требования

- **Node.js** 20+ (с npm 10+)
- **PostgreSQL 14+** установлен локально

### 1. Подготовка базы данных

Создайте пустую базу `staffing_db`. Самый простой способ — через `psql`:

```bash
psql -U postgres
```

Внутри `psql`:

```sql
CREATE DATABASE staffing_db;
\q
```

Альтернативно через pgAdmin: правый клик на «Databases» → «Create» → «Database…» → имя `staffing_db`.

### 2. Настройка подключения

Скопируйте `.env.example` в `.env` и отредактируйте `DATABASE_URL` под вашего пользователя PostgreSQL:

```bash
cd server
cp .env.example .env
```

Формат строки:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/staffing_db?schema=public"
```

> По умолчанию используется `postgres:postgres`. Если у вас другой пользователь — поправьте.

### 3. Установка зависимостей

Из корня проекта:

```bash
npm install
npm install --workspaces
```

### 4. Миграции и сидинг

```bash
cd server
npx prisma migrate dev --name init
npm run prisma:seed
cd ..
```

Сид создаст:
- 17 подразделений (с иерархией)
- 19 должностей
- 38 записей в истории окладов
- 102 сотрудника (включая HR и демо)
- 122 штатные единицы
- 35 заявок на отпуск
- ~90 документов

**Демо-учётки:**
- HR-менеджер: `hr@staffing.local` / `hr12345`
- Сотрудник:    `employee@staffing.local` / `emp12345`

### 5. Запуск приложения

В одном терминале — оба процесса параллельно:

```bash
npm run dev
```

Либо отдельно:

```bash
# Терминал 1
npm run server:dev      # http://localhost:4000

# Терминал 2
npm run client:dev      # http://localhost:5173
```

Откройте `http://localhost:5173` и войдите под одной из демо-учёток.

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Запустить server + client параллельно |
| `npm run server:dev` | Запуск Express в watch-режиме |
| `npm run client:dev` | Запуск Vite dev server |
| `npm run server:migrate` | Применить миграции Prisma |
| `npm run server:seed` | Перезалить сид-данные |
| `npm run client:build` | Production-сборка фронтенда |
| `cd server && npx prisma studio` | GUI для просмотра БД |
| `cd server && npm run prisma:reset` | Сбросить БД и пересоздать схему |

## Архитектура и реализованные требования

### База данных (9 таблиц в 3НФ)

```
users ──┐                                ┌── employee_documents
        │                                │
        └─ employees ─┬── staff_units ───┘
                     │       │
                     │       ├── departments (иерархия parent→children)
                     │       │
                     │       └── positions ── salary_records (история окладов)
                     │
                     └── leave_requests

audit_logs (журнал действий пользователей)
```

### REST API

| Метод | Путь | Что делает | Роли |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Регистрация | все |
| POST | `/api/auth/login` | Вход | все |
| GET | `/api/auth/me` | Текущий пользователь | auth |
| POST | `/api/auth/change-password` | Смена пароля | auth |
| GET | `/api/employees` | Список с фильтрами/пагинацией/сортировкой | auth |
| GET | `/api/employees/:id` | Карточка (HR — любая, сотрудник — только своя) | auth |
| GET | `/api/employees/me/profile` | Свой профиль | auth |
| POST/PUT/DELETE | `/api/employees(/:id)` | CRUD | HR |
| POST | `/api/employees/:id/documents` | Документ | HR |
| GET/POST/PUT/DELETE | `/api/departments(/:id)` | CRUD | HR (GET — все) |
| GET | `/api/departments/tree` | Иерархическое дерево | auth |
| GET/POST/PUT/DELETE | `/api/positions(/:id)` | CRUD | HR (GET — все) |
| POST | `/api/positions/:id/salary` | Новая ставка оклада | HR |
| GET/POST/PUT/DELETE | `/api/staff-units(/:id)` | CRUD | HR (GET — все) |
| GET | `/api/staff-units/summary` | Сводка для дашборда | auth |
| POST | `/api/staff-units/:id/assign` | Назначить сотрудника | HR |
| GET/POST | `/api/leave-requests` | Заявки на отпуск | auth |
| POST | `/api/leave-requests/:id/decision` | Одобрить/отклонить | HR |
| POST | `/api/leave-requests/:id/cancel` | Отозвать | auth |
| GET | `/api/reports/staffing.xlsx` | Отчёт по штатному расписанию | HR |
| GET | `/api/reports/employees.xlsx` | Реестр сотрудников | HR |
| GET | `/api/reports/payroll.pdf` | ФОТ по подразделениям | HR |

### Страницы фронтенда (11 страниц, без учёта логина/регистрации)

1. **Сводка** — карточки, графики (BarChart ФОТ, PieChart по статусам), прогресс-бар укомплектованности
2. **Сотрудники** — список с фильтрами, поиском, пагинацией, сортировкой
3. **Карточка сотрудника** — личные данные, штатная единица, документы, заявки
4. **Подразделения** — два вида (дерево / плитка), CRUD
5. **Должности** — таблица, история окладов
6. **Штатное расписание** — главная сущность системы, фильтры по подразделению/должности/статусу/графику + range-slider по окладу
7. **Заявки на отпуск** — подача, одобрение/отклонение/отзыв
8. **Отчёты** — XLSX и PDF
9. **Мой профиль** — для роли «Сотрудник»
10. **Настройки** — тема, смена пароля, сброс сохранённых фильтров
11. **404**

### 20+ компонентов Material UI

`AppBar`, `Drawer`, `Toolbar`, `Card`, `Button`, `IconButton`, `TextField`, `Select` / `MenuItem`, `Autocomplete`, `Table`, `Pagination`, `Chip`, `Avatar`, `Badge`, `Dialog`, `Snackbar` + `Alert`, `Tooltip`, `Menu`, `Tabs` + `Tab`, `Accordion`, `Breadcrumbs`, `Stepper`, `DatePicker`, `Slider`, `Switch`, `ToggleButtonGroup`, `LinearProgress`, `Divider`, `CircularProgress`.

### 15+ реализованных функций

1. Регистрация и авторизация (JWT)
2. Защищённые маршруты с проверкой ролей
3. CRUD сотрудников
4. CRUD подразделений с иерархией
5. CRUD должностей
6. CRUD штатных единиц
7. Поиск по сотрудникам (ФИО, email, телефон)
8. Многокритериальная фильтрация (подразделение, должность, статус, график, оклад)
9. Сортировка таблиц
10. Пагинация
11. Подача заявок на отпуск
12. Одобрение/отклонение/отзыв заявок
13. Назначение сотрудника на штатную единицу
14. История окладов по должностям
15. Документы сотрудника (паспорт, СНИЛС и т. д.)
16. Отчёт по штатному расписанию (XLSX)
17. Отчёт по сотрудникам (XLSX)
18. Отчёт по ФОТ (PDF)
19. График ФОТ по подразделениям (BarChart)
20. Круговая диаграмма статусов сотрудников
21. Сохранение фильтров в `localStorage`
22. Сброс фильтров одной кнопкой
23. Переключение темы (light/dark) с сохранением
24. Смена пароля
25. Аудит-лог действий пользователя
26. Адаптивная вёрстка от 320px до 1920px+

## Тестовый сценарий

После запуска и сидинга выполните «сквозную» проверку:

1. Войдите как `hr@staffing.local` / `hr12345` → откроется дашборд со статистикой
2. Перейдите в «Сотрудники» → используйте поиск, фильтр по статусу, сортировку
3. Откройте карточку сотрудника → вкладки «Кадровая информация», «Документы», «Заявки»
4. «Подразделения» → переключитесь между деревом и плиточным видом, создайте подразделение
5. «Должности» → добавьте новую ставку оклада через 💰
6. «Штатное расписание» → используйте range-slider по окладу, назначьте сотрудника на вакансию
7. «Заявки на отпуск» → одобрите ожидающую заявку
8. «Отчёты» → скачайте XLSX и PDF
9. Войдите как `employee@staffing.local` / `emp12345`
10. Меню урезано (HR-разделы скрыты); открыта страница «Мой профиль» и возможность подать заявку

## Решение проблем

**`prisma migrate dev` падает с «authentication failed»**
Проверьте логин/пароль в `server/.env`. Стандартный пользователь postgres — `postgres`, пароль вы задавали при установке.

**`prisma migrate dev` падает с «database does not exist»**
Создайте базу `staffing_db` (см. шаг 1) — Prisma не создаёт БД сама, только схему внутри уже существующей.

**Фронт не подключается к API**
Проверьте, что Express запущен на `localhost:4000`. Если порт занят — поменяйте `PORT` в `server/.env` и поправьте `proxy.target` в `client/vite.config.ts`.

## Лицензия

Учебный проект (КР по дисциплине «Средства взаимодействия человека с вычислительными системами», БРУ, 2024–2026).
