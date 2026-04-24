# Zara IDP Webpage

A read-only web portal for visualizing and interacting with the Zara IDP Control Plane.

## Overview

The Zara IDP Webpage provides a modern, intuitive interface for:

- **Dashboard**: Real-time overview of infrastructure health and status
- **Resources**: Browse and explore all managed resources
- **Teams**: View team ownership and on-call schedules
- **Approvals**: Review and approve/reject change requests (only write operation)
- **Audit Log**: Track all resource changes and system events
- **Freezes**: View active deployment freezes
- **Policies**: Manage runtime policies

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for build tooling
- **Tailwind CSS 4** for styling
- **Redux Toolkit** for state management
- **React Router 7** for navigation
- **Axios** for API communication
- **Lucide Icons** for iconography

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:3000` with hot module replacement enabled.

### Building for Production

```bash
# Build the production bundle
npm run build

# Preview the production build
npm run preview
```

### API Proxy

In development mode, the Vite dev server proxies `/api` requests to `http://localhost:8080` (the Zara API server).

## Project Structure

```
zara-idp-webpage/
├── src/
│   ├── api/              # API client and types
│   │   ├── client.ts     # Axios-based API client
│   │   └── index.ts
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Layout components (sidebar, header)
│   │   └── ui/           # Base UI components (Button, Card, Table, etc.)
│   ├── lib/              # Utilities and constants
│   │   ├── constants.ts  # Color configs, status mappings
│   │   └── utils.ts      # Helper functions
│   ├── pages/            # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── ResourcesPage.tsx
│   │   ├── TeamsPage.tsx
│   │   ├── ApprovalsPage.tsx
│   │   ├── AuditPage.tsx
│   │   ├── FreezesPage.tsx
│   │   └── PoliciesPage.tsx
│   ├── store/            # Redux store and slices
│   │   ├── index.ts      # Store configuration
│   │   ├── hooks.ts      # Typed hooks
│   │   └── slices/       # Feature slices
│   │       ├── resourcesSlice.ts
│   │       ├── namespacesSlice.ts
│   │       ├── teamsSlice.ts
│   │       ├── approvalsSlice.ts
│   │       ├── auditSlice.ts      # Also handles freezes and policies
│   │       └── dashboardSlice.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── api.ts        # API response types
│   │   └── index.ts
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles with Tailwind
├── public/               # Static assets
├── index.html            # HTML template
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Design Principles

### Read-Only by Default

The portal is designed as a **read-only interface** for viewing infrastructure state. The only write operation available is approving/rejecting change requests.

### Dark Theme

The UI uses a slate-based dark theme optimized for:
- Reduced eye strain during long monitoring sessions
- High contrast for status indicators
- Accessibility compliance

### Responsive Design

The portal is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px-1920px)
- Tablet (768px-1024px)
- Mobile (320px-768px)

## Features

### Dashboard
- Overall health summary with visual indicators
- Sync status overview
- Pending approvals count
- Active freezes warning
- Health by namespace breakdown
- Recent events timeline

### Resources
- Filterable resource list by kind, namespace, and health status
- Search functionality
- Resource detail view with events and dependencies
- Visual health and sync status badges

### Teams
- Team directory with contact information
- On-call schedule visibility
- Team member listings
- Resource ownership tracking

### Approvals
- Pending approvals queue
- Historical approvals (approved/rejected/expired)
- Change diff viewing
- Approve/Reject actions with comments

### Audit Log
- Comprehensive change history
- Actor and action tracking
- Success/failure/blocked status
- Metadata inspection

### Freezes
- Active freeze warnings
- Scope visualization (namespaces, teams, kinds)
- Freeze history

### Policies
- Runtime policy listing
- Trigger and action configuration viewing
- Scope and label selector visibility

## API Integration

The portal communicates with the Zara API server (`zara-idp-core`) which exposes:

```
GET  /api/v1/health
GET  /api/v1/ready
GET  /api/v1/resources[/:kind[/:namespace[/:name]]]
GET  /api/v1/namespaces[/:name]
GET  /api/v1/teams[/:name]
GET  /api/v1/approvals[/:id]
POST /api/v1/approvals/:id/approve  (only write endpoint)
POST /api/v1/approvals/:id/reject   (only write endpoint)
GET  /api/v1/audit[/:id]
GET  /api/v1/freezes[/:id]
GET  /api/v1/policies/runtime[/:namespace/:name]
GET  /api/v1/dashboard/summary
GET  /api/v1/dashboard/health
```

## Running with Backend

To run the full stack:

```bash
# Terminal 1: Start the backend (zara-idp-core)
cd ../zara-idp-core
make run-server  # Runs on http://localhost:8080

# Terminal 2: Start the frontend (zara-idp-webpage)
cd ../zara-idp-webpage
npm run dev      # Runs on http://localhost:3000
```

The Vite dev server automatically proxies API requests to the backend.

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript strict mode
3. Add appropriate type definitions
4. Keep components small and focused
5. Use Redux Toolkit patterns for state management

## License

This project is part of Zara IDP and follows the same license terms.
