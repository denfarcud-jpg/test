import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class InstallBitrixDto {
    @IsString()
    @IsOptional()
    event?: string;

    @IsString()
    @IsNotEmpty()
    AUTH_ID: string;

    @IsString()
    @IsNotEmpty()
    REFRESH_ID: string;

    @IsString()
    @IsNotEmpty()
    member_id: string;

    @IsString()
    @IsNotEmpty()
    DOMAIN: string;

    @IsString()
    @IsOptional()
    AUTH_EXPIRES?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    PLACEMENT?: string;

    @IsString()
    @IsOptional()
    SERVER_ENDPOINT?: string;

    @IsString()
    @IsOptional()
    client_endpoint?: string;
}