export interface WarehouseBrandDto {
  id?: string
  storeId: string
  brandId: string

  name: string

  warehouseName: string

  street: string
  number: string
  postCode: string
  city: string

  phone: string
  email: string
  personContact: string

  isPublished: boolean
}
