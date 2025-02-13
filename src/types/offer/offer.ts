export interface OfferDTO {
    id: string;
    languageId: string;
    storeId: string;
    createdOn: string; // DateTimeOffset jako string (ISO format)
    latestUpdatedOn: string;
    shippingAddress?: Address;
    billingAddress?: Address;
    offerNumber: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    shippingPrice?: number;
    shippingPriceGross?: number;
    totalItemPrice?: number;
    totalItemPriceGross?: number;
    totalPrice?: number;
    totalPriceGross?: number;
    realizationTerm?: string;
    offerNote?: string;
    comment: string;
    sendToClient: boolean;
    useShippingAddressAsBillingAddress: boolean;
    sendToClientDate?: string;
    expirationTime: string;
    offerStatus: OfferStatus;
    deliveryMethod: DeliveryMethodType;
    payment: PaymentProvider;
    paymentTerm: PaymentTerm;
    createdById: string;
    offerItems: OfferItem[];
  }
  
  export interface OfferItem {
    productId: string;
    quantity: number;
    priceNetto: number;
    priceGross: number;
    tax: number;
    producerPriceNetto: number;
    totalPriceNetto: number;
    totalPriceGross: number;
  }
  
  export interface Address {
    isCompany: boolean;
    firstName: string;
    lastName: string;
    email?: string;
    companyName?: string;
    nip?: string;
    phone?: string;
    addressLine1: string;
    city: string;
    zipCode: string;
    stateOrProvinceId: string;
    countryId: string;
  }
  
  // ENUMY
  
  export enum OfferStatus {
    PendingShipment = "PendingShipment",
    ShippedToCustomer = "ShippedToCustomer",
    WaitingForDecision = "WaitingForDecision",
    Completed = "Completed",
    Rejected = "Rejected",
    Canceled = "Canceled"
  }
  
  export enum DeliveryMethodType {
    Courier = "Courier",
    PickUpOwn = "PickUpOwn"
  }
  
  export enum PaymentProvider {
    Przelewy24 = 0,
    StandardTransfer = 1,
    CashOnDelivery = 2,
    PayPo = 3,
    Blik = 4,
    Term = 5
  }
  
  export enum PaymentTerm {
    SevenDays = 0,
    FourteenDays = 1,
    TweentyOneDays = 2,
    ThirtyDays = 3,
    SixtyDays = 4,
    NinetyDays = 5,
    None = 99
  }