import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWriteOffActDto } from './dto/create-write-off-act.dto';
import { UpdateWriteOffActDto } from './dto/update-write-off-act.dto';
import { GetWriteOffActsFilterDto } from './dto/get-write-off-acts-filter.dto';

@Injectable()
export class WriteOffActService {
  constructor(private prisma: PrismaService) {}


  private get model() {
    return this.prisma.writeOffAct;
  }
  private readonly entityName = 'Акт списания';


  async create(dto: CreateWriteOffActDto) {

    if (dto.status === 'Проведен') {
        await this.validateStock(Number(dto.storeId), dto.items);
    }

    const { items, ...docData } = dto;

    return this.model.create({
      data: {
        ...docData,

        items: {
          create: items,
        },
      },
      include: { items: true },
    });
  }

  findAll(filters: GetWriteOffActsFilterDto) {
    const where: any = {};


    if (filters.dateStart || filters.dateEnd) {
      where.dateCancellation = {};
      if (filters.dateStart) where.dateCancellation.gte = new Date(filters.dateStart);
      if (filters.dateEnd) {
        const endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 999);
        where.dateCancellation.lte = endDate;
      }
    }


    if (filters.conductedStart || filters.conductedEnd) {
      where.dateConducted = {};
      if (filters.conductedStart) where.dateConducted.gte = new Date(filters.conductedStart);
      if (filters.conductedEnd) {
        const endDate = new Date(filters.conductedEnd);
        endDate.setHours(23, 59, 59, 999);
        where.dateConducted.lte = endDate;
      }
    }

    if (filters.status) where.status = filters.status;
    if (filters.storeId) where.storeId = Number(filters.storeId);

    return this.model.findMany({
      where,
      orderBy: { dateCancellation: 'desc' },
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
        items: true
      },
    });

    if (!doc) {
      throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    }

    return doc;
  }

  async update(id: number, dto: UpdateWriteOffActDto) {
    await this.ensureExists(id);


    if (dto.status === 'Проведен') {
        let itemsToCheck = dto.items;

        if (!itemsToCheck) {
            const currentDoc = await this.findOne(id);
            itemsToCheck = currentDoc.items.map(i => ({
                bitrixProductId: i.bitrixProductId,
                countProduct: Number(i.countProduct),
                productName: i.productName,
                unit: i.unit,
                priceProduct: Number(i.priceProduct),
                countLocation: i.countLocation
            }));
        }

        await this.validateStock(Number(dto.storeId), itemsToCheck, id);
    }

    const { items, ...docData } = dto;

    await this.model.update({ where: { id }, data: docData });

    if (items) {
        await this.prisma.writeOffActItem.deleteMany({ where: { writeOffActId: id } });
        await this.model.update({
            where: { id },
            data: { items: { create: items } }
        });
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.model.delete({ where: { id } });
  }

  private async ensureExists(id: number) {
    const exists = await this.model.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    }
  }


  private async validateStock(storeId: number, items: any[], excludeDocId?: number) {
    const errors: string[] = [];

    for (const item of items) {
      const productId = item.bitrixProductId;
      const requestedQty = Number(item.countProduct);


      const receiptsSum = await this.prisma.receiptItem.aggregate({
        _sum: { countProduct: true },
        where: {
          bitrixProductId: productId,
          receipt: { storeId: storeId, status: 'Проведен' }
        }
      });


      const postingsSum = await this.prisma.postingItem.aggregate({
        _sum: { countProduct: true },
        where: {
          bitrixProductId: productId,
          posting: { storeId: storeId, status: 'Проведен' }
        }
      });


      const salesSum = await this.prisma.salesInvoiceItem.aggregate({
        _sum: { countProduct: true },
        where: {
          bitrixProductId: productId,
          salesInvoice: { storeId: storeId, status: 'Проведен' }
        }
      });


      const writeOffWhere: any = {
          bitrixProductId: productId,
          writeOffAct: { storeId: storeId, status: 'Проведен' }
      };


      if (excludeDocId) {
          writeOffWhere.writeOffAct.id = { not: excludeDocId };
      }

      const writeOffsSum = await this.prisma.writeOffActItem.aggregate({
        _sum: { countProduct: true },
        where: writeOffWhere
      });

      const totalIn = (receiptsSum._sum.countProduct?.toNumber() || 0) + (postingsSum._sum.countProduct?.toNumber() || 0);
      const totalOut = (salesSum._sum.countProduct?.toNumber() || 0) + (writeOffsSum._sum.countProduct?.toNumber() || 0);

      const currentBalance = totalIn - totalOut;
      const safeBalance = Math.round(currentBalance * 1000) / 1000;
      const safeRequest = Math.round(requestedQty * 1000) / 1000;

      if (safeBalance < safeRequest) {
          errors.push(`"${item.productName}" (Доступно: ${safeBalance}, Требуется: ${safeRequest})`);
      }
    }

    if (errors.length > 0) {
        throw new BadRequestException(`Недостаточно товара на складе: ${errors.join(', ')}`);
    }
  }
}