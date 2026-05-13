# Sensorr TV — подробный гайд запуска и сдачи

> Цель: получить рабочий end-to-end сценарий TV (поиск/детали/календарь/фоновые задачи/загрузка релизов)

## 0) Требования к окружению
- OS: Linux/macOS/WSL
- Node.js: 18.x или 20.x
- npm: 9+
- yarn: classic/berry (любой, главное успешная установка зависимостей)

Проверка:
```bash
node -v
npm -v
yarn -v
```

## 1) Установка зависимостей
Из корня репозитория:
```bash
yarn install
# fallback
npm install
```

Если ошибка 403 (registry policy), это проблема сети/прокси, а не кода.

## 2) Базовая конфигурация
Открой `config.default.json` и заполни минимум:
- `tmdb` — API ключ TMDB
- `xznabs` — хотя бы 1 индексер
- `blackhole` — путь для movie torrent/nzb
- `tv.blackhole` — путь для TV torrent/nzb
- `tv.quality`, `tv.excluded_terms`
- (опционально) `plex.url`, `plex.token`

## 3) Сборка и фронтенд
```bash
yarn build
yarn dev
```
Открой UI и проверь:
- Search -> `tv`
- Страница `/series/:id`
- Library (разделы Movies + Series)
- Following (Series actors)
- Calendar фильтр `all/movie/tv`

## 4) Автотесты
```bash
node tests/shared.documents.test.js
node tests/shared.tmdb.test.js
node tests/shared.database.test.js
node tests/integration.tv-flow.test.js
```

## 5) Фоновые задачи (CLI)
Порядок запуска:
```bash
sensorr hydrate
sensorr checkEpisodes
sensorr schedule
sensorr record
```

Что ожидать:
- `hydrate`: обновляет movie/star/series
- `checkEpisodes`: логирует новые aired эпизоды у followed series
- `schedule`: добавляет публикации в календарь (включая `media_type=tv`)
- `record`: ищет/грабит релизы эпизодов (SXXEXX + season pack), пропускает если сериал найден в Plex

## 6) Сценарий демонстрации преподавателю (5-7 минут)
1. Показать исходную movie-функциональность (что не сломана).
2. Показать TV Search -> открыть сериал -> сменить статус (following/skipped/watched).
3. Отметить эпизод watched.
4. Показать Following: секция актеров сериалов.
5. Показать Calendar фильтр `tv`.
6. В терминале прогнать `checkEpisodes`, `schedule`, `record`.
7. Показать, что файлы эпизодов пишутся в `tv.blackhole`.
8. (Если настроен Plex) показать, что при наличии сериала в Plex загрузка пропускается.

## 7) Частые проблемы
- `403 npm registry`: настрой прокси/VPN/доступ к registry.
- Ошибки TMDB: проверь валидность `tmdb` ключа.
- Пустой record: проверь `xznabs`, `tv.excluded_terms`, доступность индексера.
- Ничего не в календаре: убедись, что есть followed series с aired episodes.

## 8) Мини-чек перед сдачей
- [ ] Зависимости установлены
- [ ] `yarn build` успешен
- [ ] 4 теста проходят
- [ ] UI сценарий TV работает
- [ ] CLI сценарий `hydrate -> checkEpisodes -> schedule -> record` работает
