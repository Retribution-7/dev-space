# Dashboard: данные и интеграция с backend

Документ фиксирует текущую архитектуру Dashboard и границы, через которые позже можно подключить backend без переписывания виджетов.

Сейчас backend, API routes и база данных не используются. Favorites и Recently Used хранятся в `localStorage`.

## 1. Состав данных Dashboard

Страница `src/app/(workspace)/dashboard/page.tsx` — серверный компонент, который композирует виджеты из `src/widgets/dashboard`.

| Виджет             | Данные                                        | Текущий источник                                                          | Характер данных                         | Backend в будущем                                                               |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| Welcome Section    | Тексты, иконки, декоративная разметка         | JSX компонента                                                            | Статические                             | Не требуется                                                                    |
| Workspace Overview | 4 метрики                                     | Конфигурация в `workspace-overview.tsx`; Favorites — через `useFavorites` | Смешанные: static + localStorage + hook | Favorites — через API-реализацию repository; Snippets/API — после их реализации |
| Recently Used      | `RecentToolVisit[]` и метаданные инструментов | `useRecentTools` → `RecentToolsRepository` → `localStorage`               | Динамические, localStorage              | `RecentToolsRepository` с API-реализацией                                       |
| Favorites          | `ToolId[]` и метаданные инструментов          | `useFavorites` → `FavoritesRepository` → `localStorage`                   | Динамические, localStorage              | `FavoritesRepository` с API-реализацией                                         |
| Recent Snippets    | Placeholder                                   | Статический JSX                                                           | Статические                             | Вне текущего аудита; появится вместе с Snippet Manager                          |

`RecentToolsTracker` подключён в `src/widgets/workspace/workspace-layout.tsx` и записывает посещения инструментов через `RecentToolsRepository.recordVisit`.

### Workspace Overview

Конфигурация метрик — массив `metrics` в `src/widgets/dashboard/workspace-overview.tsx`.

- **Saved Snippets** — `null`, placeholder до реализации Snippet Manager.
- **API Requests** — `null`, placeholder до реализации API Playground.
- **Favorites** — `favoriteIds.length` из `useFavorites`.
- **Available Tools** — `availableToolsCount` из `src/shared/config/tools.ts` (6 инструментов).

Отдельного repository для overview нет: метрики собираются из существующих источников. Для Favorites уже реализованы состояния `loading`, `ready` и `error`; при ошибке не показывается ложный `0`.

### Хранилище

| Данные        | Ключ `localStorage`       | Реализация                                 |
| ------------- | ------------------------- | ------------------------------------------ |
| Favorites     | `devspace:favorite-tools` | `local-storage-favorites-repository.ts`    |
| Recently Used | `devspace:recent-tools`   | `local-storage-recent-tools-repository.ts` |

## 2. Существующие типы и контракты

Новые доменные типы не добавлялись: существующих определений достаточно для текущей интеграционной границы.

| Тип / контракт                                                                      | Файл                                           | Назначение                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `ToolId`                                                                            | `src/shared/config/tools.ts`                   | Строгий ID инструмента                               |
| `ToolNavItem`                                                                       | `src/shared/config/tools.ts`                   | Метаданные инструмента: `id`, `title`, `url`, `icon` |
| `FavoritesRepository`                                                               | `src/features/favorites/model/types.ts`        | Контракт чтения и сохранения избранного              |
| `RecentToolVisit`                                                                   | `src/features/recent-tools/model/types.ts`     | Доменная запись о посещении инструмента              |
| `RecentToolsRepository`                                                             | `src/features/recent-tools/model/types.ts`     | Контракт чтения истории и записи визита              |
| `RECENT_TOOLS_LIMIT`                                                                | `src/features/recent-tools/model/types.ts`     | Лимит отображаемой истории (3)                       |
| `OverviewMetric`, `StaticOverviewMetric`, `FavoritesOverviewMetric`, `MetricStatus` | `src/widgets/dashboard/workspace-overview.tsx` | Локальные типы представления карточек, не доменные   |

Граница для backend уже описана контрактами:

```ts
export type FavoritesRepository = {
	getFavoriteToolIds: () => Promise<ToolId[]>;
	setFavoriteToolIds: (toolIds: ToolId[]) => Promise<void>;
};

export type RecentToolsRepository = {
	getRecentTools: () => Promise<RecentToolVisit[]>;
	recordVisit: (toolId: string, visitedAt: number) => Promise<void>;
};
```

API-реализации должны возвращать эти же доменные типы. DTO ответа API (например, ISO-даты) валидируются и маппятся внутри repository, не попадая в hooks и widgets.

Для текущей задачи новых типов не требуется. Если позже появится единый overview-эндпоинт, его минимальная read-model может быть узкой:

```ts
export type WorkspaceOverviewCounts = {
	savedSnippets: number;
	apiRequests: number;
	favorites: number;
	availableTools: number;
};
```

Этот тип в код не добавлен: сейчас для него нет источника данных, а дублировать счётчики feature-модулей преждевременно.

## 3. Текущие точки интеграции

```text
app/(workspace)/dashboard/page.tsx          композиция виджетов
  └─ widgets/dashboard/*                    отображение готовых данных
       ├─ features/favorites
       │    ├─ useFavorites
       │    ├─ model/types.ts                FavoritesRepository (контракт)
       │    └─ model/local-storage-...ts     текущий data source
       └─ features/recent-tools
            ├─ useRecentTools
            ├─ model/types.ts                RecentToolsRepository (контракт)
            └─ model/local-storage-...ts     текущий data source
```

| Слой              | Ответственность и будущее изменение                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Repositories      | Контракты `FavoritesRepository` и `RecentToolsRepository` сохраняются без изменений                                                       |
| Data sources      | Добавить API-реализации контрактов вместо или рядом с `local-storage-*`                                                                   |
| Hooks             | Заменить импорт concrete repository или выбрать реализацию в composition layer; публичный API `useFavorites`/`useRecentTools` не меняется |
| Widgets           | Не меняются, если контракты и доменные типы сохранены                                                                                     |
| Tracker           | Точка записи визитов на backend — `recordVisit`                                                                                           |
| App / composition | Выбор local/API реализации и, при необходимости, auth-контекст                                                                            |

Сейчас hooks импортируют конкретные singleton-репозитории:

- `src/features/favorites/model/use-favorites.ts` → `favoritesRepository`;
- `src/features/recent-tools/model/use-recent-tools.ts` → `recentToolsRepository`;
- `src/features/recent-tools/model/use-track-recent-tool-visits.ts` → `recentToolsRepository`.

Это единственная кодовая привязка к `localStorage`. Provider или dependency injection сейчас не добавляются: для подключения backend достаточно заменить реализацию и точки импорта.

## 4. Предполагаемые API-контракты

Конкретные URL и формат ответов не определены, пока backend отсутствует.

### Favorites

- Получение избранного → `ToolId[]`.
- Сохранение полного списка → `void`.
- Ошибки чтения и записи должны отклонять promise: `useFavorites` уже показывает Error state и откатывает оптимистичное обновление.
- Сервер валидирует `ToolId` и права пользователя.

### Recently Used

- Получение истории → `RecentToolVisit[]`.
- Запись визита `{ toolId, visitedAt }` → `void`.
- Repository приводит ответ к текущей форме: `toolId: string`, `visitedAt: number` (epoch ms), сортировка и лимит.
- Нужно решить политику ошибок записи: сейчас tracker игнорирует сбои и не имеет UI для их отображения.

### Workspace Overview

- Favorites уже получает данные через `useFavorites`; отдельный вызов для счётчика не нужен.
- Saved Snippets и API Requests появятся вместе с соответствующими feature-модулями; их счётчики логично получать из их repository/hook.
- Если появится единый summary-эндпоинт, для него добавляется отдельный узкий контракт; сейчас он не создаётся.

## 5. Что изменится при переходе на backend

1. Добавить API-реализации `FavoritesRepository` и `RecentToolsRepository`.
2. Валидировать ответы API без `any` — по аналогии с type guards в localStorage-репозиториях.
3. Маппить DTO в `ToolId[]` и `RecentToolVisit[]`; даты приводить к epoch ms.
4. Заменить импорты concrete repositories в hooks или выбрать реализацию в composition layer.
5. Обеспечить проброс ошибок API в hooks; Loading/Error/rollback-состояния уже готовы.
6. Учесть авторизацию и пользовательский контекст в API-реализациях.
7. Решить судьбу `localStorage`: удалить, оставить как offline-fallback или использовать для неавторизованных пользователей.
8. При необходимости live-синхронизации Favorites между экземплярами хука добавить общий кеш или инвалидацию.
9. Обновить документацию и добавить тесты repository/hook после появления backend.

## 6. Что остаётся неизменным

- Welcome Section остаётся статическим.
- Конфигурация Workspace Overview сохраняется; placeholder-метрики не считаются реальными данными.
- Favorites и Recently Used продолжают получать доменные данные через существующие hooks.
- Метаданные инструментов (`title`, `url`, `icon`) остаются в `shared/config/tools.ts`, пока каталог инструментов не станет серверным.
- UI и состояния Dashboard не требуют изменений для подключения API к Favorites и Recently Used.
