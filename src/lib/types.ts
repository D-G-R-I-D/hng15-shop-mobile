// Response shapes of the shop's JSON API (shop-app/src/app/api).

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceKobo: number;
  imageUrl: string;
  stock: number;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  priceKobo: number;
  stock: number;
  quantity: number;
};

export type Cart = {
  lines: CartLine[];
  subtotalKobo: number;
  shippingKobo: number;
  totalKobo: number;
  itemCount: number;
};

export type User = { id: string; email: string; name: string | null; image: string | null };

export type Order = {
  id: string;
  status: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  subtotalKobo: number;
  shippingKobo: number;
  totalKobo: number;
  confirmationSentAt: string | null;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  name: string;
  unitPriceKobo: number;
  quantity: number;
};

export type ShippingField = 'fullName' | 'phone' | 'address' | 'city' | 'state';
