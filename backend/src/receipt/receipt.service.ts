import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { GetReceiptsFilterDto } from './dto/get-receipts-filter.dto';
import { BitrixService } from '../integrations/bitrix/bitrix.service';

@Injectable()
export class ReceiptService {
  constructor(
      private prisma: PrismaService,
      private bitrixService: BitrixService
  ) {}


  private get model() {
    return this.prisma.receipt;
  }
  private readonly entityName = 'Документ прихода';
  private readonly ORDER_TEMPLATE_ID = 72;
  private readonly BITRIX_COMPANY_ENTITY_ID = 4;
  // КАРТА СООТВЕТСТВИЯ: ID Поставщика (Bitrix) -> ID Поля в карточке товара (property_XXX)
  private readonly SUPPLIER_FIELD_MAP: Record<number, number> = {
    10392: 1302, // Белов
    10394: 1304, // Бриз
    10396: 1306, // Вкусное Рыбное
    10398: 1308, // Гарант
    10400: 1310, // Золотой Парус
    10402: 1312, // Иманов
    10404: 1314, // Ластовский
    10406: 1316, // Нептун б/н
    10408: 1318, // ОСК
    10410: 1320, // Речная рыба
    10412: 1322, // Фише
    10414: 1324, // Шустова
    10416: 1354, // ЮВА
    10418: 1352, // Шульга
    10420: 1326, // Арляпов
    10422: 1328, // Беленко
    10424: 1330, // Мельников
    10426: 1332, // Славков
    10428: 1334, // Смаченко
    10430: 1336, // Мазур
    10432: 1338, // ЦПЭЛЖ
    10434: 1340, // ПРП
    10436: 1342, // СКС
    10438: 1344, // Исаков
    10440: 1346, // Старт
    10442: 1348, // Нептун
    10444: 1350, // Туманов
  };

  async create(dto: CreateReceiptDto) {

    const { items, ...receiptData } = dto;

    return this.model.create({
      data: {
        ...receiptData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
  }

  findAll(filters: GetReceiptsFilterDto) {
    const where: any = {};

    if (filters.dateStart || filters.dateEnd) {
      where.dateReceipt = {};
      if (filters.dateStart) {
        where.dateReceipt.gte = new Date(filters.dateStart);
      }
      if (filters.dateEnd) {
        const endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 999);
        where.dateReceipt.lte = endDate;
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
      where.storeId = filters.storeId;
    }

    return this.model.findMany({
      where,
      orderBy: { dateReceipt: 'desc' },
      include: {
        store: true,
        items: true,
      },
    });
  }

 async findOne(id: number) {
    const result = await this.model.findUnique({
      where: { id },
      include: {
        store: true,
        items: true,
      },
    });
   if (!result) {
     throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
   }

   return result;
  }

  async update(id: number, dto: UpdateReceiptDto) {
    const currentDoc = await this.ensureExists(id);
    let warnings: number[] = [];

    const isUnconducting = currentDoc.status === 'Проведен' && dto.status === 'Черновик';
    const isConducting = dto.status === 'Проведен';

    if (isUnconducting) {

        const itemsToCheck = await this.prisma.receiptItem.findMany({ where: { receiptId: id } });

        const checkPayload = itemsToCheck.map(i => ({
            bitrixProductId: i.bitrixProductId,
            productName: i.productName,
            countProduct: 0
        }));

        try {

            await this.validateStockForReceipt(currentDoc.storeId, checkPayload, id);
        } catch (e) {

            if (e instanceof BadRequestException) {
                const response: any = e.getResponse();
                if (response.failedIds) {
                    warnings = response.failedIds;
                }
            } else {
                throw e;
            }
        }
    } else if (isConducting) {



        let itemsToCheck: any[] | undefined = dto.items;

        if (!itemsToCheck) {
             const existingItems = await this.prisma.receiptItem.findMany({ where: { receiptId: id } });


             itemsToCheck = existingItems.map(i => ({
                 bitrixProductId: i.bitrixProductId,
                 productName: i.productName,
                 countProduct: Number(i.countProduct),
                 unit: i.unit,
                 priceProduct: Number(i.priceProduct),
                 countLocation: i.countLocation
             }));
        }

        await this.validateStockForReceipt(currentDoc.storeId, itemsToCheck, id);
    }


    const { items, ...receiptData } = dto;

    const updatedDoc = await this.model.update({
      where: { id },
      data: {
        ...receiptData,
        items: items ? {
          deleteMany: {},
          create: items,
        } : undefined,
      },
      include: { items: true }
    });


    return {
        ...updatedDoc,
        warnings
    };
  }

  async remove(id: number) {
    await this.ensureExists(id);
    return this.model.delete({ where: { id } });
  }

  async checkPrices(id: number) {

    const receipt = await this.findOne(id);


    if (receipt.status !== 'Проведен') {
        throw new Error('Обновлять цены в Битрикс можно только для проведенных документов');
    }

    const partnerId = receipt.bitrixPartnerId;
    if (!partnerId) {
        return { status: 'error', message: 'У накладной не указан ID поставщика в Битрикс' };
    }


    const fieldId = this.SUPPLIER_FIELD_MAP[partnerId];

    if (!fieldId) {

       return {
         status: 'warning',
         message: `Поставщик ID ${partnerId} (${receipt.partnerName}) не найден в карте полей. Цены не обновлены.`
       };
    }

    const updates: string[] = [];
    const errors: string[] = [];

    const propertyKey = `PROPERTY_${fieldId}`;

    console.log(`🚀 [PRICE SYNC] Начинаем выгрузку цен для поставщика ${receipt.partnerName}. Поле: ${propertyKey}`);

    for (const item of receipt.items) {
      if (!item.bitrixProductId) continue;

      try {
        const priceToSync = Number(item.priceProduct);

        await this.bitrixService['callRestMethod']('crm.product.update', {
            id: item.bitrixProductId,
            fields: {
                [propertyKey]: priceToSync
            }
        });

        updates.push(`${item.productName}: установлена цена ${priceToSync} в поле ${propertyKey}`);
      } catch (e) {
        console.error(`Ошибка обновления товара ${item.bitrixProductId}:`, e);
        errors.push(`${item.productName}: ошибка API`);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    return {
      status: 'success',
      message: `Выгружено цен: ${updates.length}. ${errors.length ? 'Ошибок: ' + errors.length : ''}`,
      updates,
      errors
    };
  }

  async generateOrderDocument(id: number) {
    const receipt = await this.findOne(id);

    if (!receipt.bitrixPartnerId) {
      throw new Error('У поставщика не указана связь с Битрикс24 (нет bitrixId)');
    }

    const provider = {
      'PROVIDER': 'Bitrix\\DocumentGenerator\\DataProvider\\ArrayDataProvider',
      'OPTIONS': {
        'ITEM_NAME': 'Item',
        'ITEM_PROVIDER': 'Bitrix\\DocumentGenerator\\DataProvider\\HashDataProvider',
      },
    };

    const values: any = {
      'Title': `Накладная № ${receipt.numReceipt || receipt.id}`,
      'DocumentNumber': receipt.numReceipt || String(receipt.id),
      'DocumentDate': new Date(receipt.dateReceipt).toLocaleDateString('ru-RU'),
      'MyCompany': receipt.orgName ,
      'ClientCompany': receipt.partnerName,
      'TotalSum': Number(receipt.totalSum).toFixed(2),
    };

    const fields: any = {};



    const code = 'Goods';

    const columns = ['No', 'Name', 'Quantity', 'Unit', 'Price', 'Sum', 'Places'];

    values[code] = [];
    fields[code] = provider;

    columns.forEach((col) => {
      values[`${code}Item${col}`] = `${code}.Item.${col}`;
      fields[`${code}Item${col}`] = { TITLE: col };
    });


    values[code] = receipt.items.map((item, index) => ({
      No: String(index + 1),
      Name: String(item.productName),
      Quantity: String(item.countProduct),
      Unit: String(item.unit || 'шт'),
      Price: Number(item.priceProduct).toFixed(2),
      Sum: (Number(item.countProduct) * Number(item.priceProduct)).toFixed(2),
      Places: String(item.countLocation || 0)
    }));

    const initialResult = await this.bitrixService.generateDocument({
      templateId: this.ORDER_TEMPLATE_ID,
      entityTypeId: this.BITRIX_COMPANY_ENTITY_ID,
      entityId: receipt.bitrixPartnerId,
      values: values,
      fields: fields,
    });

    const docId = initialResult.id;
    if (!docId) return initialResult;

    for (let i = 0; i < 15; i++) {

      await new Promise(resolve => setTimeout(resolve, 2000));


      try {

        const docData = await this.bitrixService['callRestMethod']('crm.documentgenerator.document.get', { id: docId });

        const docInfo = docData.result ? docData.result.document : docData;

        if (docInfo && docInfo.pdfUrl) {
          return docInfo;
        }
      } catch (e) {
        console.warn(`Попытка получения PDF ${i} не удалась`, e.message);
      }
    }

    return initialResult;
  }
  async findLastProductPrice(bitrixPartnerId: number, bitrixProductId: number) {

    const lastItem = await this.prisma.receiptItem.findFirst({
      where: {
        bitrixProductId: bitrixProductId,
        receipt: {
          bitrixPartnerId: bitrixPartnerId,
        },
      },

      orderBy: {
        receipt: {
          dateReceipt: 'desc',
        },
      },

      select: {
        priceProduct: true,
      },
    });


    return {
      price: lastItem ? Number(lastItem.priceProduct) : 0,
    };
  }
  async getProductPriceForSupplier(bitrixPartnerId: number, bitrixProductId: number) {
    const fieldId = this.SUPPLIER_FIELD_MAP[bitrixPartnerId];

    if (!fieldId) {
      return { price: null, source: 'none' };
    }

    const propertyKey = `PROPERTY_${fieldId}`;

    try {
      const response = await this.bitrixService['callRestMethod']('crm.product.get', {
        id: bitrixProductId
      });


      const productData = response.result || response;

      let price = 0;
      if (productData && productData[propertyKey]) {
        const rawValue = productData[propertyKey];
        const val = rawValue?.value !== undefined ? rawValue.value : rawValue;
        price = Number(val);
      }

      return {
        price: isNaN(price) ? 0 : price,
        source: 'supplier_card'
      };
    } catch (e) {
      console.error(`❌ Ошибка чтения цены`, e);
      return { price: null, source: 'error' };
    }
  }

  private async ensureExists(id: number) {
    const doc = await this.model.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    return doc;
  }

  private async validateStockForReceipt(storeId: number, itemsToCheck: any[], excludeDocId: number) {
    const invalidItems: string[] = [];
    const invalidIds: number[] = [];

    for (const item of itemsToCheck) {
        const productId = item.bitrixProductId;

        const newQuantity = Number(item.countProduct);

        const receiptsSum = await this.prisma.receiptItem.aggregate({
            _sum: { countProduct: true },
            where: {
                bitrixProductId: productId,
                receipt: {
                    storeId: storeId,
                    status: 'Проведен',
                    id: { not: excludeDocId }
                }
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

        const writeOffsSum = await this.prisma.writeOffActItem.aggregate({
            _sum: { countProduct: true },
            where: {
                bitrixProductId: productId,
                writeOffAct: { storeId: storeId, status: 'Проведен' }
            }
        });

        const totalInOthers = (receiptsSum._sum.countProduct?.toNumber() || 0) + (postingsSum._sum.countProduct?.toNumber() || 0);
        const totalOut = (salesSum._sum.countProduct?.toNumber() || 0) + (writeOffsSum._sum.countProduct?.toNumber() || 0);


        const baseStock = totalInOthers - totalOut;


        const projectedStock = baseStock + newQuantity;

        const safeProjected = Math.round(projectedStock * 1000) / 1000;

        if (safeProjected < 0) {
            invalidItems.push(item.productName);
            invalidIds.push(productId);
        }
    }

    if (invalidItems.length > 0) {

        throw new BadRequestException({
            message: `Невозможно провести документ. Товары имеют отрицательный остаток: ${invalidItems.join(', ')}`,
            failedIds: invalidIds
        });
    }
  }
}