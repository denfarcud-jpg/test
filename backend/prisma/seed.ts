import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Начинаем посев данных (Seeding)...');

    const tableNames = [
        'reservation',
        'write_off_act_item', 'write_off_act',
        'posting_item', 'posting',
        'sales_invoice_item', 'sales_invoice',
        'receipt_item', 'receipt',
        'store',
    ];

    for (const tableName of tableNames) {
        try {

            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        } catch (error) {
            console.log(`⚠️ Ошибка очистки таблицы ${tableName} (возможно, её нет):`, error);
        }
    }
    console.log('🧹 База данных очищена.');


    const mainStore = await prisma.store.create({
        data: { name: 'Основной склад' }
    });
    const virtualStore = await prisma.store.create({
        data: { name: 'Виртуальный склад' }
    });
    console.log('🏭 Склады созданы.');


    const myOrg = { id: 1, name: 'ООО "Промрыбопродукт"' };
    const supplier = { id: 10, name: 'ООО "РыбПромСнаб" (Поставщик)' };
    const buyer = { id: 12, name: 'ИП Петров (Покупатель)' };

    const prodSalmon = { id: 100, name: 'Горбуша ПБГ' };
    const prodCaviar = { id: 101, name: 'Икра лососевая зернистая' };
    const prodTrout = { id: 102, name: 'Форель радужная' };

    await prisma.receipt.create({
        data: {
            numReceipt: 'IN-OCT-001',
            dateReceipt: new Date('2023-10-15T10:00:00Z'),
            dateConducted: new Date('2023-10-16T12:00:00Z'),
            status: 'Проведен',
            responsible: 'Иванов И.И.',
            storeId: mainStore.id,

            bitrixPartnerId: supplier.id,
            partnerName: supplier.name,
            bitrixOrgId: myOrg.id,
            orgName: myOrg.name,

            totalSum: 150000.00,
            items: {
                create: [
                    {
                        bitrixProductId: prodSalmon.id,
                        productName: prodSalmon.name,
                        countProduct: 200,
                        unit: 'кг',
                        priceProduct: 450,
                        countLocation: 20
                    },
                    {
                        bitrixProductId: prodCaviar.id,
                        productName: prodCaviar.name,
                        countProduct: 50,
                        unit: 'кг',
                        priceProduct: 3000,
                        countLocation: 100
                    }
                ]
            }
        }
    });

    await prisma.salesInvoice.create({
        data: {
            numShipment: 'OUT-0001',
            dateShipment: new Date(),
            status: 'Черновик',
            responsible: 'Менеджер Смирнов',
            storeId: mainStore.id,

            bitrixPartnerId: buyer.id,
            partnerName: buyer.name,
            bitrixOrgId: myOrg.id,
            orgName: myOrg.name,
            bitrixDealId: 555,

            totalSum: 6500.00,
            items: {
                create: [
                    {
                        bitrixProductId: prodSalmon.id,
                        productName: prodSalmon.name,
                        countProduct: 10.000,
                        unit: 'кг',
                        priceProduct: 650.00,
                        countLocation: 1,
                    }
                ]
            }
        }
    });

    console.log('📤 Реализация создана.');




    await prisma.posting.create({
        data: {
            numPosting: 'INC-OLD-2023',
            datePosting: new Date('2023-11-15T10:00:00Z'),
            dateConducted: new Date('2023-11-15T12:00:00Z'),
            status: 'Проведен',
            responsible: 'Архивариус',
            storeId: mainStore.id,
            bitrixOrgId: 10448,
            orgName: 'ООО "Промрыбопродукт"',
            totalSum: 150000.00,
            items: {
                create: [
                    { bitrixProductId: prodSalmon.id, productName: prodSalmon.name, countProduct: 300, unit: 'кг', priceProduct: 500, countLocation: 10 }
                ]
            }
        }
    });

    console.log('➕ Оприходование создано.');

    await prisma.writeOffAct.create({
        data: {
            numCancellation: 'WO-OLD-001',
            dateCancellation: new Date('2023-11-01T10:00:00Z'),
            dateConducted: new Date('2023-11-01T11:00:00Z'),
            status: 'Проведен',
            responsible: 'Кладовщик Сидоров',
            storeId: mainStore.id,
            bitrixOrgId: myOrg.id,
            orgName: myOrg.name,
            bitrixDealId: 1001,
            totalSum: 900.00,
            items: {
                create: [
                    {
                        bitrixProductId: prodSalmon.id,
                        productName: prodSalmon.name + ' (Испорчен)',
                        countProduct: 2,
                        unit: 'кг',
                        priceProduct: 450,
                        countLocation: 2
                    }
                ]
            }
        }
    });


    await prisma.writeOffAct.create({
        data: {
            numCancellation: 'WO-NEW-DRAFT',
            dateCancellation: new Date(),
            dateConducted: null,
            status: 'Черновик',
            responsible: 'Менеджер Иванов',
            storeId: virtualStore.id,
            bitrixOrgId: myOrg.id,
            orgName: myOrg.name,
            totalSum: 3000.00,
            items: {
                create: [
                    { bitrixProductId: prodCaviar.id, productName: prodCaviar.name, countProduct: 1, unit: 'кг', priceProduct: 3000, countLocation: 10 }
                ]
            }
        }
    });
    console.log('🗑️ Тестовые Списания созданы.');



    console.log('🧪 Генерируем данные для отчета "Движение товара"...');


    const SCENARIO_PRODUCT_ID = 13722;
    const SCENARIO_DATE = new Date('2025-12-09T10:00:00.000Z');


    await prisma.receipt.create({
        data: {
            numReceipt: 'IN-HISTORY-001',
            dateReceipt: SCENARIO_DATE,
            dateConducted: SCENARIO_DATE,
            status: 'Проведен',
            responsible: 'Тест-Админ',
            storeId: mainStore.id,
            bitrixPartnerId: supplier.id,
            partnerName: supplier.name,
            bitrixOrgId: myOrg.id,
            orgName: myOrg.name,
            totalSum: 50000,
            items: {
                create: {
                    bitrixProductId: SCENARIO_PRODUCT_ID,
                    productName: 'Барабуля (Тест истории)',
                    countProduct: 100,
                    unit: 'шт',
                    priceProduct: 500,
                    countLocation: 10
                }
            }
        }
    });


    await prisma.salesInvoice.create({
        data: {
            numShipment: 'OUT-HISTORY-001',
            dateShipment: SCENARIO_DATE,
            dateConducted: SCENARIO_DATE,
            status: 'Проведен',
            responsible: 'Тест-Админ',
            storeId: mainStore.id,
            bitrixPartnerId: buyer.id,
            partnerName: buyer.name,
            bitrixOrgId: myOrg.id,
            orgName: myOrg.name,
            totalSum: 15000,
            items: {
                create: {
                    bitrixProductId: SCENARIO_PRODUCT_ID,
                    productName: 'Барабуля (Тест истории)',
                    countProduct: 20,
                    unit: 'шт',
                    priceProduct: 750,
                    countLocation: 2
                }
            }
        }
    });

    console.log(`✅ Данные для Барабули (ID ${SCENARIO_PRODUCT_ID}) созданы на дату ${SCENARIO_DATE.toISOString()}`);
    console.log('👉 Ожидаемый входящий остаток на 10.12.2025: 80 шт');

    console.log('✅ Seeding успешно завершен!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });