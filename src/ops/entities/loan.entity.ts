import {
  Entity,
  Column,
  Generated,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'loans' })
export class Loan extends BaseEntity {
  constructor(partial: Partial<Loan>) {
    super();
    Object.assign(this, partial);
  }

  @Column({ nullable: false })
  userWallet: string;

  @Column()
  @Generated('increment')
  walletId: number;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  depositAddress?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  depositDerivationPath?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  repaymentReference?: string;

  @Column({ type: 'numeric', nullable: true })
  receivedAmount: number;

  @Column({ type: 'timestamptz', nullable: true })
  creditDate: Date;

  @Column({ type: 'numeric', nullable: true })
  creditAmount: number;

  @Column({ type: 'varchar', length: 200, nullable: false, default: 'pending'})
  status: 'pending' | 'received' | 'loan_credited';
}
