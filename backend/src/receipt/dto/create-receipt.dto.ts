import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateReceiptItemDto {
    @IsInt({ message: 'ID товара (bitrixProductId) должен быть целым числом' })
    bitrixProductId: number;

    @IsString()
    productName: string;

    @IsNumber({}, { message: 'Количество товара должно быть числом' })
    @Type(() => Number)
    countProduct: number;

    @IsString({ message: 'Единица измерения должна быть строкой' })
    @IsNotEmpty({ message: 'Единица измерения не может быть пустой' })
    unit: string;

    @IsNumber({}, { message: 'Цена закупки должна быть числом' })
    @Type(() => Number)
    priceProduct: number;

    @IsInt({ message: 'Количество мест должно быть целым числом' })
    countLocation: number;
}


export class CreateReceiptDto {
    @IsString({ message: 'Номер документа должен быть строкой' })
    @IsNotEmpty({ message: 'Номер документа не может быть пустым' })
    numReceipt: string;

    @IsOptional()
    @IsDateString({}, { message: 'Дата должна быть в формате ISO (YYYY-MM-DD)' })
    dateReceipt?: string;

    @IsInt({ message: 'ID партнера (поставщика) должен быть числом' })
    bitrixPartnerId: number;

    @IsInt({ message: 'ID склада должен быть числом' })
    storeId: number;

    @IsString()
    partnerName: string;

    @IsNumber({}, { message: 'Общая сумма должна быть числом' })
    @Type(() => Number)
    totalSum: number;

    @IsString({ message: 'Ответственный должен быть строкой' })
    responsible: string;

    @IsString({ message: 'Статус должен быть строкой' })
    status: string;

    @IsInt({ message: 'ID организации должен быть числом' })
    bitrixOrgId: number;

    @IsString()
    orgName: string;

    @IsOptional()
    @IsDateString()
    dateConducted?: string;

    @IsArray({ message: 'Товары должны быть массивом' })
    @ValidateNested({ each: true })
    @Type(() => CreateReceiptItemDto)
    items: CreateReceiptItemDto[];
}