export interface ShippingRuleDTO {
    id: string;
    storeId: string;
    name: string;
    orderValue: number;
    active: boolean;
    combineProducts: boolean;
    shipmentPrice: number;
    partitioningForQuantity: boolean;
    conditionMinQuantity: number;
    conditionMaxQuantity: number;
    stackPallet: boolean;
    shipmentPricePallet: number;
    conditionMinForQuantityPallet: number;
    conditionMaxForQuantityPallet: number;
    isDefault: boolean;
  }