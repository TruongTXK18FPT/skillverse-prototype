export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price);
}; 