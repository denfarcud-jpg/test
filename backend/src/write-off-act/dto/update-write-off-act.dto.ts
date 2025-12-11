import { PartialType } from '@nestjs/mapped-types';
import { CreateWriteOffActDto } from './create-write-off-act.dto';

export class UpdateWriteOffActDto extends PartialType(CreateWriteOffActDto) {}
