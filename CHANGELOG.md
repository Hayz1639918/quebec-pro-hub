# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Interactive map feature for projects and professionals discovery
- Automatic geocoding from postal codes using OpenStreetMap Nominatim API
- Contract templates following APCHQ/RBQ standards
- PDF export for tenders and proposals

### Changed
- Internationalized platform (removed Quebec-specific references for global reach)
- Improved map controls (drag, zoom, scroll)

## [1.4.0] - 2025-01-28

### Added
- Full i18n support with `react-i18next` (FR/EN)
- Professional tender (appel d'offres) and proposal system
- PDF generation for professional documents
- Real-time messaging with Supabase Realtime
- Notification system with action URLs
- Favorites system for professionals and projects

### Changed
- Dashboard UI improvements
- Enhanced messaging with read receipts and pagination
- Better error handling throughout the application

### Fixed
- Message badge showing for sent messages
- Notification redirect links
- RBQ verification redirect logic

## [1.3.0] - 2025-01-13

### Added
- Complete Supabase configuration guide (`docs/supabase-setup.md`)
- Troubleshooting section for common issues
- Security best practices documentation

### Changed
- Improved `.gitignore` to prevent committing secrets
- Enhanced README with clearer quick start instructions

### Fixed
- Supabase URL formatting issues
- RLS policy for profile insertion
- TypeScript typing errors with Supabase client

## [1.2.0] - 2025-01-13

### Added
- **Projects Marketplace** (`/projects`)
  - Real-time search and filtering
  - Category, region, and budget filters
  - Sort by recency, budget, or proposals count
  - Status badges (Open, In Progress, Completed, Cancelled)

- **Professionals Marketplace** (`/professionals`)
  - RBQ verification badges
  - Experience and ratings display
  - Service and region filtering

- **Database migrations**
  - `003_create_projects_table.sql` - Projects and proposals tables
  - Automatic triggers for proposals count
  - View counter function

### Changed
- Enhanced navigation with marketplace links
- Improved Hero and CTA components

## [1.1.0] - 2025-01-13

### Added
- **Authentication system**
  - Client and Professional registration forms
  - RBQ certification upload for professionals
  - OAuth Google authentication
  - Row Level Security policies

- **Database schema**
  - `profiles` table with user types
  - `certifications` storage bucket
  - `reviews` and `portfolio_items` tables

- **Security**
  - Storage policies for certifications
  - Input validation (client and server-side)
  - File type and size restrictions

## [1.0.0] - 2025-01-12

### Added
- Initial project setup with Vite + React + TypeScript
- Tailwind CSS + shadcn/ui component library
- Supabase integration for backend
- Landing page with Hero, Features, and CTA sections
- Basic routing with React Router
- TanStack Query for data fetching

---

[Unreleased]: https://github.com/your-org/batirnet/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/your-org/batirnet/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/your-org/batirnet/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/your-org/batirnet/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/your-org/batirnet/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-org/batirnet/releases/tag/v1.0.0
