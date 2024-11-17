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
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

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
        private readonly configService: ConfigService,
    ) {
        // this.checkPendingCredits();
    }

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

    @Cron(CronExpression.EVERY_10_SECONDS)
    async checkPendingCredits() {
        try {
            const pendingLoans = await this._loanRepository.find({
                where: { status: 'received' },
                take: 1,
            });
    
            if (pendingLoans.length === 0) {
                this.logger.debug("No pending loans to process.");
                return;
            }
    
            // Fetch environment variables
            const rpcUrl = "https://worldchain-mainnet.g.alchemy.com/v2/5MOvCN2v3L-JTCDXE8jWToC_j9CBxO7v"; //this.configService.get<string>('NODE_URL');
            console.log(rpcUrl);
            const privateKey = this.configService.get<string>('LENDING_POOL_PK');

            console.log(privateKey);
            const contractAddress = "0xb04559bEF8D035B7f4C664998CD13fB633a20Df7";

          
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const wallet = new ethers.Wallet(privateKey, provider);
          
            const abi = [
              "function payout(address destination, uint256 amount) external",
            ];
            const contract = new ethers.Contract(contractAddress, abi, wallet);
          
            for (const loan of pendingLoans) {
                loan.status = 'loan_credited';
                await this._loanRepository.save(loan);
                try {    
                    const payoutAmount = Math.floor((loan.creditAmount * 0.7)) * 10 ** 6;
                    const payoutWallet = ethers.getAddress(loan.userWallet);
    
                    const tx = await contract.payout(payoutWallet, payoutAmount);
                  
        
                    console.debug(`Transferring ${payoutAmount} USDC to ${payoutWallet}...`);
    
                    
                    const receipt = await tx.wait();
                    return receipt;
                    console.log(receipt);
                    console.log(`Successfully credited loan ID ${loan.id}: ${loan.creditAmount * 0.7} USDC to ${payoutWallet}`);
                } catch (error) {
                    console.error(`Error processing loan ID ${loan.id}: ${error.message}`, error);
                    loan.status = 'error';
                    await this._loanRepository.save(loan);
                }
            }
        } catch (error) {
            this.logger.error(`Error in checkPendingCredits method: ${error.message}`, error);
        }
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
