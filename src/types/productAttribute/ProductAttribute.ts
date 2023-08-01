export interface ProductAttributeDTO {
    id: string;
    storeId: string;
    name: string;
    displayOrder: number;
    groupId: string;
    productAttributeLangs: ProductAttributeLangDTO[];
  }
  
  interface ProductAttributeLangDTO {
    productAttributeId: string;
    languageId: string;
    name: string;
  }