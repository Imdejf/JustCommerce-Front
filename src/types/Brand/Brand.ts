export interface BrandDto {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
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
