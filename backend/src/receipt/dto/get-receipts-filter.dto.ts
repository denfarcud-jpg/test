import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReceiptsFilterDto {
    @IsOptional()
    @IsDateString()
    dateStart?: string;

    @IsOptional()
    @IsDateString()
    dateEnd?: string;

    @IsOptional()
    @IsDateString()
    conductedStart?: string;

    @IsOptional()
    @IsDateString()
    conductedEnd?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    storeId?: number;
}