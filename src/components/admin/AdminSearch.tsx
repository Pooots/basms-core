import { createContext, useContext } from 'react'

type AdminSearchValue = {
  query: string
  setQuery: (value: string) => void
}

/** Top-bar search text, shared with the active admin page. */
export const AdminSearchContext = createContext<AdminSearchValue>({
  query: '',
  setQuery: () => {},
})

export function useAdminSearch(): AdminSearchValue {
  return useContext(AdminSearchContext)
}
