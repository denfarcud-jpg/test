import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateSalesInvoiceItemDto {
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

    @IsNumber({}, { message: 'Цена продажи должна быть числом' })
    @Type(() => Number)
    priceProduct: number;


    @IsInt({ message: 'Количество мест должно быть целым числом' })
    countLocation: number;
}


export class CreateSalesInvoiceDto {
    @IsOptional()
    @IsString({ message: 'Номер отгрузки должен быть строкой' })
    numShipment?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Дата должна быть в формате ISO (YYYY-MM-DD)' })
    dateShipment?: string;

    @IsInt({ message: 'ID партнера (покупателя) должен быть числом' })
    bitrixPartnerId: number;

    @IsString()
    partnerName: string;

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
    @Type(() => CreateSalesInvoiceItemDto)
    items: CreateSalesInvoiceItemDto[];
}