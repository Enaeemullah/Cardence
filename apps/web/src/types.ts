export type CardStatus = 'REQUESTED' | 'ISSUED' | 'ACTIVE' | 'BLOCKED' | 'HOTLISTED' | 'EXPIRED' | 'CLOSED';
export type CardChannel = 'ATM' | 'POS' | 'ECOM' | 'INTL';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX';
export type CardProductType = 'DEBIT' | 'CREDIT' | 'PREPAID';
export type MakerCheckerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MakerCheckerType = 'CARD_ISSUANCE' | 'LIMIT_CHANGE';
export type TransactionStatus = 'APPROVED' | 'DECLINED';

export interface Card {
  id: string;
  accountId: string;
  cardProductId: string;
  panMasked: string;
  panLast4: string;
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
  dailyLimitMinorUnits: string | null;
  perTxnLimitMinorUnits: string | null;
  atmEnabled: boolean | null;
  posEnabled: boolean | null;
  ecomEnabled: boolean | null;
  intlEnabled: boolean | null;
  parentCardId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardProduct {
  id: string;
  name: string;
  network: CardNetwork;
  productType: CardProductType;
  dailyLimitMinorUnits: string;
  perTxnLimitMinorUnits: string;
  velocityCount: number;
  velocityWindowSeconds: number;
  atmEnabled: boolean;
  posEnabled: boolean;
  ecomEnabled: boolean;
  intlEnabled: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: string;
}

export interface Account {
  id: string;
  customerId: string;
  accountNumber: string;
  currency: string;
  balanceMinorUnits: string;
  status: string;
  createdAt: string;
}

export interface MakerCheckerRequest {
  id: string;
  type: MakerCheckerType;
  status: MakerCheckerStatus;
  initiatorUserId: string;
  approverUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  decidedAt: string | null;
}

export interface Transaction {
  id: string;
  cardId: string;
  accountId: string;
  referenceNumber: string;
  type: string;
  channel: CardChannel;
  amountMinorUnits: string;
  currency: string;
  merchantName: string | null;
  status: TransactionStatus;
  declineReason: string | null;
  postedAt: string;
}
