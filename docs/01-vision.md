# 01 — Vision

## Problem

Створення нового pet/project часто починається хаотично:

* вручну створюються docs;
* опціонально ініціалізується OpenSpec;
* окремо створюються `CLAUDE.md` / `AGENTS.md`;
* структура між проектами відрізняється;
* AI отримує різний контекст і workflow.

## Vision

`create-spec-project` — локальний CLI для швидкого створення однакової AI-native / spec-driven структури нового проекту.

CLI не визначає технологічний стек проекту.

Він створює базовий development framework від idea/discovery до implementation.

## Target User

Перший користувач — автор CLI.

## Core Value

Одна команда повинна прибрати повторюваний setup нового проекту та дати однакову стартову структуру для AI-assisted development.

Після positional target команда пропонує один інтерактивний вибір: ініціалізувати OpenSpec чи ні. Типовий вибір — No.

## Non-Goals

V1 не включає:

* генерацію frontend/backend stack;
* plugin system;
* presets;
* deployment;
* CI/CD;
* автоматичну генерацію бізнес-вимог;
* складну конфігурацію.
