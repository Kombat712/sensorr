# AGENTS.md

## Environment
- ОС разработчика: Linux (типичный запуск в Docker/WSL).
- Пакетный менеджер: `yarn`.
- Node.js: рекомендуется LTS 18+ (для старого проекта возможен 16).

## Build / Run
- Dev UI: `yarn dev`
- Production build: `yarn build`
- PM2 server: `yarn server` или `yarn prod`

## Tests
- Unit tests для shared-слоя запускаются через Node:
  - `node tests/shared.documents.test.js`
  - `node tests/shared.tmdb.test.js`
- При добавлении фич обязательно добавлять минимум 1 позитивный и 1 граничный сценарий.

## Coding Guidelines
- Следовать стилю существующего кода (CommonJS в `shared/`, ES6+ синтаксис).
- Избегать ломающих изменений схемы: только обратно-совместимые поля по умолчанию.
- Для новых сущностей документов добавлять нормализацию и безопасные дефолты.

## Documentation
- При расширении доменной модели обновлять `README.md` и/или `doc/`.
- В PR/коммите описывать: что добавлено, что не покрыто, как проверить.
