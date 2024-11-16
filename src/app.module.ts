import { Module } from '@nestjs/common';
import { BalancesModule } from './balances/balances.module';

@Module({
  imports: [BalancesModule],
})
export class AppModule {}
