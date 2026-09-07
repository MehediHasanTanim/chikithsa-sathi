import { PartialType } from '@nestjs/swagger';

import { CreateVitalDto } from './create-vital.dto';

export class UpdateVitalDto extends PartialType(CreateVitalDto) {}
