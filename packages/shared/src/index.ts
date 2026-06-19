// Card lifecycle states — shared between api and web
export type CardStatus =
  | 'REQUESTED'
  | 'ISSUED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'HOTLISTED'
  | 'EXPIRED'
  | 'CLOSED';

export type CardChannel = 'ATM' | 'POS' | 'ECOM' | 'INTL';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX';

export type CardProductType = 'DEBIT' | 'CREDIT' | 'PREPAID';

export type UserRole = 'admin' | 'officer' | 'approver' | 'viewer';

export type AuthorizationResult = 'APPROVED' | 'DECLINED';

export interface HealthResponse {
  status: string;
  timestamp: string;
}
