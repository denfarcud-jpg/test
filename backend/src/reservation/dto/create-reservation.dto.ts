import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservationDto {
    @IsInt({ message: 'ID товара должен быть целым числом' })
    @IsNotEmpty({ message: 'ID товара обязателен' })
    bitrixProductId: number;

    @IsString({ message: 'Название товара должно быть строкой' })
    @IsNotEmpty({ message: 'Название товара обязательно' })
    productName: string;

    @IsInt({ message: 'ID склада должен быть целым числом' })
    @IsNotEmpty({ message: 'ID склада обязателен' })
    storeId: number;

    @IsInt({ message: 'ID сделки (dealId) должен быть целым числом' })
    @IsNotEmpty({ message: 'ID сделки обязателен' })
    bitrixDealId: number;

    @IsNumber({}, { message: 'Количество резерва должно быть числом' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'Количество не может быть пустым' })
    quantity: number;
}