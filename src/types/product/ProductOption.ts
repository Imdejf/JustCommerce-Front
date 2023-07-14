export interface ProductOptionDTO {
    optionId: string;
    name: string;
    displayType: DisplayType;
    values: ProductOptionValueDTO[];
  }
  
export interface ProductOptionValueDTO {
    key: string;
    display: string;
    productOptionValueLangs: ProductOptionValueLangDTO[];
  }
  
export interface ProductOptionValueLangDTO {
    productOptionValueId: string;
    languageId: string;
    key: string;
    display: string;
  }
  
export enum DisplayType {
    Text = 0,
    Color = 1,
  }