import { ProductOptionDTO } from "./ProductOption";
export interface ProductDTO {
    id: string;
    currentUserId: string;
    storeId: string;
    price: number;
    oldPrice?: number;
    specialPrice?: number;
    specialPriceStart?: string;
    specialPriceEnd?: string;
    isCallForPricing: boolean;
    isAllowToOrder: boolean;
    isBestseller: boolean;
    isHomePage: boolean;
    isNew: boolean;
    isSales: boolean;
    name: string;
    slug: string;
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    sku: string;
    gtin: string;
    shortDescription: string;
    description: string;
    specification: string;
    isPublished: boolean;
    isFeatured: boolean;
    stockTrackingIsEnabled: boolean;
    taxId?: string;
    vendorId?: string;
    brandId?: string;
    productLangs: ProductLangDTO[];
    thumbnailImage: MediaDTO;
    medias: MediaDTO[];
    options: ProductOptionDTO[];
    productOptionCombinations: ProductOptionCombinationDTO[];
  }
  
  interface ProductLangDTO {
    languageId: string;
    name: string;
    normalizedName: string;
    shortDescription: string;
    description: string;
    specification: string;
    metaKeywords: string;
    metaDescription: string;
  }
  
  interface MediaDTO {
    id: string;
    base64File: string;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    filePath?: string;
    displayOrder: number;
    mediaLangs: ProductMediaLangDTO[];
  }
  
  interface ProductMediaLangDTO {
    languageId: string;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    filePath?: string;
  }

  interface ProductOptionCombinationDTO {
    optionId: string;
    optionName: string;
    value: string;
    sortIndex: number;
  }