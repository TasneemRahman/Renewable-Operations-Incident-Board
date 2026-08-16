import * as React from 'react'
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table/legacy'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import type { Alert } from '../../lib/api'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ArrowUpDown, Search, Activity, X } from 'lucide-react'

interface AlertsTableProps {
  data: Alert[]
  isLoading: boolean
  selectedAlertId: string | null
  onSelectAlert: (id: string) => void
  selectedSite: string
  onSiteChange: (site: string) => void
  selectedSeverity: string
  onSeverityChange: (severity: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
}

export function AlertsTable({
  data,
  isLoading,
  selectedAlertId,
  onSelectAlert,
  selectedSite,
  onSiteChange,
  selectedSeverity,
  onSeverityChange,
  selectedStatus,
  onStatusChange,
}: AlertsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'timestamp', desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const columns = React.useMemo<ColumnDef<Alert>[]>(
    () => [
      {
        accessorKey: 'severity',
        size: 92,
        header: ({ column }) => (
          <SortHeader column={column}>Severity</SortHeader>
        ),
        cell: ({ row }) => (
          <Badge variant={row.getValue('severity')} dot>
            {String(row.getValue('severity')).toUpperCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'site',
        size: 86,
        header: ({ column }) => <SortHeader column={column}>Site</SortHeader>,
        cell: ({ row }) => (
          <span className="mono text-[11px] font-medium text-[var(--foreground)]">
            {row.getValue('site')}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: () => <span className="eyebrow">Signal</span>,
        cell: ({ row }) => (
          <div className="min-w-[180px] py-0.5">
            <div className="text-xs font-semibold capitalize">
              {row.original.type.replace(/_/g, ' ')}
            </div>
            <div className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted-foreground)]">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        size: 112,
        header: ({ column }) => <SortHeader column={column}>Status</SortHeader>,
        cell: ({ row }) => (
          <Badge variant={row.getValue('status')} dot>
            {String(row.getValue('status'))}
          </Badge>
        ),
      },
      {
        accessorKey: 'timestamp',
        size: 84,
        header: ({ column }) => <SortHeader column={column}>Time</SortHeader>,
        cell: ({ row }) => {
          const raw = row.getValue('timestamp')
          return (
            <span className="mono text-[10px] text-[var(--muted-foreground)]">
              {raw.includes('T') ? raw.split('T')[1].slice(0, 8) : raw}
            </span>
          )
        },
      },
    ],
    [],
  )
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  const sites = React.useMemo(
    () => Array.from(new Set(data.map((d) => d.site))),
    [data],
  )
  const hasActiveFilters = Boolean(
    selectedSite || selectedSeverity || selectedStatus || globalFilter,
  )
  return (
    <section className="min-w-0 overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-raised)] p-3">
        <div className="relative min-w-[190px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search incidents"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Filter
          value={selectedSite}
          onChange={onSiteChange}
          options={sites}
          label="All sites"
        />
        <Filter
          value={selectedSeverity}
          onChange={onSeverityChange}
          options={['critical', 'high', 'medium', 'low']}
          label="Severity"
        />
        <Filter
          value={selectedStatus}
          onChange={onStatusChange}
          options={['open', 'investigating', 'resolved']}
          label="Status"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSiteChange('')
              onSeverityChange('')
              onStatusChange('')
              setGlobalFilter('')
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.column.columnDef.size }}
                  className="px-3 py-2.5"
                >
                  <span className="text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-xs text-[var(--muted-foreground)]"
                >
                  <Activity className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Loading live incident data
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-xs text-[var(--muted-foreground)]"
                >
                  No incidents match the current view.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const selected = row.original.id === selectedAlertId
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectAlert(row.original.id)}
                    className={`group cursor-pointer border-l-2 transition-colors ${selected ? 'border-l-[var(--accent)] bg-[var(--surface-muted)]' : 'border-l-transparent hover:bg-[var(--surface-raised)]'}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-[10px] text-[var(--muted-foreground)]">
        <span>
          {table.getRowModel().rows.length} of {data.length} incidents
        </span>
        <span className="mono">
          {selectedAlertId ? selectedAlertId.slice(0, 8) : 'NO SELECTION'}
        </span>
      </div>
    </section>
  )
}

function SortHeader({
  column,
  children,
}: {
  column: any
  children: React.ReactNode
}) {
  return (
    <button
      className="eyebrow flex items-center gap-1 hover:text-[var(--foreground)]"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="h-3 w-3 opacity-60" />
    </button>
  )
}
function Filter({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-[3px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-[11px] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  )
}
