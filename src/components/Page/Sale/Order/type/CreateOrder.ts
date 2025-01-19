export interface CreateOrder {
    StoreId: string;
    CustomerId: string;
    LanguageId: string;
    CreatedById: string;
    BillingAddress: Address;
    ShippingAddress?: Address | null;
    DeliveryMethod: DeliveryMethodType;
    OrderStatus: OrderStatus;
    OrderSourceType: OrderSourceType;
    PaymentStatus: PaymentStatus;
    PaymentProvider: PaymentProvider;
    PaymentTerm?: PaymentTerm | null;
    OrderNoteForClient: string | null;
    OrderNoteForCustomer: string | null;
    OrderNoteOnInvoice: string | null;
    ShippingFeeAmountNetto: number;
    RealShippingFeeAmountNetto: number;
    ShippingFeeAmountGross: number;
    RealShippingFeeAmountGross: number;
    SubTotalGross: number;
    UseShippingAddressAsBillingAddress: boolean;
    IsPaid: boolean;
    Products: OrderItem[];
}

export interface OrderItem {
    Id: string;
    PriceNetto: number;
    Tax: number;
    Quantity: number;
    NoteForProducer: string;
    ProducerPriceNetto: number;
    ShippingPriceNetto: number;
    ShippingPriceGross: number;
    RealShippingFeeAmountNetto: number;
    RealShippingFeeAmountGross: number;
}

export interface Address {
    IsCompany: boolean;
    FirstName: string;
    LastName: string;
    Email?: string | null;
    CompanyName?: string | null;
    Nip?: string | null;
    Phone?: string | null;
    AddressLine1: string;
    City: string;
    ZipCode: string;
    StateOrProvinceId: string;
    CountryId: string;
}

export enum DeliveryMethodType {
    Courier = "Courier",
    PickUpOwn = "PickUpOwn"
}

export enum OrderStatus {
    New = 1,
    OnHold = 10,
    InProgress = 20,
    Shipped = 30,
    Complete = 40,
    Canceled = 50,
    Refunded = 60,
    Closed = 70,
    OverduePayment = 80,
    WorkOrder = 100
}

export enum OrderSourceType {
    Cart = 0,
    RegularCustomer = 1,
    Offer = 2,
    Phone = 3,
    Chat = 4,
    Email = 5
}

export enum PaymentStatus {
    PendingPayment = 10,
    PaymentReceived = 20,
    PaymentFailed = 30
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