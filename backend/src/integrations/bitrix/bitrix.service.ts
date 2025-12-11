import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstallBitrixDto } from './dto/install-bitrix.dto';
import axios from 'axios';

@Injectable()
export class BitrixService {
    private readonly logger = new Logger(BitrixService.name);

    constructor(private readonly prisma: PrismaService) {}


    async searchCrm(entityType: 'company' | 'deal' | 'product', query: string) {
        let method = '';
        let filterKey = '';
        let select = ['ID'];

        switch (entityType) {
            case 'company':
                method = 'crm.company.list';
                filterKey = '%TITLE';
                select.push('TITLE');
                break;
            case 'deal':
                method = 'crm.deal.list';
                filterKey = '%TITLE';
                select.push('TITLE');
                break;
            case 'product':
                method = 'crm.product.list';
                filterKey = '%NAME';
                select.push('NAME', 'PRICE', 'CURRENCY_ID', 'MEASURE');
                break;
        }

        try {

            const data = await this.callRestMethod(method, {
                filter: { [filterKey]: query },
                select: select
            });

            const items = data.result;

            if (entityType === 'product' && items.length > 0) {
                try {

                    const measuresData = await this.callRestMethod('crm.measure.list');

                    const measures = measuresData.result;

                    const catalogListResponse = await this.callRestMethod('catalog.catalog.list');

                    const catalogs = catalogListResponse.result?.catalogs || [];

                    const targetCatalog = catalogs.find(c => c.iblockId);
                    const catalogId = targetCatalog?.iblockId;

                    let catalogProducts: any[] = [];

                    if (catalogId) {

                        const productIds = items.map(i => i.ID);

                        try {

                            const selectFields = ["id", "iblockId", "measure", "type"];

                            const catalogData = await this.callRestMethod('catalog.product.list', {
                                "select": selectFields,
                                "filter": {
                                    "iblockId": catalogId,
                                    "id": productIds
                                }
                            });


                            if (catalogData.result && catalogData.result.products) {
                                catalogProducts = catalogData.result.products;
                            }
                        } catch (catalogError) {
                            this.logger.error(`Ошибка запроса catalog.product.list: ${catalogError.message}`);
                            if (catalogError.response) {
                                this.logger.error(`Детали Bitrix: ${JSON.stringify(catalogError.response.data)}`);
                            }
                        }
                    } else {
                        this.logger.warn('⚠️ Не удалось определить iblockId каталога');
                    }

                    return items.map(product => {
                        const catalogItem = catalogProducts.find(cp => cp.id == product.ID);


                        let catalogMeasureId = catalogItem?.measure;

                        if (typeof catalogMeasureId === 'object' && catalogMeasureId !== null) {
                            catalogMeasureId = catalogMeasureId.id;
                        }

                        const measureId = catalogMeasureId || product.MEASURE;

                        let measureName = 'шт';
                        if (measureId) {
                            const measure = measures.find(m => m.ID == measureId);
                            if (measure) measureName = measure.SYMBOL_RUS || measure.SYMBOL;
                        } else {
                            const defaultMeasure = measures.find(m => m.IS_DEFAULT === 'Y');
                            if (defaultMeasure) measureName = defaultMeasure.SYMBOL_RUS || defaultMeasure.SYMBOL;
                        }

                        return {
                            ...product,
                            MEASURE_NAME: measureName
                        };
                    });
                } catch (e) {
                    this.logger.warn(`⚠️ Ошибка при уточнении каталога: ${e.message}`);

                    return items;
                }
            }

            return items;
        } catch (e) {
            this.logger.error(`❌ Критическая ошибка поиска: ${e.message}`);
            return [];
        }
    }
    async getMyOrganizations() {
        try {
            const data = await this.callRestMethod('crm.company.list', {
                filter: { 'IS_MY_COMPANY': 'Y' },
                select: ['ID', 'TITLE']
            });

            return data.result.map(comp => ({
                id: parseInt(comp.ID),
                name: comp.TITLE
            }));
        } catch (e) {
            this.logger.error(`Ошибка получения списка организаций: ${e.message}`);
            return [];
        }
    }

    async getDealStage(dealId: number): Promise<string | null> {
        try {
            const data = await this.callRestMethod('crm.deal.get', { id: dealId });
            return data.result?.STAGE_ID || null;
        } catch (e) {
            this.logger.error(`Ошибка получения стадии сделки ${dealId}: ${e.message}`);

            return null;
        }
    }
    async getProductsInfo(productIds: number[] = []) {
        if (productIds.length === 0 && arguments.length > 0) return {};

        try {

            let allSections: any[] = [];
            let sectionStart = 0;
            let sectionHasMore = true;

            while (sectionHasMore) {
                const res = await this.callRestMethod('crm.productsection.list', {
                    select: ['ID', 'NAME', 'SECTION_ID'],
                    order: { 'ID': 'ASC' },
                    start: sectionStart
                });

                if (res.result) {
                    allSections = [...allSections, ...res.result];
                }

                if (res.next) {
                    sectionStart = res.next;
                } else {
                    sectionHasMore = false;
                }
            }

            const sectionsMap = new Map();
            if (allSections.length > 0) {
                allSections.forEach((s: any) => {
                    sectionsMap.set(s.ID, s.NAME);
                });
            }


            const filter: any = {};

            if (productIds.length > 0) {

                filter['ID'] = productIds;
            } else {
                // --- ХАРДКОД ДЛЯ ПРАЙСА (ВЕТКА ПРП) ---
                const rootId = 1246; // ID папки ПРП


                const getSubSectionIds = (parentId: number, sections: any[]): number[] => {
                    const children = sections.filter(s => Number(s.SECTION_ID) === parentId);
                    let ids: number[] = [];
                    children.forEach(child => {
                        const childId = Number(child.ID);
                        ids.push(childId);
                        ids = [...ids, ...getSubSectionIds(childId, sections)];
                    });
                    return ids;
                };


                const targetSectionIds = [rootId, ...getSubSectionIds(rootId, allSections)];

                filter['SECTION_ID'] = targetSectionIds;
            }


            let allProducts: any[] = [];
            let productStart = 0;
            let productHasMore = true;

            while (productHasMore) {
                const res = await this.callRestMethod('crm.product.list', {
                    filter,
                    select: ['ID', 'NAME', 'PRICE', 'SECTION_ID', 'MEASURE'],
                    order: { 'ID': 'ASC' },
                    start: productStart
                });

                if (res.result) {
                    allProducts = [...allProducts, ...res.result];
                }

                if (res.next) {
                    productStart = res.next;
                } else {
                    productHasMore = false;
                }


            }


            const measuresResult = await this.callRestMethod('crm.measure.list');
            const measuresMap = new Map();
            if (measuresResult.result) {
                measuresResult.result.forEach((m: any) => {
                    measuresMap.set(m.ID, m.SYMBOL_RUS || m.SYMBOL);
                });
            }


            const dictionary: Record<number, any> = {};

            allProducts.forEach((p: any) => {
                const sectionName = sectionsMap.get(p.SECTION_ID) || 'Без категории';
                const measureName = measuresMap.get(p.MEASURE) || 'шт';

                dictionary[Number(p.ID)] = {
                    name: p.NAME,
                    price: Number(p.PRICE),
                    sectionName: sectionName,
                    unit: measureName
                };
            });

            return dictionary;

        } catch (e) {
            this.logger.error(`Ошибка получения данных о товарах из Битрикс: ${e.message}`);
            return {};
        }
    }

    async seedCompanies(domain: string) {
        const mockCompanies = [
            { TITLE: 'Рога и Копыта ООО', COMPANY_TYPE: 'CUSTOMER', INDUSTRY: 'MANUFACTURING' },
            { TITLE: 'Вектор АйТи Групп', COMPANY_TYPE: 'PARTNER', INDUSTRY: 'IT' },
            { TITLE: 'СтройМонтажСервис', COMPANY_TYPE: 'CUSTOMER', INDUSTRY: 'CONSTRUCTION' },
            { TITLE: 'ИП Калинин (Логистика)', COMPANY_TYPE: 'SUPPLIER', INDUSTRY: 'LOGISTICS' },
            { TITLE: 'Северный Ветер ЗАО', COMPANY_TYPE: 'CUSTOMER', INDUSTRY: 'OTHER' }
        ];

        const results: string[] = [];
        this.logger.log(`🌱 Seeding Bitrix24 (${domain}) with companies...`);

        for (const company of mockCompanies) {
            try {

                const data = await this.callRestMethod('crm.company.add', { fields: company });

                if (data.result) {
                    results.push(`Created: ${company.TITLE} (ID: ${data.result})`);
                }
            } catch (error) {
                this.logger.error(`Error creating ${company.TITLE}: ${error.message}`);
                results.push(`Failed: ${company.TITLE}`);
            }
        }

        return { status: 'success', log: results };
    }

    async seedProducts(domain: string) {
        const mockProducts = [
            { NAME: 'Горбуша ПБГ (блочная)', PRICE: 450.00, CURRENCY_ID: 'RUB', MEASURE: 1 },
            { NAME: 'Форель радужная с/г', PRICE: 650.50, CURRENCY_ID: 'RUB', MEASURE: 1 },
            { NAME: 'Икра кеты (весовая)', PRICE: 3500.00, CURRENCY_ID: 'RUB', MEASURE: 1 },
            { NAME: 'Семга филе', PRICE: 1200.00, CURRENCY_ID: 'RUB', MEASURE: 1 }
        ];

        const results: string[] = [];
        this.logger.log(`🌱 Seeding Bitrix24 (${domain}) with products...`);

        for (const product of mockProducts) {
            try {
                const data = await this.callRestMethod('crm.product.add', { fields: product });
                if (data.result) {
                    results.push(`Created: ${product.NAME} (ID: ${data.result})`);
                }
            } catch (error) {
                this.logger.error(`Error creating ${product.NAME}: ${error.message}`);
                results.push(`Failed: ${product.NAME}`);
            }
        }
        return { status: 'success', log: results };
    }


    async handleInstallation(installDto: InstallBitrixDto) {
        this.logger.log(`🚀 Start Bitrix Installation for ${installDto.DOMAIN}`);

        if (!installDto.member_id || !installDto.AUTH_ID) {
            throw new Error('Invalid installation data: missing member_id or AUTH_ID');
        }

        await this.saveInstallation(installDto);
        return { status: 'success', message: 'Installation complete' };
    }

    private async saveInstallation(dto: InstallBitrixDto) {
        const existing = await this.prisma.bitrixInstallation.findUnique({
            where: { memberId: dto.member_id },
        });

        const endpoint = `https://${dto.DOMAIN}/rest/`;
        const dataToSave = {
            accessToken: dto.AUTH_ID,
            refreshToken: dto.REFRESH_ID,
            clientEndpoint: endpoint,
            serverEndpoint: dto.SERVER_ENDPOINT || endpoint,
            isActive: true,
        };

        if (existing) {
            return this.prisma.bitrixInstallation.update({
                where: { memberId: dto.member_id },
                data: dataToSave,
            });
        }

        return this.prisma.bitrixInstallation.create({
            data: {
                memberId: dto.member_id,
                domain: dto.DOMAIN,
                ...dataToSave,
            },
        });
    }


    private async getClient() {

        const install = await this.prisma.bitrixInstallation.findFirst({
            where: { isActive: true }
        });
        if (!install) throw new Error('Нет активных интеграций с Битрикс24');
        return install;
    }

    private async callRestMethod(method: string, params: any = {}) {
        let install = await this.getClient();
        const url = `${install.clientEndpoint}${method}`;

        try {

            const response = await axios.post(url, {
                ...params,
                auth: install.accessToken
            });
            return response.data;
        } catch (error) {

            if (this.isTokenExpired(error)) {
                this.logger.warn(`🔄 Токен истек для ${install.domain}. Обновляем...`);

                install = await this.refreshToken(install);

                const retryUrl = `${install.clientEndpoint}${method}`;
                const response = await axios.post(retryUrl, {
                    ...params,
                    auth: install.accessToken
                });
                return response.data;
            }

            throw error;
        }
    }

    private isTokenExpired(error: any): boolean {

        if (error.response && error.response.status === 401) {
            const data = error.response.data;
            return data.error === 'expired_token' || data.error === 'invalid_token';
        }
        return false;
    }

    private async refreshToken(install: any) {

        const oauthUrl = 'https://oauth.bitrix.info/oauth/token/';

        const clientId = process.env.BITRIX_CLIENT_ID;
        const clientSecret = process.env.BITRIX_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('BITRIX_CLIENT_ID и BITRIX_CLIENT_SECRET должны быть заданы в .env для обновления токенов');
        }

        try {
            const response = await axios.get(oauthUrl, {
                params: {
                    grant_type: 'refresh_token',
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: install.refreshToken
                }
            });

            const newTokens = response.data;


            const updatedInstall = await this.prisma.bitrixInstallation.update({
                where: { memberId: install.memberId },
                data: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token,

                }
            });

            this.logger.log(`✅ Токен успешно обновлен для ${install.domain}`);
            return updatedInstall;

        } catch (error) {
            this.logger.error('❌ Не удалось обновить токен. Возможно, refresh_token тоже истек или ключи приложения неверны.');
            throw error;
        }
    }

    async registerPlacements() {

        let appUrl = process.env.FRONTEND_URL;

        if (!appUrl) {
            const errorMsg = '❌ Ошибка: В файле .env не указан FRONTEND_URL. Регистрация мест встройки невозможна.';
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (appUrl.endsWith('/')) {
            appUrl = appUrl.slice(0, -1);
        }

        const placements = [
            {
                PLACEMENT: 'CRM_COMPANY_DETAIL_TAB',
                HANDLER: `${appUrl}/embedded/company-goods`,
                TITLE: 'Товары поставщика',
                DESCRIPTION: 'Управление товарами поставщика'
            },
            {
                PLACEMENT: 'CRM_DEAL_DETAIL_TAB',
                HANDLER: `${appUrl}/embedded/deal-tab`,
                TITLE: 'Складские операции',
                DESCRIPTION: 'Подбор и закупка товара'
            }
        ];

        const log: string[] = [];

        for (const p of placements) {
            try {
                await this.callRestMethod('placement.unbind', {
                    PLACEMENT: p.PLACEMENT,
                    HANDLER: p.HANDLER
                });
            } catch (e) {  }

            try {
                await this.callRestMethod('placement.bind', p);
                log.push(`✅ Registered: ${p.TITLE} (${p.PLACEMENT}) -> ${p.HANDLER}`);
            } catch (e) {
                log.push(`❌ Error ${p.TITLE}: ${e.message}`);
            }
        }

        return { status: 'success', log };
    }

    async generateDocument(params: {
        templateId: number;
        entityTypeId: number;
        entityId: number;
        values: any;
        fields?: any;
    }) {
        try {
            const payload: any = {
                templateId: params.templateId,
                entityTypeId: params.entityTypeId,
                entityId: params.entityId,
                values: params.values,
            };

            if (params.fields) {
                payload.fields = params.fields;
            }
            const response = await this.callRestMethod('crm.documentgenerator.document.add', payload);

            return response.result;
        } catch (e) {
            this.logger.error(`Ошибка генерации документа: ${e.message}`);
            throw e;
        }
    }
}