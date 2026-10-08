import {
  BarChart3,
  CalendarDays,
  Clock3,
  Home,
  PersonStanding,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AdminModule = {
  id: string
  label: string
  path: string
  icon: LucideIcon
}

export const ADMIN_MODULES: Array<AdminModule> = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: Home },
  {
    id: 'appointments',
    label: 'Appointments',
    path: '/admin/appointments',
    icon: Clock3,
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/admin/customers',
    icon: Users,
  },
  {
    id: 'services',
    label: 'Services',
    path: '/admin/services',
    icon: Sparkles,
  },
  {
    id: 'staff',
    label: 'Staff',
    path: '/admin/staff',
    icon: PersonStanding,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/admin/calendar',
    icon: CalendarDays,
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/admin/reports',
    icon: BarChart3,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  },
]

export function isActivePath(current: string, path: string): boolean {
  const normalized = current.replace(/\/+$/, '') || '/'
  return path === '/admin'
    ? normalized === '/admin'
    : normalized === path || normalized.startsWith(`${path}/`)
}
