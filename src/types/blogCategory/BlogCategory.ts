export interface BlogCategoryDTO {
    id: string;
    storeId: string;
    name: string;
    slug: string;
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    shortDescription: string;
    description: string;
    displayOrder: number;
    isPublished: boolean;
    isDeleted: boolean;
    thumbnailImageId: string;
    thumbnailImage?: MediaDTO | null;
    blogCategoryLangs?: BlogCategoryLangDTO[] | null;
  }
  
  interface BlogCategoryLangDTO {
    blogCategoryId: string;
    languageId: string;
    name: string;
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    shortDescription: string;
    description: string;
  }
  
  interface MediaDTO {
    id: string;
    filePath?: string | null;
    seoFileName?: string | null;
    altAttribute?: string | null;
    titleAttribute?: string | null;
    mediaLangs: MediaLangDTO[];
  }
  
  interface MediaLangDTO {
    mediaId: string;
    languageId: string;
    filePath?: string | null;
    seoFileName?: string | null;
    altAttribute?: string | null;
    titleAttribute?: string | null;
  }
  