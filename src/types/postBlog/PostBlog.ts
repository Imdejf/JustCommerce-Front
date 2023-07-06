export interface PostBlogDTO {
    id: string;
    name: string;
    slug: string;
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    shortDescription: string;
    description: string;
    author: string;
    isActive: boolean;
    isHomePage: boolean;
    displayOrder: number;
    createdOn: string;
    thumbnailImageId: string;
    thumbnailImage: Media;
    blogItemLangs: PostBlogLangDTO[];
  }
  
  interface Media {
    filePath?: string;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    displayOrder: number;
    mediaLangs: MediaLang[];
  }
  
  interface MediaLang {
    languageId: string;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    filePath?: string;
  }
  
  interface PostBlogLangDTO {
    blogItemId: string;
    languageId: string;
    name: string;
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    shortDescription: string;
    description: string;
  }