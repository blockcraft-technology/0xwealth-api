import { Body, Controller, Post } from '@nestjs/common';
import { OpsService } from './ops.service';
import { Lending } from './entities/lending.entity';

@Controller('ops')
export class OpsController {
    constructor(
        private readonly _opsService: OpsService,
    ) {}

    @Post('reportLending')
    async reportLending(@Body() payload: any) {
        /*
            Sample payload: 
            {
                "status": "success",
                "transaction_status": "submitted",
                "transaction_id": "0xec3af3022ae25658e22edab0340b780913b7fdbfdaec406303e220960df7dfe6",
                "reference": "y9q42gcc",
                "from": "0x7e5aec2b002faca46a278025e0c27b4e481cff24",
                "chain": "worldchain",
                "timestamp": "2024-11-17T07:41:59.796+07:00"
            }
        */

        const lending = new Lending({
            userWallet: payload.from,
            transactionId: payload.transaction_id,
            referrence: payload.reference,
            initDate: new Date(payload.timestamp),
            status: 'pending',
            receivedAmount: null,
        });

        await this._opsService.saveLending(lending);

        return { success: true };
    }
}
