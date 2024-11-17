import {
    Entity,
    Column,
  } from 'typeorm';
  import { BaseEntity } from './base.entity';
  
  @Entity({ name: 'lendings' })
  export class Lending extends BaseEntity {
    constructor(partial: Partial<Lending>) {
      super();
      Object.assign(this, partial);
    }

    @Column({ nullable: false })
    userWallet: string;

    @Column({ type: 'varchar', nullable: true})
    transactionId: string;

    @Column({ type: 'varchar', nullable: true})
    referrence: string;

    @Column({ type: 'numeric', nullable: true })
    receivedAmount: number;

    @Column({ type: 'timestamptz', nullable: true })
    initDate: Date;
  
    @Column({ type: 'varchar', length: 200, nullable: false, default: 'pending'})
    status: 'pending' | 'received';
  }