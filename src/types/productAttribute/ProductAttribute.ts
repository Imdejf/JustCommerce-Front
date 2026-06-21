export interface ProductAttributeDTO {
    id: string;
    storeId: string;
    name: string;
    displayOrder: number;
    groupId: string;
    attributeGroup?: {
      id: string;
      storeId?: string;
      name: string;
    };
    productAttributeLangs: ProductAttributeLangDTO[];
  }
  
  export interface ProductAttributeLangDTO {
    productAttributeId: string;
    languageId: string;
    name: string;
  }