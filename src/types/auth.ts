export type UserType = 'admin' | 'staff' | 'customer'

export type SessionUser = {
  id: number
  name: string
  email: string
  status: string
  last_login_at: string | null
}

export type AccountSession = {
  type: UserType
  user: SessionUser
}

export type LoginResponse = AccountSession & {
  message: string
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

export type LoginCredentials = {
  email: string
  password: string
  remember: boolean
}
