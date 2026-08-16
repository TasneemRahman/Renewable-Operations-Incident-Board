import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'open' | 'investigating' | 'resolved'

export interface Alert {
  id: string
  site: string
  timestamp: string | number | Date
  type: string
  severity: AlertSeverity
  description: string
  status: AlertStatus
}

export interface LinkedOperationalEvent {
  id: string
  site: string
  timestamp: string | number | Date
  source: string
  type: string
  message: string
  payload: Record<string, any>
  role: 'trigger' | 'context'
}

export interface FollowUpNote {
  id: string
  alertId: string
  text: string
  createdAt: string | number | Date
}

export interface AlertDetail extends Alert {
  events: LinkedOperationalEvent[]
  notes: FollowUpNote[]
}

export interface IncidentExplanation {
  summary: string
  likelyTrigger?: string
  evidence: Array<{
    eventId: string
    statement: string
  }>
  suggestedChecks: string[]
  confidence: 'low' | 'medium' | 'high'
  caveat?: string
}

const API_BASE = 'http://localhost:8080/api'

export interface AlertFilters {
  site?: string
  severity?: AlertSeverity
  status?: AlertStatus
}

export async function fetchAlerts(filters?: AlertFilters): Promise<Alert[]> {
  const params = new URLSearchParams()
  if (filters?.site) params.set('site', filters.site)
  if (filters?.severity) params.set('severity', filters.severity)
  if (filters?.status) params.set('status', filters.status)

  const url = `${API_BASE}/alerts${params.toString() ? `?${params.toString()}` : ''}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: ${res.statusText}`)
  }
  return res.json()
}

export async function fetchAlertDetail(id: string): Promise<AlertDetail> {
  const res = await fetch(`${API_BASE}/alerts/${id}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch alert detail for ${id}: ${res.statusText}`)
  }
  return res.json()
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
): Promise<Alert> {
  const res = await fetch(`${API_BASE}/alerts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    throw new Error(`Failed to update status: ${res.statusText}`)
  }
  return res.json()
}

export async function addAlertNote(
  id: string,
  text: string,
): Promise<FollowUpNote> {
  const res = await fetch(`${API_BASE}/alerts/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    throw new Error(`Failed to add note: ${res.statusText}`)
  }
  return res.json()
}

export async function explainAlert(id: string): Promise<IncidentExplanation> {
  const res = await fetch(`${API_BASE}/alerts/${id}/explain`, {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`Failed to generate AI explanation: ${res.statusText}`)
  }
  return res.json()
}

// React Query Hooks

export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => fetchAlerts(filters),
    refetchInterval: 10000,
  })
}

export function useAlertDetail(id: string | null) {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: () => (id ? fetchAlertDetail(id) : null),
    enabled: !!id,
  })
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      updateAlertStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alert', variables.id] })
    },
  })
}

export function useAddAlertNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      addAlertNote(id, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alert', variables.id] })
    },
  })
}

export function useExplainAlert() {
  return useMutation({
    mutationFn: (id: string) => explainAlert(id),
  })
}
