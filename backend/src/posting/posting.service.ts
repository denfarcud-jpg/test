import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostingDto } from './dto/create-posting.dto';
import { UpdatePostingDto } from './dto/update-posting.dto';
import { GetPostingsFilterDto } from './dto/get-postings-filter.dto';
import { BitrixService } from '../integrations/bitrix/bitrix.service';

@Injectable()
export class PostingService {
  constructor(
      private prisma: PrismaService,
      private bitrixService: BitrixService
  ) {}

  private get model() {
    return this.prisma.posting;
  }
  private readonly entityName = 'Оприходование';


  private readonly STAGE_NEW = 'C72:NEW';
  private readonly STAGE_WON = 'C72:WON';

  async create(dto: CreatePostingDto) {
    const { items, ...data } = dto;
    return this.model.create({
      data: {
        ...data,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async findAll(filters: GetPostingsFilterDto) {
    const where: any = {};

    if (filters.dateStart || filters.dateEnd) {
      where.datePosting = {};
      if (filters.dateStart) where.datePosting.gte = new Date(filters.dateStart);
      if (filters.dateEnd) {
          const end = new Date(filters.dateEnd);
          end.setHours(23, 59, 59, 999);
          where.datePosting.lte = end;
      }
    }

    if (filters.conductedStart || filters.conductedEnd) {
      where.dateConducted = {};
      if (filters.conductedStart) where.dateConducted.gte = new Date(filters.conductedStart);
      if (filters.conductedEnd) {
          const end = new Date(filters.conductedEnd);
          end.setHours(23, 59, 59, 999);
          where.dateConducted.lte = end;
      }
    }

    if (filters.status) where.status = filters.status;
    if (filters.storeId) where.storeId = Number(filters.storeId);

    return this.model.findMany({
      where,
      orderBy: { datePosting: 'desc' },
      include: { store: true, items: true },
    });
  }

  async findOne(id: number) {
    const doc = await this.model.findUnique({
      where: { id },
      include: { store: true, items: true },
    });
    if (!doc) throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    return doc;
  }

  async update(id: number, dto: UpdatePostingDto) {
    const currentDoc = await this.ensureExists(id);
    let warnings: number[] = [];

    const isUnconducting = currentDoc.status === 'Проведен' && dto.status === 'Черновик';
    const isConducting = dto.status === 'Проведен';


    if (isUnconducting) {

        if (currentDoc.bitrixDealId) {
            const stageId = await this.bitrixService.getDealStage(currentDoc.bitrixDealId);


            if (stageId !== this.STAGE_NEW) {

                let errorMsg = `Нельзя отменить проведение: сделка в Битрикс24 уже находится в работе (Стадия: ${stageId || 'Не определена'}).`;

                if (stageId === this.STAGE_WON) {
                    errorMsg = `Нельзя отменить проведение: сделка уже находится в успешной стадии (Стадия: ${stageId}).`;
                }

                throw new BadRequestException(errorMsg);
            }
        }
        const itemsToCheck = await this.prisma.postingItem.findMany({ where: { postingId: id } });
        const checkPayload = itemsToCheck.map(i => ({
            bitrixProductId: i.bitrixProductId,
            productName: i.productName,
            countProduct: 0
        }));

        try {
            await this.validateStock(currentDoc.storeId, checkPayload, id);
        } catch (e) {

            if (e instanceof BadRequestException) {
                const response: any = e.getResponse();
                if (response.failedIds) warnings = response.failedIds;
            } else {
                throw e;
            }
        }
    } else if (isConducting) {

        let itemsToCheck: any[] | undefined = dto.items;

        if (!itemsToCheck) {
             const existingItems = await this.prisma.postingItem.findMany({ where: { postingId: id } });
             itemsToCheck = existingItems.map(i => ({
                 ...i,
                 countProduct: Number(i.countProduct)
             }));
        }
        await this.validateStock(currentDoc.storeId, itemsToCheck, id);
    }

    const { items, ...data } = dto;
    const updatedDoc = await this.model.update({
      where: { id },
      data: {
        ...data,
        items: items ? { deleteMany: {}, create: items } : undefined,
      },
      include: { items: true }
    });

    return { ...updatedDoc, warnings };
  }

  async remove(id: number) {
    const currentDoc = await this.ensureExists(id);


    if (currentDoc.status === 'Проведен') {


        if (currentDoc.bitrixDealId) {
            const stageId = await this.bitrixService.getDealStage(currentDoc.bitrixDealId);


            if (stageId !== this.STAGE_NEW) {

                 let errorMsg = `Нельзя удалить проведенный документ: связанная сделка уже в работе (Стадия: ${stageId || 'Не определена'}).`;

                 if (stageId === this.STAGE_WON) {
                     errorMsg = `Нельзя удалить проведенный документ: сделка уже находится в успешной стадии (Стадия: ${stageId}).`;
                 }

                 throw new BadRequestException(errorMsg);
            }
        }


    }


    return this.model.delete({ where: { id } });
  }

  private async ensureExists(id: number) {
    const doc = await this.model.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    return doc;
  }


  private async validateStock(storeId: number, itemsToCheck: any[], excludeDocId: number) {
    const invalidItems: string[] = [];
    const invalidIds: number[] = [];

    for (const item of itemsToCheck) {
        const productId = item.bitrixProductId;
        const newQuantity = Number(item.countProduct);


        const receiptsSum = await this.prisma.receiptItem.aggregate({
            _sum: { countProduct: true },
            where: { bitrixProductId: productId, receipt: { storeId, status: 'Проведен' } }
        });


        const postingsSum = await this.prisma.postingItem.aggregate({
            _sum: { countProduct: true },
            where: {
                bitrixProductId: productId,
                posting: { storeId, status: 'Проведен', id: { not: excludeDocId } }
            }
        });


        const salesSum = await this.prisma.salesInvoiceItem.aggregate({
            _sum: { countProduct: true },
            where: { bitrixProductId: productId, salesInvoice: { storeId, status: 'Проведен' } }
        });


        const writeOffsSum = await this.prisma.writeOffActItem.aggregate({
            _sum: { countProduct: true },
            where: { bitrixProductId: productId, writeOffAct: { storeId, status: 'Проведен' } }
        });

        const totalInOthers = (receiptsSum._sum.countProduct?.toNumber() || 0) + (postingsSum._sum.countProduct?.toNumber() || 0);
        const totalOut = (salesSum._sum.countProduct?.toNumber() || 0) + (writeOffsSum._sum.countProduct?.toNumber() || 0);

        const baseStock = totalInOthers - totalOut;
        const projectedStock = baseStock + newQuantity;

        if (Math.round(projectedStock * 1000) / 1000 < 0) {
            invalidItems.push(item.productName);
            invalidIds.push(productId);
        }
    }

    if (invalidItems.length > 0) {
        throw new BadRequestException({
            message: `Невозможно провести. Отрицательный остаток: ${invalidItems.join(', ')}`,
            failedIds: invalidIds
        });
    }
  }
}