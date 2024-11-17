import { Body, Controller, Post } from '@nestjs/common';
import { OpsService } from './ops.service';

@Controller('ops')
export class OpsController {
    constructor(
        private readonly _opsService: OpsService,
    ) {}

    @Post('reportLending')
    reportLending(@Body() payload: any) {
        /*
            sample payload: 

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
       
    }

}
