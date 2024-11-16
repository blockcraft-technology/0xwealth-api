import { Module } from '@nestjs/common';
import { BalancesModule } from './balances/balances.module';
import { ConfigModule } from '@nestjs/config';
import { CustodialModule } from './custodial/custodial.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BalancesModule,
    CustodialModule
  ],
})
export class AppModule {}
