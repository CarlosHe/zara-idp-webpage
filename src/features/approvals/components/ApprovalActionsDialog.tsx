import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from '@/shared/components/ui';

interface ApprovalActionsDialogProps {
  open: boolean;
  reason: string;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ApprovalActionsDialog({
  open,
  reason,
  submitting,
  onReasonChange,
  onCancel,
  onConfirm,
}: ApprovalActionsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Reject Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Reason for rejection"
            placeholder="Please provide a reason for rejecting this request..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={!reason.trim()}
              loading={submitting}
            >
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
