import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetWriteOffActsFilterDto {
    @IsOptional()
    @IsString()
    dateStart?: string;

    @IsOptional()
    @IsString()
    dateEnd?: string;

    @IsOptional()
    @IsString()
    conductedStart?: string;

    @IsOptional()
    @IsString()
    conductedEnd?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @Type(() => Number)
    storeId?: number;
}