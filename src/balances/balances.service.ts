import { Injectable } from '@nestjs/common';

@Injectable()
export class BalancesService {
    constructor() {}

    getBalancesByAddress(address: string) {
        return [
            { id: 1, name: 'Bitcoin', symbol: 'BTC', amount: 0.5, value: 15000, change: 2.5 },
            { id: 2, name: 'Dollar', symbol: 'USDC', amount: 1000, value: 1000, change: 0 }
        ]
    }
}
