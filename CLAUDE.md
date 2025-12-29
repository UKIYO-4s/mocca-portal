# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mocca Portal - A business management portal for restaurants (もっか/ばんしろう). Built with Laravel 12, React, TypeScript, and Inertia.js.

## Development Commands

```bash
# Start all development services (server, queue, logs, vite)
composer dev

# Or run individually:
php artisan serve    # Laravel server
npm run dev          # Vite dev server

# Build for production
npm run build        # Runs tsc && vite build

# Run tests
composer test        # Clears config cache and runs PHPUnit

# Lint frontend
npm run lint         # ESLint with auto-fix

# Database
php artisan migrate              # Run migrations
php artisan migrate:refresh --seed  # Reset DB with seeders

# PHP syntax check
php -l <file.php>
```

## Architecture

### Module System

The application uses a custom module system. Each feature is a self-contained module under `app/Modules/`:

```
app/Modules/{ModuleName}/
├── {ModuleName}Module.php    # Extends BaseModule, registers routes in boot()
├── Controllers/
├── Models/
└── Services/
```

**Key files:**
- `app/Core/BaseModule.php` - Abstract base class all modules extend
- `app/Providers/ModuleServiceProvider.php` - Auto-loads enabled modules
- `config/modules.php` - Enable/disable modules here

**Creating a new module:**
1. Create `app/Modules/{Name}/{Name}Module.php` extending `BaseModule`
2. Add to `ModuleServiceProvider::$modules` array
3. Add to `config/modules.php` enabled list
4. Implement `boot()` to register routes (comment out until controllers exist)

### Role-Based Access Control

Three roles: `admin`, `manager`, `staff`

```php
// In routes - use CheckRole middleware
Route::middleware('role:admin,manager')->group(function () {
    // Manager+ only routes
});

// In User model
$user->isAdmin()    // Check role
$user->isManager()
$user->isStaff()
```

### Frontend Structure

```
resources/js/
├── Pages/{ModuleName}/     # Inertia pages per module
├── Components/             # Shared React components
├── Layouts/
│   └── AuthenticatedLayout.tsx  # Main nav layout
└── types/
    └── index.d.ts          # TypeScript interfaces
```

**Inertia patterns:**
- Controller returns: `Inertia::render('ModuleName/PageName', ['props' => $data])`
- Page path must match: `resources/js/Pages/ModuleName/PageName.tsx`
- Use `route('name')` for URLs (Ziggy)

### Activity Logging

```php
// Inject in controller constructor
public function __construct(protected ActivityLogService $activityLog) {}

// Use methods
$this->activityLog->log('module', 'action', $model, 'description');
$this->activityLog->logCreated('module', $model, 'description');
$this->activityLog->logUpdated('module', $model, 'description');
$this->activityLog->logDeleted('module', $model, 'description');
```

## Common Patterns

### Controller returning data to React

```php
// Use get() not paginate() when frontend expects array
$items = Model::with('relation')->get();

return Inertia::render('Module/Index', [
    'items' => $items,  // Props name must match React component
]);
```

### TypeScript types must match database schema

```typescript
// resources/js/types/index.d.ts
export interface InventoryItem {
    id: number;
    item_id: number;      // Must match DB column name
    notes: string | null; // Not 'note'
}
```

## Test Accounts

| Email | Role |
|-------|------|
| admin@mocca-portal.local | admin |
| manager@mocca-portal.local | manager |
| staff@mocca-portal.local | staff |

## Deployment

```bash
ssh root@100.103.127.122  # Tailscale IP
cd /var/www/mocca-portal
git pull origin main
php artisan migrate --force
npm run build
php artisan config:cache
php artisan route:cache
```

## Documentation

- `docs/01_システム仕様書.md` - Full system specification
- `docs/02_実装計画書.md` - Implementation guide with code examples
- `docs/03_進捗管理.md` - Progress tracking and changelog
- `docs/04_引き継ぎ_*.md` - Handoff documents
