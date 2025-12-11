import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { BitrixService } from '../integrations/bitrix/bitrix.service';
import { GetSalesInvoicesFilterDto } from './dto/get-sales-invoices-filter.dto';

@Injectable()
export class SalesInvoiceService {
  constructor(
      private prisma: PrismaService,
      private bitrixService: BitrixService
  ) {}

  private get model() {
    return this.prisma.salesInvoice;
  }
  private readonly entityName = 'Реализация';

  async create(dto: CreateSalesInvoiceDto) {

    if (dto.status === 'Проведен') {
      await this.validateStock(Number(dto.storeId), dto.items);
    }

    const { items, ...docData } = dto;

    return this.model.create({
      data: {
        ...docData,
        bitrixDealId: docData.bitrixDealId || 0,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
  }

  findAll(filters: GetSalesInvoicesFilterDto) {
    const where: any = {};

    if (filters.dateStart || filters.dateEnd) {
      where.dateShipment = {};
      if (filters.dateStart) {
        where.dateShipment.gte = new Date(filters.dateStart);
      }
      if (filters.dateEnd) {
        const endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 999);
        where.dateShipment.lte = endDate;
      }
    }

    if (filters.conductedStart || filters.conductedEnd) {
      where.dateConducted = {};
      if (filters.conductedStart) {
        where.dateConducted.gte = new Date(filters.conductedStart);
      }
      if (filters.conductedEnd) {
        const endDate = new Date(filters.conductedEnd);
        endDate.setHours(23, 59, 59, 999);
        where.dateConducted.lte = endDate;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }


    if (filters.storeId) {
      where.storeId = Number(filters.storeId);
    }

    return this.model.findMany({
      where,
      orderBy: { dateShipment: 'desc' },
      include: {
        store: true,
        items: true,
      },
    });
  }

  async findOne(id: number) {
    const doc = await this.model.findUnique({
      where: { id },
      include: {
        store: true,
        items: true,
      },
    });

    if (!doc) {
      throw new NotFoundException(`${this.entityName} с ID ${id} не найдена`);
    }

    return doc;
  }

  async update(id: number, dto: UpdateSalesInvoiceDto) {
    await this.ensureExists(id);

    if (dto.status === 'Проведен') {


       let itemsToCheck = dto.items;
       if (!itemsToCheck) {
         const currentDoc = await this.findOne(id);
         itemsToCheck = currentDoc.items.map(i => ({
             bitrixProductId: i.bitrixProductId,
             countProduct: Number(i.countProduct),
             productName: i.productName, unit: i.unit, priceProduct: Number(i.priceProduct), countLocation: i.countLocation
         }));
       }

       await this.validateStock(Number(dto.storeId), itemsToCheck, id);
    }

    const { items, ...docData } = dto;


    await this.model.update({
      where: { id },
      data: docData,
    });

    if (items) {
        await this.prisma.salesInvoiceItem.deleteMany({
            where: { salesInvoiceId: id }
        });

        await this.model.update({
            where: { id },
            data: {
                items: {
                    create: items
                }
            }
        });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.ensureExists(id);
    return this.model.delete({ where: { id } });
  }
  async printBitrix(id: number) {
    const doc = await this.findOne(id);

    if (!doc.bitrixPartnerId) {
      throw new Error('У покупателя нет связи с Битрикс24');
    }

    const itemsArray = doc.items.map((item, index ) => ({
      No: index + 1,
      Name: item.productName,
      Quantity: Number(item.countProduct),
      Unit: item.unit,
      Price: Number(item.priceProduct).toFixed(2),
      Sum: (Number(item.countProduct) * Number(item.priceProduct)).toFixed(2)
    }));

    const values = {
      DocumentNumber: doc.numShipment || String(doc.id),
      MyCompany: doc.orgName || 'Наша Компания',
      ClientCompany: doc.partnerName,
      TotalSum: Number(doc.totalSum).toFixed(2),


      Goods: itemsArray
    };


    const TEMPLATE_ID = 40;

    return this.bitrixService.generateDocument({
      templateId: TEMPLATE_ID,
      entityTypeId: 4,
      entityId: doc.bitrixPartnerId,
      values: values
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.model.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`${this.entityName} с ID ${id} не найдена`);
    }
  }


  private async validateStock(storeId: number, items: any[], excludeDocId?: number) {
    for (const item of items) {
      const productId = item.bitrixProductId;
      const requestedQty = Number(item.countProduct);


      const receiptsSum = await this.prisma.receiptItem.aggregate({
        _sum: { countProduct: true },
        where: {
          bitrixProductId: productId,
          receipt: {
            storeId: storeId,
            status: 'Проведен'
          }
        }
      });


      const postingsSum = await this.prisma.postingItem.aggregate({
        _sum: { countProduct: true },
        where: {
          bitrixProductId: productId,
          posting: {
            storeId: storeId,
            status: 'Проведен'
          }
        }
      });


      const salesWhere: any = {
        bitrixProductId: productId,
        salesInvoice: {
          storeId: storeId,
          status: 'Проведен'
        }
      };

      if (excludeDocId) {
        salesWhere.salesInvoice.id = { not: excludeDocId };
      }

      const salesSum = await this.prisma.salesInvoiceItem.aggregate({
        _sum: { countProduct: true },
        where: salesWhere
      });


      const writeOffsSum = await this.prisma.writeOffActItem.aggregate({
        _sum: { countProduct: true },
        where: {
          bitrixProductId: productId,
          writeOffAct: {
            storeId: storeId,
            status: 'Проведен'
          }
        }
      });

      const totalIn = (receiptsSum._sum.countProduct?.toNumber() || 0) + (postingsSum._sum.countProduct?.toNumber() || 0);
      const totalOut = (salesSum._sum.countProduct?.toNumber() || 0) + (writeOffsSum._sum.countProduct?.toNumber() || 0);

      const currentBalance = totalIn - totalOut;


      const safeBalance = Math.round(currentBalance * 1000) / 1000;
      const safeRequest = Math.round(requestedQty * 1000) / 1000;

      if (safeBalance < safeRequest) {
        throw new BadRequestException(
          `Недостаточно товара "${item.productName}" на складе. Доступно: ${safeBalance}, Требуется: ${safeRequest}`
        );
      }
    }
  }
}