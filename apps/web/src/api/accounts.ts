import api from './client';
import type { Account } from '../types';

export const accountsApi = {
  list: () =>
    api.get<Account[]>('/accounts').then((r) => r.data),

  get: (id: string) =>
    api.get<Account>(`/accounts/${id}`).then((r) => r.data),

  create: (body: { customerId: string; currency: string }) =>
    api.post<Account>('/accounts', body).then((r) => r.data),
};
