import * as React from 'react'
import type { AlertStatus, IncidentExplanation } from '../../lib/api'
import {
  useAlertDetail,
  useUpdateAlertStatus,
  useAddAlertNote,
  useExplainAlert,
} from '../../lib/api'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Sparkles,
  CheckCircle2,
  Activity,
  Layers,
  FileText,
  X,
  AlertTriangle,
  Send,
  ShieldAlert,
  Clock3,
} from 'lucide-react'

export function AlertDetailPanel({
  alertId,
  onClose,
}: {
  alertId: string | null
  onClose: () => void
}) {
  const { data: alert, isLoading } = useAlertDetail(alertId)
  const updateStatusMutation = useUpdateAlertStatus()
  const addNoteMutation = useAddAlertNote()
  const explainMutation = useExplainAlert()
  const [noteText, setNoteText] = React.useState('')
  const [explanation, setExplanation] =
    React.useState<IncidentExplanation | null>(null)
  React.useEffect(() => {
    setExplanation(null)
    setNoteText('')
  }, [alertId])
  if (!alertId) return <EmptyDetail />
  if (isLoading || !alert)
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted-foreground)]">
        <Activity className="mr-2 h-4 w-4 animate-spin" /> Loading incident
        details
      </div>
    )
  const handleStatusChange = (status: AlertStatus) =>
    updateStatusMutation.mutate({ id: alertId, status })
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    addNoteMutation.mutate(
      { id: alertId, text: noteText.trim() },
      { onSuccess: () => setNoteText('') },
    )
  }
  return (
    <section className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] text-xs">
      <div className="border-b border-[var(--border)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={alert.severity} dot>
                {alert.severity.toUpperCase()}
              </Badge>
              <Badge variant={alert.status} dot>
                {alert.status}
              </Badge>
              <span className="mono text-[10px] text-[var(--muted-foreground)]">
                {alert.site}
              </span>
            </div>
            <h2 className="text-[15px] font-semibold capitalize tracking-[-0.015em]">
              {alert.type.replace(/_/g, ' ')}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X />
          </Button>
        </div>
        <p className="max-w-prose leading-relaxed text-[var(--muted-foreground)]">
          {alert.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-3">
          <span className="eyebrow mr-2">Change state</span>
          {(['open', 'investigating', 'resolved'] as AlertStatus[]).map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={alert.status === status ? 'default' : 'outline'}
                onClick={() => handleStatusChange(status)}
                disabled={updateStatusMutation.isPending}
              >
                {status}
              </Button>
            ),
          )}
        </div>
      </div>
      <DetailSection
        icon={<Sparkles />}
        title="Operator analysis"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              explainMutation.mutate(alertId, { onSuccess: setExplanation })
            }
            disabled={explainMutation.isPending}
          >
            {explainMutation.isPending ? (
              <Activity className="animate-spin" />
            ) : (
              <Sparkles />
            )}{' '}
            {explainMutation.isPending ? 'Working' : 'Analyze'}
          </Button>
        }
      >
        {explanation ? (
          <div className="space-y-3">
            <div className="border-l-2 border-[var(--info)] bg-[var(--surface-muted)] p-3">
              <div className="eyebrow mb-2">
                Summary · confidence {explanation.confidence}
              </div>
              <p className="leading-relaxed">{explanation.summary}</p>
            </div>
            {explanation.likelyTrigger && (
              <div className="flex gap-2 border border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[var(--warning-soft)] p-2.5 text-[var(--warning-text)]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{explanation.likelyTrigger}</span>
              </div>
            )}
            {explanation.suggestedChecks.length > 0 && (
              <div>
                <div className="eyebrow mb-2">Recommended verification</div>
                <div className="space-y-1">
                  {explanation.suggestedChecks.map((check, i) => (
                    <div
                      key={i}
                      className="flex gap-2 border-b border-[var(--border)] py-1.5"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {explanation.caveat && (
              <p className="text-[10px] italic text-[var(--muted-foreground)]">
                {explanation.caveat}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Run analysis to correlate this signal with prior telemetry
            sequences.
          </p>
        )}
      </DetailSection>
      <DetailSection
        icon={<Layers />}
        title={`Telemetry evidence · ${alert.events.length}`}
        meta="Chronological"
      >
        <div className="relative space-y-2 pl-3 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-[var(--border)]">
          {alert.events.map((event) => {
            const trigger = event.role === 'trigger'
            const time = new Date(event.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
            return (
              <div
                key={event.id}
                className="relative border-b border-[var(--border)] pb-2 pl-3 last:border-0"
              >
                <span
                  className={`absolute -left-[1px] top-1.5 h-2 w-2 rounded-full border-2 border-[var(--surface)] ${trigger ? 'bg-[var(--danger)]' : 'bg-[var(--info)]'}`}
                />
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="mono text-[10px] font-medium">
                    {event.source}{' '}
                    <span className="text-[var(--muted-foreground)]">
                      /{event.type}
                    </span>
                    {trigger && (
                      <span className="ml-1 text-[var(--danger)]">TRIGGER</span>
                    )}
                  </span>
                  <span className="mono text-[10px] text-[var(--muted-foreground)]">
                    {time}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                  {event.message}
                </p>
                {Object.keys(event.payload).length > 0 && (
                  <div className="mt-1 break-all border-t border-[var(--border)] pt-1 font-mono text-[10px] text-[var(--muted-foreground)]">
                    {JSON.stringify(event.payload)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DetailSection>
      <DetailSection
        icon={<FileText />}
        title={`Operator notes · ${alert.notes.length}`}
      >
        <form onSubmit={handleAddNote} className="mb-3 flex gap-2">
          <Input
            placeholder="Add investigation note"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            disabled={addNoteMutation.isPending || !noteText.trim()}
          >
            <Send /> Add
          </Button>
        </form>
        {alert.notes.length === 0 ? (
          <p className="text-[11px] italic text-[var(--muted-foreground)]">
            No notes recorded for this incident.
          </p>
        ) : (
          <div className="space-y-2">
            {alert.notes.map((note) => (
              <div
                key={note.id}
                className="border-l-2 border-[var(--border-strong)] pl-3"
              >
                <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                  <span>Technician note</span>
                  <span className="mono">
                    <Clock3 className="mr-1 inline h-3 w-3" />
                    {new Date(note.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p>{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </DetailSection>
    </section>
  )
}

function DetailSection({
  icon,
  title,
  meta,
  action,
  children,
}: {
  icon: React.ReactNode
  title: string
  meta?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[var(--border)] p-4 last:border-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted-foreground)] [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
          </span>
          <h3 className="text-xs font-semibold">{title}</h3>
          {meta && <span className="eyebrow">{meta}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
function EmptyDetail() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
      <ShieldAlert className="mb-3 h-6 w-6 text-[var(--muted-foreground)]" />
      <h3 className="text-xs font-semibold">No incident selected</h3>
      <p className="mt-2 max-w-[220px] text-[11px] leading-relaxed text-[var(--muted-foreground)]">
        Select an incident from the queue to inspect its telemetry, analysis,
        and operator notes.
      </p>
    </div>
  )
}
