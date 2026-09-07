import { PartialType } from '@nestjs/swagger';

import { CreateChamberDto } from './create-chamber.dto';

export class UpdateChamberDto extends PartialType(CreateChamberDto) {}
