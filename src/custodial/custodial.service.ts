import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bip39 from 'bip39';
import { hdkey } from 'ethereumjs-wallet';

@Injectable()
export class CustodialService {
  private _seed;
  constructor(
    private readonly _configService: ConfigService,
  ) {
    this._seed = this._configService.get<string>('LOCK_MNEMONICS');
    //this.generateEthWallet(1, true).then(data => console.log(data));
  }

  public async generateEthWallet(
    index: number,
    withPrivateKey = false,
  ) {
    const derivationPath = `m/44'/60'/0'/0/${index}`;
    const hdWallet = hdkey.fromMasterSeed(this._seed);
    console.log(hdWallet);
    const wallet = hdWallet.derivePath(derivationPath).getWallet();
    const privateKey = wallet.getPrivateKeyString();
    const address = `0x${wallet.getAddress().toString('hex')}`;
    const result = {
      publicKey: address,
      privateKey,
      path: derivationPath,
    };
    if (!withPrivateKey) {
      delete result.privateKey;
    }
    return result;
  }


}
