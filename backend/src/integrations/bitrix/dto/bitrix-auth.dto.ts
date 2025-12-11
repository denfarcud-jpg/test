import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BitrixAuthDto {
    @IsString()
    @IsNotEmpty()
    domain: string;

    @IsString()
    @IsNotEmpty()
    member_id: string;

    @IsString()
    @IsNotEmpty()
    access_token: string;

    @IsString()
    @IsNotEmpty()
    refresh_token: string;

    @IsString()
    @IsNotEmpty()
    application_token: string;

    @IsString()
    expires_in: string;

    @IsString()
    @IsOptional()
    scope?: string;

    @IsString()
    @IsOptional()
    client_endpoint?: string;

    @IsString()
    @IsOptional()
    server_endpoint?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    user_id?: string;
}