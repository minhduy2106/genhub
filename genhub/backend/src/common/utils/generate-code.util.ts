export function generateOrderCode(counter: number): string {
  const year = new Date().getFullYear();
  const padded = String(counter).padStart(5, '0');
  return `DH-${year}-${padded}`;
}

export function generateCustomerCode(counter: number): string {
  const padded = String(counter).padStart(3, '0');
  return `KH-${padded}`;
}
