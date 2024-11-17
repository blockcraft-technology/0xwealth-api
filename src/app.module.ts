import { Module } from '@nestjs/common';
import { BalancesModule } from './balances/balances.module';
import { ConfigModule } from '@nestjs/config';
import { CustodialModule } from './custodial/custodial.module';
import { OpsModule } from './ops/ops.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      ssl: false,
      synchronize: true,
    }),
    BalancesModule,
    CustodialModule,
    OpsModule
  ],
})
export class AppModule {}
