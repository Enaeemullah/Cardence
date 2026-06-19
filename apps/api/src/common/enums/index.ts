export enum UserRole {
  ADMIN = 'admin',
  OFFICER = 'officer',
  APPROVER = 'approver',
  VIEWER = 'viewer',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export enum CardNetwork {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
}

export enum CardProductType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  PREPAID = 'PREPAID',
}

export enum CardStatus {
  REQUESTED = 'REQUESTED',
  ISSUED = 'ISSUED',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  HOTLISTED = 'HOTLISTED',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
}

export enum CardChannel {
  ATM = 'ATM',
  POS = 'POS',
  ECOM = 'ECOM',
  INTL = 'INTL',
}

export enum TransactionType {
  AUTHORIZATION = 'AUTHORIZATION',
  CLEARING = 'CLEARING',
  REVERSAL = 'REVERSAL',
  FEE = 'FEE',
}

export enum TransactionStatus {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export enum PostingDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum MakerCheckerType {
  CARD_ISSUANCE = 'CARD_ISSUANCE',
  LIMIT_CHANGE = 'LIMIT_CHANGE',
}

export enum MakerCheckerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
