import api from './client';
import type { CardProduct } from '../types';

export interface CreateCardProductBody {
  name: string;
  network: string;
  productType: string;
  dailyLimitMinorUnits: number;
  perTxnLimitMinorUnits: number;
  velocityCount: number;
  velocityWindowSeconds: number;
  atmEnabled?: boolean;
  posEnabled?: boolean;
  ecomEnabled?: boolean;
  intlEnabled?: boolean;
}

export const cardProductsApi = {
  list: () =>
    api.get<CardProduct[]>('/card-products').then((r) => r.data),

  get: (id: string) =>
    api.get<CardProduct>(`/card-products/${id}`).then((r) => r.data),

  create: (body: CreateCardProductBody) =>
    api.post<CardProduct>('/card-products', body).then((r) => r.data),

  update: (id: string, body: Partial<CreateCardProductBody>) =>
    api.put<CardProduct>(`/card-products/${id}`, body).then((r) => r.data),
};
