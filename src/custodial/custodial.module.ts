import { Module } from '@nestjs/common';
import { CustodialService } from './custodial.service';

@Module({
  providers: [CustodialService],
  exports: [CustodialService],
})
export class CustodialModule {}
