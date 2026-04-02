"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderCode = generateOrderCode;
exports.generateCustomerCode = generateCustomerCode;
function generateOrderCode(counter) {
    const year = new Date().getFullYear();
    const padded = String(counter).padStart(5, '0');
    return `DH-${year}-${padded}`;
}
function generateCustomerCode(counter) {
    const padded = String(counter).padStart(3, '0');
    return `KH-${padded}`;
}
//# sourceMappingURL=generate-code.util.js.map