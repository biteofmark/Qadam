# Overview

This is a comprehensive educational testing platform called ProjectEnt built with React, TypeScript, and Express.js. The application provides an interactive environment for students to take tests across multiple subjects, with features like calculators, periodic tables, real-time scoring, rankings, and administrative management. The platform supports hierarchical test organization through blocks, variants, subjects, and questions, with built-in authentication and session management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing with protected routes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS
- **Authentication**: Context-based auth provider with session management
- **Theme System**: Custom theme provider supporting light/dark modes

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with comprehensive CRUD operations for all entities
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Hierarchical structure (Users → Blocks → Variants → Subjects → Questions → Answers)

## Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon Database
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migration System**: Drizzle Kit for database schema migrations
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

## Authentication and Authorization
- **Strategy**: Session-based authentication with Passport.js
- **Password Security**: Scrypt hashing with random salt generation
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Route Protection**: Client-side protected routes with authentication checks
- **Admin Access**: Role-based access control for administrative functions

# External Dependencies

## Third-Party Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Platform**: Development environment with specialized Vite plugins

## UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel component for interactive content

## Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire codebase
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

## Testing and Educational Tools
- **Built-in Calculator**: Custom calculator component for math tests
- **Periodic Table**: Interactive periodic table component for chemistry
- **Timer System**: Real-time test timer with automatic submission
- **Progress Tracking**: Subject-wise progress monitoring and analytics

# Recent Changes

- **Создана публичная главная страница** доступная без регистрации с бесплатными вариантами тестов
- Добавлено поле `isFree` в схему variants для обозначения бесплатных тестов
- Реализован API эндпоинт `/api/public/free-variants` для получения бесплатных вариантов
- Изменен роутинг: "/" - публичная страница, "/dashboard" - защищенная, "/public-test/:id" - гостевые тесты
- Полностью исправлена админ панель с объединенной вкладкой "Вопросы и ответы"
- Устранена критическая проблема "NaN%" в результатах тестов
- Завершена миграция от Map-based storage к PostgreSQL для всех основных компонентов
- Система стабилизирована - LSP ошибки сокращены с 1000+ до 36

# Public Features

## Публичная главная страница
- **Путь**: `/` - доступна без авторизации
- **Функции**: Героическая секция, карточки бесплатных тестов, CTA для регистрации
- **API**: `/api/public/free-variants` возвращает бесплатные варианты с данными блоков
- **Дизайн**: Современный градиентный дизайн с адаптивностью и dark mode

## Гостевое тестирование
- **Путь**: `/public-test/:variantId` - прохождение бесплатных тестов без регистрации
- **Ограничения**: Только для вариантов с `isFree = true`
- **Функциональность**: Полный доступ к тестированию, но без сохранения результатов