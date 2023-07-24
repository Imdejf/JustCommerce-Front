export interface FileDTO {
    id?: string;
    storeId?: string;
    base64File?: Base64File;
    media: MediasDTO;
    blobFolder: BlobFolder;
    watermark: boolean;
    thumbnail: boolean;
}

export interface MediasDTO {
    seoFileName: string;
    altAttribute: string;
    filePath: string;
    titleAttribute: string;
    mediaLangs: ProductMediaLangDTO[];
}

export interface MediaFileDTO {
    id?: string;
    storeId?: string;
    base64File?: Base64File;
    media: MediaTableDTO;
    blobFolder: BlobFolder;
    watermark: boolean;
}


export interface MediaTableDTO {
    id:string;
    filePath: string;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    mediaLangs: ProductMediaLangDTO[];
    displayOrder: number;
}

export interface ProductMediaLangDTO {
    languageId: string;
    seoFileName: string;
    altAttribute: string;
    titleAttribute: string;
    filePath: string;
}

export interface Base64File {
    base64String: string
}

export enum BlobFolder {
    Category = 0,
    Product = 1,
    BlogCategory = 2,
    BlogItem = 3,
}
