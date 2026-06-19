import api from './client';
import type { Customer } from '../types';

export const customersApi = {
  list: () =>
    api.get<Customer[]>('/customers').then((r) => r.data),

  get: (id: string) =>
    api.get<Customer>(`/customers/${id}`).then((r) => r.data),

  create: (body: { firstName: string; lastName: string; email: string; phone?: string }) =>
    api.post<Customer>('/customers', body).then((r) => r.data),
};
