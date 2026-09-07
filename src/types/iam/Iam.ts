export type SystemRoleCode =
  | 'Customer'
  | 'Seller'
  | 'Shipmenter'
  | 'CopyWriter'
  | 'Manager'
  | 'Boss'
  | 'Administrator'
  | 'Developer'
  | 'CustomerService'
  | 'Accounting'
  | 'Marketing'

export interface SystemRoleDto {
  code: SystemRoleCode | string
  name: string
  permissionCodes: string[]
}

export interface PermissionDto {
  permissionCode: string
  permissionName: string
  description: string
  role: SystemRoleCode | string
}

export interface SystemUserListItemDto {
  id: string
  username: string
  email: string
  active: boolean
  isSystemAccount: boolean
  roles: string[]
  dateCreated: string
}

export interface SystemUserDto extends SystemUserListItemDto {
  storeId: string
  languageId: string
  permissionCodes: string[]
}

export interface CreateSystemUserRequest {
  username: string
  email: string
  password: string
  storeId: string
  languageId: string
  isSystemAccount: boolean
  active: boolean
  roles: string[]
}

export interface UpdateSystemUserRequest {
  id: string
  username: string
  email: string
  isSystemAccount: boolean
  active: boolean
  roles: string[]
}

export interface SetUserPasswordRequest {
  newPassword: string
}

export interface UpdateRolePermissionsRequest {
  permissionCodes: string[]
}
