export interface ProductOptionDTO {
    id: string;
    storeId: string;
    name: string;
    productOptionLangs: ProductOptionLangDTO[];
  }
  
  interface ProductOptionLangDTO {
    productOptionId: string;
    languageId: string;
    name: string;
  }