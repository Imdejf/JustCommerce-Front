export interface CategoryDTO {
    id: string;
    slug: string;
    parentCategoryId: string | null;
    parentCategory: CategoryDTO | null;
    name: string;
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    shortDescription: string;
    description: string;
    gmcCategory: string;
    displayOrder: number;
    isPublished: boolean;
    includeInMenu: boolean;
    mostVisited: boolean;
    highlight: boolean;
    deleted: boolean;
    thumbnailImageId: string;
    thumbnailImage: MediaDTO;
    storeId: string;
    childCategories: CategoryDTO[];
    categoryLangs: CategoryLangDTO[];
    categoryBlogItems: CategoryBlogItemDTO[]; 
  }
  
  export interface CategoryLangDTO {
    name: string;
    shortDescription: string;
    description: string;
    metaKeywords: string;
    metaDescription: string;
    metaTitle: string;
    categoryId: string;
    languageId: string;
  }

  export interface CategoryBlogItemDTO {
    categoryId: string;
    blogId: string;
  }

  interface MediaDTO {
    id: string;
    filePath: string | null;
    seoFileName: string | null;
    altAttribute: string | null;
    titleAttribute: string | null;
    mediaLangs: MediaLangDTO[];
  }
  
  export interface MediaLangDTO {
    mediaId: string;
    languageId: string;
    filePath: string | null;
    seoFileName: string | null;
    altAttribute: string | null;
    titleAttribute: string | null;
  }
  