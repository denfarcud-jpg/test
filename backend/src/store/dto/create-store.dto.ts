import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStoreDto {
    @IsString({ message: 'Название склада должно быть строкой' })
    @IsNotEmpty({ message: 'Название склада не может быть пустым' })
    name: string;
}