import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lending } from './entities/lending.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BalancesService } from 'src/balances/balances.service';
import { CustodialService } from 'src/custodial/custodial.service';
import { Loan } from './entities/loan.entity';

@Injectable()
export class OpsService {
    private readonly logger = new Logger(OpsService.name);

    constructor(
        @InjectRepository(Lending)
        private readonly _lendingRepository: Repository<Lending>,
        @InjectRepository(Loan)
        private readonly _loanRepository: Repository<Loan>,
        private readonly httpService: HttpService,
        private readonly balancesService: BalancesService,
        private readonly custodialService: CustodialService,
    ) {}

    async saveLending(lending: Lending) {
        return await this._lendingRepository.save(lending);
    }

    async createLoan(userWallet: string) {
        const loan = await this._loanRepository.save({ 
            userWallet
        });
        const wallet = await this.custodialService.generateEthWallet(loan.walletId, false);
        loan.depositAddress = wallet.publicKey;
        loan.depositDerivationPath = wallet.path;
        loan.status = 'pending';
        return this._loanRepository.save(loan);
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async checkPendingLoans() {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const pendingLoans = await this._loanRepository.find({
            where: {
                status: 'pending',
                createdAt: MoreThanOrEqual(fifteenMinutesAgo),
            },
        });

        for (const loan of pendingLoans) {
            try {
                const address = loan.depositAddress;
                const balances = await this.balancesService.getBalancesByAddress(address);
                const btcPrice = await this.balancesService.getBtcPrice();
                const btcBalanceInfo = balances.find(balance => balance.symbol === 'BTC');
                const btcBalance = btcBalanceInfo ? btcBalanceInfo.amount : 0;

                if (btcBalance > 0) {
                    loan.receivedAmount = btcBalance;
                    loan.creditDate = new Date();
                    loan.creditAmount = btcBalance * btcPrice;
                    loan.repaymentReference = Math.random().toString(36).substring(2, 8);
                    loan.status = 'received';
                    await this._loanRepository.save(loan);
                }
            } catch (error) {
                this.logger.error(`Error checking loan ${loan.id}: ${error.message}`);
            }
        }
    }


    @Cron(CronExpression.EVERY_5_SECONDS)
    async checkPendingLendings() {
        const pendingLendings = await this._lendingRepository.find({
            where: { status: 'pending' },
        });

        for (const lending of pendingLendings) {
            try {
                const transactionId = lending.transactionId;
                const appId = 'app_a8533e587ab2fda886dc159e4b5acc04';
                const url = `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appId}`;

                const response = await firstValueFrom(this.httpService.get(url));
                const data = response.data;

                if (data.transactionStatus === 'mined') {
                    lending.status = 'received';
                    lending.receivedAmount = parseFloat(data.inputTokenAmount) / 1e6;
                    await this._lendingRepository.save(lending);
                }
            } catch (error) {
                this.logger.error(`Error checking transaction ${lending.transactionId}: ${error.message}`);
            }
        }
    }
}
