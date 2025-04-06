export interface OfferItemTable {
    productId: string;
    quantity: number;
    priceNetto: number;
    priceGross: number;
    tax: number;
    producerPriceNetto: number;
    totalPriceNetto: number;
    totalPriceGross: number;
    shippingRule?: ShippingRule | null;
  }

  export interface ShippingRule {
    shippingRuleId: string;
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
  }