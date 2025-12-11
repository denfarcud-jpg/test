import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {GetReportDto} from './dto/get-report.dto';
import {BitrixService} from '../integrations/bitrix/bitrix.service';

@Injectable()
export class ReportService {
    constructor(private prisma: PrismaService, private bitrixService: BitrixService,) {
    }

    async getResidues(storeId: number) {

        const receipts = await this.prisma.receiptItem.findMany({
            where: {receipt: {storeId, status: 'Проведен'}},
            select: {bitrixProductId: true, productName: true, unit: true, countProduct: true}
        });

        const postings = await this.prisma.postingItem.findMany({
            where: {posting: {storeId, status: 'Проведен'}},
            select: {bitrixProductId: true, productName: true, unit: true, countProduct: true}
        });

        const sales = await this.prisma.salesInvoiceItem.findMany({
            where: {salesInvoice: {storeId, status: 'Проведен'}},
            select: {bitrixProductId: true, productName: true, unit: true, countProduct: true}
        });

        const writeOffs = await this.prisma.writeOffActItem.findMany({
            where: {writeOffAct: {storeId, status: 'Проведен'}},
            select: {bitrixProductId: true, productName: true, unit: true, countProduct: true}
        });


        const balances = new Map<number, any>();


        const processItem = (item: any, multiplier: number) => {
            const id = item.bitrixProductId;
            const qty = Number(item.countProduct) * multiplier;

            if (!balances.has(id)) {
                balances.set(id, {
                    id: id, name: item.productName, unit: item.unit, balance: 0
                });
            }

            const entry = balances.get(id);
            entry.balance += qty;
        };


        receipts.forEach(i => processItem(i, 1));
        postings.forEach(i => processItem(i, 1));


        sales.forEach(i => processItem(i, -1));
        writeOffs.forEach(i => processItem(i, -1));


        return Array.from(balances.values());
    }


    async getStockReport(dto: GetReportDto) {
        const date = dto.dateEnd ? new Date(dto.dateEnd) : new Date();
        date.setHours(23, 59, 59, 999);

        const storeId = dto.storeId;


        const whereClause = {
            storeId,
            status: 'Проведен',
            dateConducted: { lte: date },
        };

        const receipts = await this.prisma.receiptItem.findMany({
            where: { receipt: whereClause },
        });

        const postings = await this.prisma.postingItem.findMany({
            where: { posting: whereClause },
        });


        const sales = await this.prisma.salesInvoiceItem.findMany({
            where: { salesInvoice: whereClause },
        });

        const writeOffs = await this.prisma.writeOffActItem.findMany({
            where: { writeOffAct: whereClause },
        });


        const productsMap = new Map<number, {
            id: number;
            totalQtyIn: number;
            totalCostIn: number;
            currentQty: number;
        }>();


        const addToMap = (items: any[]) => {
            items.forEach((item) => {
                const pid = item.bitrixProductId;
                if (!productsMap.has(pid)) {
                    productsMap.set(pid, {
                        id: pid, totalQtyIn: 0, totalCostIn: 0, currentQty: 0,
                    });
                }
                const p = productsMap.get(pid)!;
                const qty = Number(item.countProduct);
                const price = Number(item.priceProduct);

                p.currentQty += qty;


                p.totalQtyIn += qty;
                p.totalCostIn += qty * price;
            });
        };


        const subtractFromMap = (items: any[]) => {
            items.forEach((item) => {
                const pid = item.bitrixProductId;
                if (productsMap.has(pid)) {
                    const p = productsMap.get(pid)!;
                    p.currentQty -= Number(item.countProduct);
                }
            });
        };

        addToMap(receipts);
        addToMap(postings);
        subtractFromMap(sales);
        subtractFromMap(writeOffs);


        const productIds = Array.from(productsMap.keys());


        const bitrixInfo = await this.bitrixService.getProductsInfo(productIds);

        const report: any[] = [];
        for (const [id, data] of productsMap.entries()) {


            const avgCost = data.totalQtyIn > 0 ? data.totalCostIn / data.totalQtyIn : 0;


            const info = bitrixInfo[id] || { name: 'Удаленный товар', unit: 'шт' };

            report.push({
                id,
                name: info.name,
                unit: info.unit,
                balance: Number(data.currentQty.toFixed(2)),
                cost: Number(avgCost.toFixed(2)),
                sum: Number((data.currentQty * avgCost).toFixed(2)),
            });
        }


        report.sort((a, b) => a.name.localeCompare(b.name));

        return report;
    }

    async getSalesReport(dto: GetReportDto) {
        const storeId = dto.storeId;
        const startDate = dto.dateStart ? new Date(dto.dateStart) : new Date(0);
        const endDate = dto.dateEnd ? new Date(dto.dateEnd) : new Date();
        endDate.setHours(23, 59, 59, 999);


        const salesItems = await this.prisma.salesInvoiceItem.findMany({
            where: {
                salesInvoice: {
                    storeId: storeId,
                    status: 'Проведен',
                    dateShipment: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        });

        if (salesItems.length === 0) return [];


        const productIds = [...new Set(salesItems.map(i => i.bitrixProductId))];


        const bitrixData = await this.bitrixService.getProductsInfo(productIds);


        const costMap = await this.calculateAvgCostForProducts(productIds, storeId);


        const reportMap = new Map<number, any>();

        for (const item of salesItems) {
            const pid = item.bitrixProductId;
            const qty = Number(item.countProduct);


            const bxInfo = bitrixData[pid] || { name: item.productName, price: 0, sectionName: 'Неизвестно', unit: item.unit };


            const costPerUnit = costMap.get(pid) || 0;


            const retailPrice = bxInfo.price;

            if (!reportMap.has(pid)) {
                reportMap.set(pid, {
                    id: pid,
                    sectionName: bxInfo.sectionName,
                    name: bxInfo.name,
                    unit: bxInfo.unit,
                    quantity: 0,
                    retailPrice: retailPrice,
                    costPerUnit: costPerUnit,
                });
            }

            const entry = reportMap.get(pid);
            entry.quantity += qty;
        }


        const result = Array.from(reportMap.values()).map(item => {
            const revenue = item.retailPrice * item.quantity;
            const totalCost = item.costPerUnit * item.quantity;
            const grossProfit = revenue - totalCost;

            let markupPercent = 0;
            if (item.costPerUnit > 0) {
                markupPercent = ((item.retailPrice - item.costPerUnit) / item.costPerUnit) * 100;
            }

            return {
                sectionName: item.sectionName,
                name: item.name,
                quantity: Number(item.quantity.toFixed(3)),
                unit: item.unit,
                price: Number(item.retailPrice.toFixed(2)),
                costPerUnit: Number(item.costPerUnit.toFixed(2)),
                revenue: Number(revenue.toFixed(2)),
                totalCost: Number(totalCost.toFixed(2)),
                grossProfit: Number(grossProfit.toFixed(2)),
                markupPercent: Number(markupPercent.toFixed(2))
            };
        });


        result.sort((a, b) => {
            if (a.sectionName === b.sectionName) {
                return a.name.localeCompare(b.name);
            }
            return a.sectionName.localeCompare(b.sectionName);
        });

        return result;
    }

    async getMovementReport(dto: GetReportDto) {
        if (!dto.productId) return [];

        const storeId = dto.storeId;
        const startDate = dto.dateStart ? new Date(dto.dateStart) : new Date(0);
        const endDate = dto.dateEnd ? new Date(dto.dateEnd) : new Date();
        endDate.setHours(23, 59, 59, 999);


        const getSumBeforeDate = async (modelDelegate: any, relationField: string, isIncoming: boolean) => {
            const agg = await modelDelegate.aggregate({
                _sum: { countProduct: true },
                where: {
                    bitrixProductId: dto.productId,
                    [relationField]: {
                        storeId,
                        status: 'Проведен',
                        dateConducted: { lt: startDate }
                    }
                }
            });
            return Number(agg._sum.countProduct || 0);
        };

        const incomingReceiptsBefore = await getSumBeforeDate(this.prisma.receiptItem, 'receipt', true);
        const incomingPostingsBefore = await getSumBeforeDate(this.prisma.postingItem, 'posting', true);
        const outgoingSalesBefore = await getSumBeforeDate(this.prisma.salesInvoiceItem, 'salesInvoice', false);
        const outgoingWriteOffsBefore = await getSumBeforeDate(this.prisma.writeOffActItem, 'writeOffAct', false);


        let currentBalance = (incomingReceiptsBefore + incomingPostingsBefore) - (outgoingSalesBefore + outgoingWriteOffsBefore);


        const wherePeriod = {
            storeId,
            status: 'Проведен',
            dateConducted: { gte: startDate, lte: endDate }
        };

        const getItemsForPeriod = async (model: any, relationField: string, typeLabel: string, partnerField: string | null) => {
            const docs = await model.findMany({
                where: wherePeriod,
                include: {
                    [relationField]: {
                        where: { bitrixProductId: dto.productId }
                    }
                },
                orderBy: { dateConducted: 'asc' }
            });


            const result: any[] = [];
            for (const doc of docs) {

                const items = doc[relationField];
                if (items && items.length > 0) {
                    const qty = items.reduce((sum: number, i: any) => sum + Number(i.countProduct), 0);
                    const price = Number(items[0].priceProduct);


                    let partnerName = '';
                    if (partnerField && doc[partnerField]) {
                        partnerName = doc[partnerField];
                    }


                    let visibleDocNumber = '';

                    if ('numReceipt' in doc) visibleDocNumber = doc.numReceipt || `Приход №${doc.id}`;
                    else if ('numPosting' in doc) visibleDocNumber = doc.numPosting || `Оприх. №${doc.id}`;
                    else if ('numShipment' in doc) visibleDocNumber = doc.numShipment || `Реал. №${doc.id}`;
                    else if ('numCancellation' in doc) visibleDocNumber = doc.numCancellation || `Спис. №${doc.id}`;

                    result.push({
                        rawDate: doc.dateConducted,
                        type: typeLabel,
                        date: doc.dateConducted,
                        docNumber: visibleDocNumber,
                        partner: partnerName,
                        quantity: qty,
                        price: price,
                        docId: doc.id,
                        isIncoming: (typeLabel === 'Приход')
                    });
                }
            }
            return result;
        };

        const rItems = await getItemsForPeriod(this.prisma.receipt, 'items', 'Приход', 'partnerName');
        const pItems = await getItemsForPeriod(this.prisma.posting, 'items', 'Приход', null);
        const sItems = await getItemsForPeriod(this.prisma.salesInvoice, 'items', 'Расход', 'partnerName');
        const wItems = await getItemsForPeriod(this.prisma.writeOffAct, 'items', 'Расход', null);


        let allMovements = [...rItems, ...pItems, ...sItems, ...wItems];


        allMovements.sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());


        const finalReport: any[] = [];

        for (const move of allMovements) {

            if (move.isIncoming) {
                currentBalance += move.quantity;
            } else {
                currentBalance -= move.quantity;
            }

            finalReport.push({
                type: move.type,
                date: move.date,
                docNumber: move.docNumber,
                partner: move.partner,
                quantity: Number(move.quantity.toFixed(3)),
                balance: Number(currentBalance.toFixed(3)),
                cost: move.price,
                docId: move.docId
            });
        }

        return finalReport;
    }

  async getPriceReport() {

        const bitrixData = await this.bitrixService.getProductsInfo();

        const result = Object.values(bitrixData).map((item: any) => ({
            sectionName: item.sectionName,
            name: item.name,
            unit: item.unit,
            price: item.price
        }));


        result.sort((a, b) => {
            if (a.sectionName === b.sectionName) {
                return a.name.localeCompare(b.name);
            }
            return a.sectionName.localeCompare(b.sectionName);
        });

        return result;
    }
    private async calculateAvgCostForProducts(productIds: number[], storeId?: number): Promise<Map<number, number>> {
        const whereStore = storeId ? { storeId } : {};


        const receipts = await this.prisma.receiptItem.findMany({
            where: {
                bitrixProductId: { in: productIds },
                receipt: { status: 'Проведен', ...whereStore }
            }
        });

        const postings = await this.prisma.postingItem.findMany({
            where: {
                bitrixProductId: { in: productIds },
                posting: { status: 'Проведен', ...whereStore }
            }
        });

        const totals = new Map<number, { qty: number, sum: number }>();

        const processItem = (pid: number, qty: number, price: number) => {
            if (!totals.has(pid)) totals.set(pid, { qty: 0, sum: 0 });
            const t = totals.get(pid)!;
            t.qty += qty;
            t.sum += qty * price;
        };

        receipts.forEach(i => processItem(i.bitrixProductId, Number(i.countProduct), Number(i.priceProduct)));
        postings.forEach(i => processItem(i.bitrixProductId, Number(i.countProduct), Number(i.priceProduct)));

        const costMap = new Map<number, number>();
        for (const [pid, data] of totals.entries()) {
            if (data.qty > 0) {
                costMap.set(pid, data.sum / data.qty);
            } else {
                costMap.set(pid, 0);
            }
        }
        return costMap;
    }

}