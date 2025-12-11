import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CreatePostingItemDto {
    @IsInt({ message: 'ID товара (bitrixProductId) должен быть целым числом' })
    @IsNotEmpty({ message: 'ID товара обязателен' })
    bitrixProductId: number;

    @IsString({ message: 'Название товара должно быть строкой' })
    @IsNotEmpty({ message: 'Название товара обязательно' })
    productName: string;

    @IsNumber({}, { message: 'Количество товара (countProduct) должно быть числом' })
    @Type(() => Number)
    countProduct: number;

    @IsString({ message: 'Единица измерения (unit) должна быть строкой' })
    @IsNotEmpty({ message: 'Единица измерения обязательна' })
    unit: string;

    @IsNumber({}, { message: 'Цена (priceProduct) должна быть числом' })
    @Type(() => Number)
    priceProduct: number;

    @IsInt({ message: 'Количество мест (countLocation) должно быть целым числом' })
    countLocation: number;
}


export class CreatePostingDto {
    @IsString({ message: 'Номер документа (numPosting) должен быть строкой' })
    @IsNotEmpty({ message: 'Номер документа не может быть пустым' })
    numPosting: string;

    @IsOptional()
    @IsDateString({}, { message: 'Дата (datePosting) должна быть в формате ISO-8601' })
    datePosting?: string;

    @IsInt({ message: 'ID склада (storeId) должен быть целым числом' })
    @IsNotEmpty({ message: 'ID склада обязателен' })
    storeId: number;

    @IsNumber({}, { message: 'Общая сумма (totalSum) должна быть числом' })
    @Type(() => Number)
    totalSum: number;


    @IsOptional()
    @IsInt({ message: 'ID сделки (bitrixDealId) должен быть целым числом' })
    bitrixDealId?: number;

    @IsString({ message: 'Ответственный (responsible) должен быть строкой' })
    responsible: string;

    @IsString({ message: 'Статус должен быть строкой' })
    @IsNotEmpty({ message: 'Статус обязателен' })
    status: string;

    @IsInt({ message: 'ID организации (bitrixOrgId) должен быть целым числом' })
    @IsNotEmpty({ message: 'Организация обязательна' })
    bitrixOrgId: number;

    @IsString({ message: 'Название организации (orgName) должно быть строкой' })
    orgName: string;

    @IsOptional()
    @IsDateString({}, { message: 'Дата проведения (dateConducted) должна быть в формате ISO-8601' })
    dateConducted?: string;

    @IsArray({ message: 'Список товаров (items) должен быть массивом' })
    @ValidateNested({ each: true })
    @Type(() => CreatePostingItemDto)
    items: CreatePostingItemDto[];
}