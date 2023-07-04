export interface FileDTO {
    StoreId?: string;
    Base64File?: Base64File;
    Media: MediasDTO;
    BlobFolder: BlobFolder;
    Watermark: boolean;
}

export interface MediasDTO {
    SeoFileName: string;
    AltAttribute: string;
    TitleAttribute: string;
    MediaLangs: ProductMediaLangDTO[];
}

export interface ProductMediaLangDTO {
    LanguageId: string;
    SeoFileName: string;
    AltAttribute: string;
    TitleAttribute: string;
}

export interface Base64File {
    Base64String: string
}

export enum BlobFolder {
    Category = 0,
    Product = 1,
    BlogCategory = 2,
    BlogItem = 3,
  }