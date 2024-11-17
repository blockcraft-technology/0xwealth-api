import { Controller } from '@nestjs/common';
import { OpsService } from './ops.service';

@Controller('ops')
export class OpsController {
    constructor(
        private readonly _opsService: OpsService,
    ) {}

    
}
