# VSC Language Support for 1C BSL

VSC Language Support for 1C BSL — исходники расширения редактора для языка 1C:Enterprise BSL, языка запросов 1C и OneScript. Проект добавляет подсветку, навигацию по коду, подсказки, форматирование и интеграцию с BSL Language Server.

## ✨ Особенности

- Подсветка синтаксиса для BSL и 1C Query.
- Автодополнение, hover, definition, references и symbols.
- Форматирование документов.
- Quick Open по методам и workspace symbol search.
- Динамические snippets и генерация описаний методов.
- Интеграция с BSL Language Server и отображение его статуса.
- Встроенные библиотеки описаний для 1C и OneScript.

## 🚀 Быстрый старт

В этой копии репозитория видны исходники расширения, грамматики и данные библиотеки, но отсутствует верхнеуровневый `package.json`. Поэтому README фиксирует реальную структуру и точки расширения, а не несуществующие команды сборки.

Для изучения или доработки расширения:

1. Откройте каталог в редакторе как TypeScript-проект.
2. Начните с `src/extension.ts` — это точка активации расширения.
3. Проверьте `syntaxes/` и `lib/` для встроенных грамматик и справочных данных.

## 📁 Структура проекта

- `src/extension.ts` — точка активации расширения и регистрация провайдеров.
- `src/features/` — completion, hover, references, formatting, symbols, quick open и др.
- `src/util/` — загрузка и обслуживание BSL Language Server.
- `syntaxes/` — grammar-файлы для BSL и языка запросов 1C.
- `snippets/` — набор snippets.
- `lib/` — встроенные словари, markdown helpers и справочные JSON.
- `OneScript.Web/syntaxhelp/` — данные syntax helper для OneScript.

## 🛠 Использование

По коду `src/extension.ts` расширение регистрирует completion, definition, reference, signature help, hover, formatting, workspace symbols, команды генерации комментариев и markdown-описаний, а также поддерживает встроенный syntax helper и интеграцию с внешним BSL Language Server.

## 🧪 Технологии

- TypeScript
- VS Code Extension API
- Language Server Protocol
- JSON TextMate grammars
- OneScript / 1C metadata dictionaries

Подпись относится к текущей версии проекта.

---

Автор: legenda  
Telegram: [@LEGENDA_SD](https://t.me/LEGENDA_SD)
