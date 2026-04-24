# Drift Detection and Reconciliation UI

## Overview

This document describes the frontend implementation for drift detection and resource reconciliation features in the Zara IDP Web Portal.

## Architecture

### Component Structure

```
zara-idp-webpage/
├── src/
│   ├── api/
│   │   └── client.ts                    # API client with drift/reconcile methods
│   ├── components/
│   │   └── ui/
│   │       └── DriftReportModal.tsx     # Drift report visualization component
│   ├── pages/
│   │   └── ResourcesPage.tsx            # Resources list with drift/reconcile actions
│   └── types/
│       └── api.ts                       # TypeScript types for drift/reconcile
```

## Features

### 1. Drift Detection

Users can detect configuration drift for any resource by clicking the "Detect Drift" button (GitCompare icon) in the Actions column.

**Flow:**
1. User clicks "Detect Drift" button for a resource
2. Frontend calls `GET /api/v1/resources/{id}/drift`
3. Backend analyzes desired vs observed state
4. DriftReportModal displays the results with:
   - Severity badge (NONE, LOW, MEDIUM, HIGH, CRITICAL)
   - Summary text
   - Detailed changes table showing:
     - Field name
     - Change type (ADDED, REMOVED, MODIFIED, MISMATCH)
     - Desired value
     - Observed value
     - Impact description
     - Individual change severity

### 2. Resource Reconciliation

Users can reconcile resources in two ways:

#### Direct Reconciliation
- Click "Reconcile" button (RefreshCw icon) in the Actions column
- Immediately triggers reconciliation without showing drift report

#### Reconcile from Drift Report
- After detecting drift, click "Reconcile Now" button in the DriftReportModal
- Modal closes and reconciliation starts
- Resources list refreshes automatically

**Flow:**
1. User triggers reconciliation
2. Frontend calls `POST /api/v1/resources/{id}/reconcile`
3. Backend starts reconciliation job
4. Success message shows job ID and status
5. Resources list refreshes

## Components

### DriftReportModal

A comprehensive modal component for displaying drift detection results.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Handler for closing the modal
- `driftReport: DriftReport | null` - Drift report data
- `onReconcile?: () => void` - Optional handler for reconciliation action
- `isReconciling?: boolean` - Shows loading state during reconciliation

**Features:**
- Color-coded severity badges
- Structured table for changes
- Responsive design with overflow handling
- Action buttons (Close, Reconcile Now)
- Loading state for reconciliation

### ResourcesPage Enhancements

The ResourcesPage now includes:

**New State:**
```typescript
const [isDriftModalOpen, setIsDriftModalOpen] = useState(false);
const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
const [isLoadingDrift, setIsLoadingDrift] = useState(false);
const [isReconciling, setIsReconciling] = useState(false);
const [driftError, setDriftError] = useState<string | null>(null);
```

**New Handlers:**
- `handleDetectDrift(resource)` - Fetches drift report and opens modal
- `handleReconcile(resource)` - Triggers reconciliation directly
- `handleReconcileFromModal()` - Reconciles from within drift modal
- `handleCloseDriftModal()` - Closes modal and clears state

**Action Buttons:**
Four buttons in the Actions column (left to right):
1. **Detect Drift** (GitCompare icon) - Opens drift report modal
2. **Reconcile** (RefreshCw icon) - Immediate reconciliation
3. **Edit** (Pencil icon) - Opens edit form
4. **Delete** (Trash2 icon) - Opens delete confirmation

## Types

### DriftReport
```typescript
interface DriftReport {
  resource_id: string;
  resource_kind: string;
  resource_name: string;
  resource_namespace: string;
  has_drift: boolean;
  severity: DriftSeverity;
  changes: DriftChange[];
  summary: string;
  detected_at: string;
}
```

### DriftSeverity
```typescript
type DriftSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
```

### ChangeType
```typescript
type ChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'MISMATCH';
```

### DriftChange
```typescript
interface DriftChange {
  field: string;
  desired: any;
  observed: any;
  changeType: ChangeType;
  impact: string;
  severity: DriftSeverity;
}
```

### ReconcileJobResponse
```typescript
interface ReconcileJobResponse {
  job_id: string;
  message: string;
  status: string;
}
```

## API Methods

### Detect Drift
```typescript
async detectDrift(resourceId: string): Promise<DriftReport>
```

**Endpoint:** `GET /api/v1/resources/{id}/drift`

**Returns:** Complete drift report with all detected changes

### Reconcile Resource
```typescript
async reconcileResource(resourceId: string): Promise<ReconcileJobResponse>
```

**Endpoint:** `POST /api/v1/resources/{id}/reconcile`

**Returns:** Job information with ID and status

## UI/UX Design

### Color Coding

**Severity Colors:**
- 🔴 **CRITICAL**: Red (`text-red-400`, `bg-red-900/20`)
- 🟠 **HIGH**: Orange (`text-orange-400`, `bg-orange-900/20`)
- 🟡 **MEDIUM**: Yellow (`text-yellow-400`, `bg-yellow-900/20`)
- 🟢 **LOW**: Green (`text-green-400`, `bg-green-900/20`)
- ⚪ **NONE**: Gray (`text-slate-400`, `bg-slate-900/50`)

**Change Type Colors:**
- 🟢 **ADDED**: Green (`text-green-400`)
- 🔴 **REMOVED**: Red (`text-red-400`)
- 🟡 **MODIFIED**: Yellow (`text-yellow-400`)
- 🟠 **MISMATCH**: Orange (`text-orange-400`)

### Responsive Design

- Modal uses `max-w-2xl` for optimal reading width
- Table has horizontal scroll for narrow viewports
- Values truncated with `max-w-xs` to prevent overflow
- Tooltip titles on action buttons for accessibility

## Error Handling

Errors are displayed in two ways:

1. **Inline Errors**: DriftReportModal shows errors within the modal
2. **Toast Notifications**: Fixed-position alert in bottom-right corner for async errors

Example:
```typescript
{driftError && (
  <div className="fixed bottom-4 right-4 max-w-md z-50">
    <Alert type="error" title="Error">
      {driftError}
    </Alert>
  </div>
)}
```

## Loading States

### Drift Detection Loading
- Button disabled during drift detection
- Loading indicator (could be added to button)

### Reconciliation Loading
- "Reconcile Now" button shows spinner icon
- Button text changes to "Reconciling..."
- Button disabled during operation

## Future Enhancements

1. **Toast Notifications**: Replace `alert()` with proper toast component
2. **Real-time Updates**: WebSocket support for reconciliation job status
3. **Drift History**: Show historical drift reports
4. **Batch Operations**: Select multiple resources for reconciliation
5. **Scheduled Reconciliation**: Configure auto-reconcile policies
6. **Diff Viewer**: Enhanced visualization with syntax highlighting
7. **Reconciliation Preview**: Show what will change before applying
8. **Undo Reconciliation**: Rollback to previous state

## Testing

### Manual Testing Checklist

- [ ] Click "Detect Drift" button for a resource with no drift
- [ ] Click "Detect Drift" button for a resource with drift
- [ ] Verify severity badge colors match drift level
- [ ] Verify all changes appear in the table
- [ ] Click "Reconcile Now" from drift modal
- [ ] Click "Reconcile" button directly from table
- [ ] Verify resources list refreshes after reconciliation
- [ ] Test error handling by reconciling non-existent resource
- [ ] Verify modal closes on Escape key
- [ ] Verify modal closes on backdrop click
- [ ] Test responsive layout on mobile viewport

### Integration Testing

Ensure the frontend works with the backend API:

```bash
# Start backend
cd zara-control-plane
go run cmd/zara-server/main.go

# Start frontend
cd zara-idp-webpage
npm run dev
```

## Accessibility

- Semantic HTML structure
- ARIA labels on icon buttons
- Keyboard navigation support (Escape to close)
- Focus management in modals
- Sufficient color contrast ratios
- Screen reader friendly table structure

## Browser Support

Tested and supported on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Related Documentation

- [TESTING_RECONCILIATION.md](../../zara-control-plane/docs/TESTING_RECONCILIATION.md) - Backend testing guide
- [CONTINUOUS_RECONCILIATION.md](../../zara-control-plane/docs/CONTINUOUS_RECONCILIATION.md) - Architecture overview
- [STATEOBSERVER.md](../../zara-control-plane/docs/STATEOBSERVER.md) - StateObserver interface design
