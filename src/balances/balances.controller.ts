import { Controller, Get, Param } from '@nestjs/common';
import { BalancesService } from './balances.service';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('address/:address')
  getBalancesByAddress(@Param('address') address: string) {
    return this.balancesService.getBalancesByAddress(address);
  }
}
