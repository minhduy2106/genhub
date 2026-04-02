export declare class PosOrderItemDto {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
}
export declare class PosPaymentDto {
    method: string;
    amount: number;
}
export declare class CreatePosOrderDto {
    customerId?: string;
    items: PosOrderItemDto[];
    payments: PosPaymentDto[];
    discountAmount?: number;
    discountType?: string;
    couponCode?: string;
    customerNote?: string;
    shiftId?: string;
}
