import { IsOptional, IsString, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReportDto {
    @IsString()
    reportType: 'stock' | 'sales' | 'movement' | 'price';

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    storeId?: number;

    @IsOptional()
    @IsDateString()
    dateStart?: string;

    @IsOptional()
    @IsDateString()
    dateEnd?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    productId?: number;
}