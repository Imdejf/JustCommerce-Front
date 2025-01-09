export interface ProductOrder {
    Id: string;
    Name: string;
    IdentificationCode?: string | null;
    Quantity: number;
    PriceNetto: number;
    ShippingPriceNetto: number;
    ShippingPriceGross: number;
    ProducerPrice?: number | null;
    Tax?: number | null;
    ShippingRule: ShippingRule;
    NoteForProducer?: string
}

interface ShippingRule {
    ShippingRuleId: string;
    Name: string;
    OrderValue: number;
    Active: boolean;
    CombineProducts: boolean;
    ShipmentPrice: number;
    PartitioningForQuantity: boolean;
    ConditionMinQuantity: number;
    ConditionMaxQuantity: number;
    StackPallet: boolean;
    ShipmentPricePallet: number;
    ConditionMinForQuantityPallet: number;
    ConditionMaxForQuantityPallet: number;
}