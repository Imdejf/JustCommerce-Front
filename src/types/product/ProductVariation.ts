export interface ProductVariationDTO {
    id: string;
    name: string;
    sku: string;
    gtin: string;
    price: number;
    oldPrice: number | null;
    thumbnailImage: MediaDTO | null;
    images: MediaDTO[] | null;
    optionCombinations: ProductOptionCombinationDTO[] | null;
  }
  
  export interface MediaDTO {
    productId: string | null;
    mediaId: string | null;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    filePath: string;
    displayOrder: number;
    productMediaLangs: ProductMediaLangDTO[];
  }
  
  export interface ProductMediaLangDTO {
    mediaId: string;
    languageId: string;
    filePath: string | null;
    seoFileName: string | null;
    altAttribute: string | null;
    titleAttribute: string | null;
  }
  
  export interface ProductOptionCombinationDTO {
    optionId: string;
    optionName: string;
    value: string;
    sortIndex: number;
    productOptionCombinationLangs: ProductOptionCombinationLang[]
  }
  
  export interface ProductOptionCombinationLang {
    productOptionCombinationId: string | null;
    languageId: string;
    value: string;
  }