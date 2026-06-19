import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './data-source';
import { User } from '../entities/user.entity';
import { CardProduct } from '../entities/card-product.entity';
import { Customer } from '../entities/customer.entity';
import { Account } from '../entities/account.entity';
import { Card } from '../entities/card.entity';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { Transaction } from '../entities/transaction.entity';
import {
  UserRole, CardNetwork, CardProductType, CardStatus,
  AccountStatus, MakerCheckerType, MakerCheckerStatus,
  TransactionType, TransactionStatus, CardChannel,
} from '../common/enums';

// ── helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

function fakeCard(
  accountId: string,
  cardProductId: string,
  status: CardStatus,
  opts: Partial<Card> = {},
): Partial<Card> {
  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  const now = new Date();
  const expYear = status === CardStatus.EXPIRED
    ? now.getFullYear() - 1
    : now.getFullYear() + 3;
  return {
    accountId,
    cardProductId,
    panToken: uuidv4(),
    panLast4: last4,
    panMasked: `****-****-****-${last4}`,
    expiryMonth: now.getMonth() + 1 || 12,
    expiryYear: expYear,
    status,
    pinBlockHash: null,
    dailyLimitMinorUnits: null,
    perTxnLimitMinorUnits: null,
    atmEnabled: null,
    posEnabled: null,
    ecomEnabled: null,
    intlEnabled: null,
    parentCardId: null,
    closedAt: status === CardStatus.CLOSED ? new Date() : null,
    ...opts,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const ds = await AppDataSource.initialize();
  console.log('✓ Connected to database');

  const userRepo    = ds.getRepository(User);
  const productRepo = ds.getRepository(CardProduct);
  const custRepo    = ds.getRepository(Customer);
  const acctRepo    = ds.getRepository(Account);
  const cardRepo    = ds.getRepository(Card);
  const approvalRepo = ds.getRepository(MakerCheckerRequest);
  const txnRepo     = ds.getRepository(Transaction);

  // Idempotency guard
  if (await userRepo.findOneBy({ email: 'admin@cardence.dev' })) {
    console.log('⚠  Seed data already present — skipping.');
    return;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('  Seeding users…');
  const userDefs = [
    { email: 'admin@cardence.dev',    password: 'Admin1234!',    role: UserRole.ADMIN },
    { email: 'officer@cardence.dev',  password: 'Officer1234!',  role: UserRole.OFFICER },
    { email: 'approver@cardence.dev', password: 'Approver1234!', role: UserRole.APPROVER },
    { email: 'viewer@cardence.dev',   password: 'Viewer1234!',   role: UserRole.VIEWER },
  ];
  const [adminUser, officerUser] = await userRepo.save(
    await Promise.all(
      userDefs.map(async (u) =>
        userRepo.create({ ...u, passwordHash: await bcrypt.hash(u.password, 12) }),
      ),
    ),
  );
  console.log(`  ✓ ${userDefs.length} users created`);

  // ── Card products ──────────────────────────────────────────────────────────
  console.log('  Seeding card products…');
  const [visaDebit, mcCredit, corpAmex] = await productRepo.save([
    productRepo.create({
      name: 'Standard Visa Debit',
      network: CardNetwork.VISA,
      productType: CardProductType.DEBIT,
      dailyLimitMinorUnits: '100000',
      perTxnLimitMinorUnits: '50000',
      velocityCount: 10,
      velocityWindowSeconds: 3600,
      atmEnabled: true, posEnabled: true, ecomEnabled: true, intlEnabled: false,
    }),
    productRepo.create({
      name: 'Gold Mastercard Credit',
      network: CardNetwork.MASTERCARD,
      productType: CardProductType.CREDIT,
      dailyLimitMinorUnits: '500000',
      perTxnLimitMinorUnits: '200000',
      velocityCount: 20,
      velocityWindowSeconds: 3600,
      atmEnabled: true, posEnabled: true, ecomEnabled: true, intlEnabled: true,
    }),
    productRepo.create({
      name: 'Corporate Amex',
      network: CardNetwork.AMEX,
      productType: CardProductType.DEBIT,
      dailyLimitMinorUnits: '1000000',
      perTxnLimitMinorUnits: '500000',
      velocityCount: 50,
      velocityWindowSeconds: 3600,
      atmEnabled: true, posEnabled: true, ecomEnabled: true, intlEnabled: true,
    }),
  ]);
  console.log('  ✓ 3 card products created');

  // ── Customers ──────────────────────────────────────────────────────────────
  console.log('  Seeding customers…');
  const [alice, bob, carol, david, eve] = await custRepo.save([
    custRepo.create({ firstName: 'Alice',  lastName: 'Johnson', email: 'alice@example.com',  phone: '+14155551001' }),
    custRepo.create({ firstName: 'Bob',    lastName: 'Smith',   email: 'bob@example.com',    phone: '+14155551002' }),
    custRepo.create({ firstName: 'Carol',  lastName: 'Davis',   email: 'carol@example.com',  phone: null }),
    custRepo.create({ firstName: 'David',  lastName: 'Wilson',  email: 'david@example.com',  phone: '+14155551004' }),
    custRepo.create({ firstName: 'Eve',    lastName: 'Martinez',email: 'eve@example.com',    phone: '+14155551005' }),
  ]);
  console.log('  ✓ 5 customers created');

  // ── Accounts ───────────────────────────────────────────────────────────────
  console.log('  Seeding accounts…');
  const makeAcct = (customerId: string, balance: string) =>
    acctRepo.create({
      customerId,
      accountNumber: String(Math.floor(100_000_000_000 + Math.random() * 900_000_000_000)),
      currency: 'USD',
      balanceMinorUnits: balance,
      status: AccountStatus.ACTIVE,
    });

  const [aliceAcct, bobAcct, carolAcct, davidAcct, eveAcct] = await acctRepo.save([
    makeAcct(alice.id, '2500000'),   // $25,000
    makeAcct(bob.id,   '1000000'),   // $10,000
    makeAcct(carol.id, '750000'),    // $7,500
    makeAcct(david.id, '5000000'),   // $50,000
    makeAcct(eve.id,   '1500000'),   // $15,000
  ]);
  console.log('  ✓ 5 accounts created');

  // ── Cards ──────────────────────────────────────────────────────────────────
  console.log('  Seeding cards…');
  const cards = await cardRepo.save([
    // Alice — 2 cards: ACTIVE (current) + CLOSED (old)
    cardRepo.create(fakeCard(aliceAcct.id, visaDebit.id, CardStatus.ACTIVE)),
    cardRepo.create(fakeCard(aliceAcct.id, visaDebit.id, CardStatus.CLOSED)),

    // Bob — 2 cards: ACTIVE + BLOCKED
    cardRepo.create(fakeCard(bobAcct.id, mcCredit.id, CardStatus.ACTIVE)),
    cardRepo.create(fakeCard(bobAcct.id, mcCredit.id, CardStatus.BLOCKED)),

    // Carol — 2 cards: ISSUED (awaiting activation) + REQUESTED (awaiting approval)
    cardRepo.create(fakeCard(carolAcct.id, visaDebit.id, CardStatus.ISSUED)),
    cardRepo.create(fakeCard(carolAcct.id, visaDebit.id, CardStatus.REQUESTED)),

    // David — 2 cards: ACTIVE + HOTLISTED (reported stolen)
    cardRepo.create(fakeCard(davidAcct.id, corpAmex.id, CardStatus.ACTIVE)),
    cardRepo.create(fakeCard(davidAcct.id, corpAmex.id, CardStatus.HOTLISTED)),

    // Eve — 2 cards: ACTIVE + EXPIRED
    cardRepo.create(fakeCard(eveAcct.id, visaDebit.id, CardStatus.ACTIVE)),
    cardRepo.create(fakeCard(eveAcct.id, visaDebit.id, CardStatus.EXPIRED)),
  ]);

  const [aliceActive, , bobActive, , , carolRequested, davidActive] = cards;
  console.log('  ✓ 10 cards created (ACTIVE×4, ISSUED×1, REQUESTED×1, BLOCKED×1, HOTLISTED×1, CLOSED×1, EXPIRED×1)');

  // ── Pending maker-checker request for Carol's REQUESTED card ───────────────
  await approvalRepo.save(
    approvalRepo.create({
      type: MakerCheckerType.CARD_ISSUANCE,
      initiatorUserId: officerUser.id,
      approverUserId: null,
      status: MakerCheckerStatus.PENDING,
      payload: { cardId: carolRequested.id },
      decidedAt: null,
    }),
  );
  console.log('  ✓ 1 pending CARD_ISSUANCE approval created');

  // ── Transactions ───────────────────────────────────────────────────────────
  console.log('  Seeding transactions…');
  const txnDefs = [
    // Alice — 3 approved POS transactions
    { card: aliceActive, accountId: aliceAcct.id, amount: '3499',  channel: CardChannel.POS,  merchant: 'Costa Coffee',  status: TransactionStatus.APPROVED, daysAgo_: 2 },
    { card: aliceActive, accountId: aliceAcct.id, amount: '12599', channel: CardChannel.ECOM, merchant: 'Amazon',        status: TransactionStatus.APPROVED, daysAgo_: 1 },
    { card: aliceActive, accountId: aliceAcct.id, amount: '8900',  channel: CardChannel.POS,  merchant: 'Whole Foods',   status: TransactionStatus.APPROVED, daysAgo_: 0 },
    // Bob — 2 approved + 1 declined (insufficient funds, story: limit hit)
    { card: bobActive,   accountId: bobAcct.id,   amount: '45000', channel: CardChannel.POS,  merchant: 'Apple Store',   status: TransactionStatus.APPROVED, daysAgo_: 5 },
    { card: bobActive,   accountId: bobAcct.id,   amount: '19900', channel: CardChannel.ECOM, merchant: 'Booking.com',   status: TransactionStatus.APPROVED, daysAgo_: 3 },
    { card: bobActive,   accountId: bobAcct.id,   amount: '250000',channel: CardChannel.ECOM, merchant: 'Luxury Store',  status: TransactionStatus.DECLINED, daysAgo_: 1 },
    // David — 2 approved on corporate card
    { card: davidActive, accountId: davidAcct.id, amount: '89900', channel: CardChannel.POS,  merchant: 'Marriott Hotel',status: TransactionStatus.APPROVED, daysAgo_: 7 },
    { card: davidActive, accountId: davidAcct.id, amount: '25000', channel: CardChannel.ATM,  merchant: null,            status: TransactionStatus.APPROVED, daysAgo_: 4 },
  ];

  await txnRepo.save(
    txnDefs.map(({ card, accountId, amount, channel, merchant, status, daysAgo_ }) =>
      txnRepo.create({
        cardId: card.id,
        accountId,
        referenceNumber: `REF-${uuidv4()}`,
        idempotencyKey: uuidv4(),
        type: TransactionType.AUTHORIZATION,
        channel,
        amountMinorUnits: amount,
        currency: 'USD',
        merchantName: merchant ?? null,
        merchantCode: null,
        status,
        declineReason: status === TransactionStatus.DECLINED ? 'PER_TXN_LIMIT_EXCEEDED' : null,
        postedAt: daysAgo(daysAgo_),
      } as Partial<Transaction>),
    ),
  );
  console.log('  ✓ 8 transactions created (6 approved, 2 declined)');

  console.log('\n✅ Seed complete!\n');
  console.log('  Default credentials:');
  console.log('  ┌─────────────────────────────┬──────────────┬──────────┐');
  console.log('  │ Email                        │ Password     │ Role     │');
  console.log('  ├─────────────────────────────┼──────────────┼──────────┤');
  userDefs.forEach(({ email, password, role }) => {
    console.log(`  │ ${email.padEnd(28)} │ ${password.padEnd(12)} │ ${role.padEnd(8)} │`);
  });
  console.log('  └─────────────────────────────┴──────────────┴──────────┘\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
