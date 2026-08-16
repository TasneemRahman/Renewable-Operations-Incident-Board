import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAlerts } from '../lib/api'
import { AlertsTable } from '../components/alerts/AlertsTable'
import { AlertDetailPanel } from '../components/alerts/AlertDetailPanel'
import { Command, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: DashboardPage })

function DashboardPage() {
  const [selectedSite, setSelectedSite] = React.useState('')
  const [selectedSeverity, setSelectedSeverity] = React.useState('')
  const [selectedStatus, setSelectedStatus] = React.useState('')
  const [selectedAlertId, setSelectedAlertId] = React.useState<string | null>(
    null,
  )
  const {
    data: alerts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAlerts({
    site: selectedSite || undefined,
    severity: (selectedSeverity as any) || undefined,
    status: (selectedStatus as any) || undefined,
  })

  React.useEffect(() => {
    if (!selectedAlertId && alerts.length > 0) setSelectedAlertId(alerts[0].id)
  }, [alerts, selectedAlertId])

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const highCount = alerts.filter((a) => a.severity === 'high').length
  const openCount = alerts.filter((a) => a.status === 'open').length
  const investigatingCount = alerts.filter(
    (a) => a.status === 'investigating',
  ).length
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length

  return (
    <div className="ops-shell flex flex-col">
      <main className="ops-main mx-auto w-full max-w-[1680px] flex-1 px-5 py-7">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-strong)] pb-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <span>Northstar</span>
              <span className="text-[var(--border-strong)]">/</span>
              <span className="text-[var(--foreground)]">Operations</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.03em]">
              Incident queue
            </h1>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Monitor and triage active signals across production services.
            </p>
          </div>
        </div>

        <section className="mb-6 grid border-y border-[var(--border)] bg-[var(--surface)] sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Critical / high"
            value={criticalCount + highCount}
            detail={`${criticalCount} critical · ${highCount} high`}
            tone="danger"
          />
          <Metric
            label="Open incidents"
            value={openCount}
            detail="Requires triage"
            tone="warning"
          />
          <Metric
            label="Investigating"
            value={investigatingCount}
            detail="Assigned to operators"
            tone="accent"
          />
          <Metric
            label="Resolved today"
            value={resolvedCount}
            detail="Closed incidents"
            tone="success"
          />
        </section>

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
            <h2 className="text-sm font-semibold">Live incident feed</h2>
            <span className="mono text-[10px] text-[var(--muted-foreground)]">
              {alerts.length} records
            </span>
          </div>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,.85fr)]">
          <AlertsTable
            data={alerts}
            isLoading={isLoading}
            selectedAlertId={selectedAlertId}
            onSelectAlert={setSelectedAlertId}
            selectedSite={selectedSite}
            onSiteChange={setSelectedSite}
            selectedSeverity={selectedSeverity}
            onSeverityChange={setSelectedSeverity}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
          <div className="lg:sticky lg:top-[78px]">
            <AlertDetailPanel
              alertId={selectedAlertId}
              onClose={() => setSelectedAlertId(null)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: number
  detail: string
  tone: 'danger' | 'warning' | 'accent' | 'success'
}) {
  return (
    <div className="relative border-b border-[var(--border)] p-4 last:border-b-0 sm:nth-[2n]:border-l lg:border-b-0 lg:border-l first:border-l-0">
      <span
        className={`absolute left-0 top-0 h-0.5 w-10 ${tone === 'danger' ? 'bg-[var(--danger)]' : tone === 'warning' ? 'bg-[var(--warning)]' : tone === 'success' ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`}
      />
      <div className="eyebrow">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="mono text-[24px] font-medium tracking-[-0.05em]">
          {value}
        </span>
        <span className="text-[11px] text-[var(--muted-foreground)]">
          {detail}
        </span>
      </div>
    </div>
  )
}
