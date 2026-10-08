import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import './styles.css'
import { AppProviders } from './AppProviders'
import reportWebVitals from './reportWebVitals'
import HomePage from '@/routes/HomePage'
import StatusPage from '@/routes/StatusPage'
import AdminLayout from '@/routes/admin/AdminLayout'
import AppointmentsPage from '@/routes/admin/AppointmentsPage'
import CalendarPage from '@/routes/admin/CalendarPage'
import CustomersPage from '@/routes/admin/CustomersPage'
import DashboardPage from '@/routes/admin/DashboardPage'
import ReportsPage from '@/routes/admin/ReportsPage'
import ServicesPage from '@/routes/admin/ServicesPage'
import SettingsPage from '@/routes/admin/SettingsPage'
import StaffPage from '@/routes/admin/StaffPage'
import { isIsoDate } from '@/lib/calendar'
import { authService } from '@/services/authService'

document.title = import.meta.env.VITE_APP_TITLE || 'BASMS'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (authService.isAdmin()) {
      throw redirect({ to: '/admin' })
    }
  },
  component: HomePage,
})

const statusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/status',
  component: StatusPage,
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => {
    if (!authService.isAdmin()) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: DashboardPage,
})

const adminAppointmentsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'appointments',
  // Raw params are merged over by the result, so invalid ones must be
  // overwritten with `undefined` rather than omitted.
  validateSearch: (search: Record<string, unknown>): { new?: boolean } => ({
    new: search.new === true || search.new === 'true' ? true : undefined,
  }),
  component: AppointmentsPage,
})

const adminCalendarRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'calendar',
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: isIsoDate(search.date) ? search.date : undefined,
  }),
  component: CalendarPage,
})

const adminCustomersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'customers',
  component: CustomersPage,
})

const adminServicesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'services',
  component: ServicesPage,
})

const adminStaffRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'staff',
  component: StaffPage,
})

const adminReportsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'reports',
  validateSearch: (
    search: Record<string, unknown>,
  ): { from?: string; to?: string } => {
    const valid =
      isIsoDate(search.from) && isIsoDate(search.to) && search.from <= search.to
    return {
      from: valid ? (search.from as string) : undefined,
      to: valid ? (search.to as string) : undefined,
    }
  },
  component: ReportsPage,
})

const SETTINGS_TABS = ['payments', 'notifications'] as const

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: 'settings',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: (typeof SETTINGS_TABS)[number] } => ({
    tab: SETTINGS_TABS.find((t) => t === search.tab),
  }),
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  statusRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminAppointmentsRoute,
    adminCalendarRoute,
    adminCustomersRoute,
    adminServicesRoute,
    adminStaffRoute,
    adminReportsRoute,
    adminSettingsRoute,
  ]),
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

reportWebVitals()
