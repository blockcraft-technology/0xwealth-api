import { Module } from '@nestjs/common';
import { OpsService } from './ops.service';
import { OpsController } from './ops.controller';
import { BalancesModule } from 'src/balances/balances.module';
import { CustodialModule } from 'src/custodial/custodial.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lending } from './entities/lending.entity';
import { Loan } from './entities/loan.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lending, Loan]),
    BalancesModule,
    HttpModule,
    CustodialModule,
  ],
  providers: [OpsService],
  controllers: [OpsController]
})
export class OpsModule {}
