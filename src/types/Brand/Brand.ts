export interface BrandDto {
  id: string;
  storeId: string;
  name: string;
  shortName?: string;
  slug?: string;
  description?: string;
  country?: string;
  phone?: string; 
  postalCode?: string; 
  addresLine?: string;
  city?: string;
  email?: string;  
  isPublished: boolean;
  isDeleted: boolean;
  brandLangs: BrandLangDto[];
}
  
interface BrandLangDto {
  brandId: string;
  languageId: string;
  name: string;
  description: string;
}
