import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateWriteOffActItemDto {
    @IsInt({ message: 'ID товара должен быть целым числом' })
    bitrixProductId: number;

    @IsString()
    productName: string;

    @IsNumber({}, { message: 'Количество товара должно быть числом' })
    @Type(() => Number)
    countProduct: number;

    @IsString({ message: 'Единица измерения должна быть строкой' })
    @IsNotEmpty({ message: 'Единица измерения не может быть пустой' })
    unit: string;

    @IsNumber({}, { message: 'Цена (себестоимость) должна быть числом' })
    @Type(() => Number)
    priceProduct: number;

    @IsInt({ message: 'Количество мест должно быть целым числом' })
    countLocation: number;
}


export class CreateWriteOffActDto {
    @IsString({ message: 'Номер акта должен быть строкой' })
    @IsOptional()
    numCancellation: string;

    @IsOptional()
    @IsDateString({}, { message: 'Дата должна быть в формате ISO (YYYY-MM-DD)' })
    dateCancellation?: string;

    @IsInt({ message: 'ID склада должен быть числом' })
    storeId: number;

    @IsNumber({}, { message: 'Общая сумма должна быть числом' })
    @Type(() => Number)
    totalSum: number;

    @IsOptional()
    @IsInt({ message: 'ID сделки должен быть целым числом' })
    bitrixDealId?: number;

    @IsString({ message: 'Ответственный должен быть строкой' })
    responsible: string;

    @IsString({ message: 'Статус должен быть строкой' })
    status: string;

    @IsOptional()
    @IsDateString()
    dateConducted?: string;

    @IsInt({ message: 'ID организации должен быть числом' })
    @IsNotEmpty({ message: 'ID организации обязателен' })
    bitrixOrgId: number;

    @IsString()
    orgName: string;

    @IsArray({ message: 'Товары должны быть массивом' })
    @ValidateNested({ each: true })
    @Type(() => CreateWriteOffActItemDto)
    items: CreateWriteOffActItemDto[];
}