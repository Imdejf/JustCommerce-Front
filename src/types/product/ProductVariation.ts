export interface ProductVariationDTO {
    id: string;
    name: string;
    sku: string;
    gtin: string;
    identificationCode: string | null;
    price: number;
    oldPrice: number | null;
    producerPrice: number | null;
    thumbnailImage: MediaDTO | null;
    images: MediaDTO[] | null;
    optionCombinations: ProductOptionCombinationDTO[] | null;
    productVariationLangs: ProductVariationLang[]
  }

  export interface ProductVariationLang
  {
      languageId: string;
      name: string;
  }

  
  export interface MediaDTO {
    productId: string | null;
    mediaId: string | null;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    filePath: string;
    displayOrder: number;
    mediaLangs: ProductMediaLangDTO[];
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