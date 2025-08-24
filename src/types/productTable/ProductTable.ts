export type OfferItemTable = {
  productId: string | null;
  name: string;
  sku?: string | null;
  brandId?: string | null;
  quantity: number;
  priceNetto: number;
  priceGross: number;
  tax: number; // 23 itp.
  producerPriceNetto: number;
  totalPriceNetto: number;
  totalPriceGross: number;
  noteForProducer?: string | null;
  shippingRule?: any | null;
};

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