export const SYSTEM_ROLE_OPTIONS = [
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Seller', label: 'Sprzedawca' },
  { value: 'CustomerService', label: 'Obsługa klienta' },
  { value: 'Shipmenter', label: 'Magazynier' },
  { value: 'Accounting', label: 'Księgowość' },
  { value: 'Marketing', label: 'Marketing / Product Manager' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Boss', label: 'Boss' },
  { value: 'CopyWriter', label: 'CopyWriter' },
  { value: 'Customer', label: 'Klient (storefront)' }
] as const

export function roleLabel(code: string): string {
  return SYSTEM_ROLE_OPTIONS.find((x) => x.value === code)?.label ?? code
}
