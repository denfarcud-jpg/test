import { Controller, Post, Body, HttpCode, HttpStatus, Query, Logger, Res, Get } from '@nestjs/common';
import * as express from 'express';
import { BitrixService } from './bitrix.service';
import { InstallBitrixDto } from './dto/install-bitrix.dto';

@Controller('bitrix')
export class BitrixController {
    private readonly logger = new Logger(BitrixController.name);

    constructor(private readonly bitrixService: BitrixService) {}

    @Post('install')
    @HttpCode(HttpStatus.OK)
    async install(@Body() body: any, @Query() query: any, @Res() res: express.Response) {
        const dto = { ...body, ...query } as InstallBitrixDto;

        this.logger.log(`📥 New Installation Request from: ${dto.DOMAIN}`);

        try {
            await this.bitrixService.handleInstallation(dto);

            return res.redirect('/');

        } catch (e) {
            this.logger.error(`Installation failed: ${e.message}`);
            return res.status(500).json({ status: 'error', message: e.message });
        }
    }

    @Post('uninstall')
    @HttpCode(HttpStatus.OK)
    async uninstall(@Body() body: any) {
        this.logger.warn(`🗑 App uninstall request received: ${JSON.stringify(body)}`);
        return { status: 'success' };
    }

    @Post('seed-products')
    @HttpCode(HttpStatus.OK)
    async seed(@Body() body: { domain: string }) {
        return this.bitrixService.seedProducts(body.domain);
    }

    @Post('search')
    @HttpCode(HttpStatus.OK)
    async search(@Body() body: { type: 'company' | 'deal'; query: string }) {
        return this.bitrixService.searchCrm(body.type, body.query);
    }

    @Post('seed-companies')
    @HttpCode(HttpStatus.OK)
    async seedCompanies(@Body() body: { domain: string }) {
        return this.bitrixService.seedCompanies(body.domain);
    }

    @Get('my-organizations')
    async getMyOrganizations() {
        return this.bitrixService.getMyOrganizations();
    }
    @Post('register-placements')
    @HttpCode(HttpStatus.OK)
    async registerPlacements() {
        return this.bitrixService.registerPlacements();
    }
}