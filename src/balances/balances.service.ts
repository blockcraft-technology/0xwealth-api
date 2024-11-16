import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import axios from 'axios';

@Injectable()
export class BalancesService {
  private btcContractAddress: string;
  private usdcContractAddress: string;
  private rpcUrl: string;
  private provider: ethers.JsonRpcProvider;

  constructor(private configService: ConfigService) {
    this.btcContractAddress = this.configService.get<string>('BTC_CONTRACT_ADDRESS');
    this.usdcContractAddress = this.configService.get<string>('USDC_CONTRACT_ADDRESS');
    this.rpcUrl = this.configService.get<string>('RPC_URL');
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    // this.getBalancesByAddress('0x7e5aec2b002faca46a278025e0c27b4e481cff24').then(data => {
    //     console.log(data);
    // })
  }

  async getBalancesByAddress(address: string) {
    const btcBalance = await this.getTokenBalance(address, this.btcContractAddress, 8);
    const usdcBalance = await this.getTokenBalance(address, this.usdcContractAddress, 6);

    const btcPrice = await this.getBtcPrice();

    return [
      {
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        amount: btcBalance,
        value: btcBalance * btcPrice,
        change: -2,
        assetPrice: btcPrice,
      },
      {
        id: 2,
        name: 'Dollar',
        symbol: 'USDC',
        amount: usdcBalance,
        value: usdcBalance,
        change: 0,
        assetPrice: 1,
      },
    ];
  }

  private async getTokenBalance(address: string, tokenAddress: string, decimals: number): Promise<number> {
    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];

    const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);

    try {
      const rawBalance = await contract.balanceOf(address);
      return parseFloat(ethers.formatUnits(rawBalance, decimals));
    } catch (error) {
      console.error(`Error fetching balance for ${tokenAddress}:`, error);
      return 0;
    }
  }

  private async getBtcPrice(): Promise<number> {
    return 92000;
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd',
        },
      });
      console.log(response.data);
      return response.data.bitcoin.usd;
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      return 0;
    }
  }
}
