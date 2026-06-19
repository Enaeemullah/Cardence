import api from './client';
import type { Card, CardStatus, Transaction } from '../types';

export const cardsApi = {
  list: (params?: { accountId?: string; status?: CardStatus }) =>
    api.get<Card[]>('/cards', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Card>(`/cards/${id}`).then((r) => r.data),

  request: (body: { accountId: string; cardProductId: string }) =>
    api.post<{ card: Card }>('/cards', body).then((r) => r.data),

  activate: (id: string) => api.post<Card>(`/cards/${id}/activate`).then((r) => r.data),
  block:    (id: string) => api.post<Card>(`/cards/${id}/block`).then((r) => r.data),
  unblock:  (id: string) => api.post<Card>(`/cards/${id}/unblock`).then((r) => r.data),
  hotlist:  (id: string) => api.post<Card>(`/cards/${id}/hotlist`).then((r) => r.data),
  renew:    (id: string) => api.post<Card>(`/cards/${id}/renew`).then((r) => r.data),
  replace:  (id: string) => api.post<{ card: Card }>(`/cards/${id}/replace`).then((r) => r.data),
  close:    (id: string) => api.post<Card>(`/cards/${id}/close`).then((r) => r.data),

  setPin: (id: string, pin: string) =>
    api.post(`/cards/${id}/pin`, { pin }),

  resetPin: (id: string) =>
    api.post(`/cards/${id}/pin/reset`),

  requestLimitChange: (id: string, body: { dailyLimitMinorUnits?: number; perTxnLimitMinorUnits?: number }) =>
    api.post(`/cards/${id}/limits`, body).then((r) => r.data),

  transactions: (id: string) =>
    api.get<Transaction[]>(`/cards/${id}/transactions`).then((r) => r.data),
};
