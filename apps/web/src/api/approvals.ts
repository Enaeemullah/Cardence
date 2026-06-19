import api from './client';
import type { MakerCheckerRequest } from '../types';

export const approvalsApi = {
  list: () =>
    api.get<MakerCheckerRequest[]>('/approvals').then((r) => r.data),

  get: (id: string) =>
    api.get<MakerCheckerRequest>(`/approvals/${id}`).then((r) => r.data),

  approve: (id: string) =>
    api.post<MakerCheckerRequest>(`/approvals/${id}/approve`).then((r) => r.data),

  reject: (id: string) =>
    api.post<MakerCheckerRequest>(`/approvals/${id}/reject`).then((r) => r.data),
};
