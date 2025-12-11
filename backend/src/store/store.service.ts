import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  private get model() {
    return this.prisma.store;
  }
  private readonly entityName = 'Склад';

  create(dto: CreateStoreDto) {
    return this.model.create({ data: dto });
  }

  findAll() {
    return this.model.findMany({
      orderBy: { id: 'asc' },
      include: {

        receipts: true,
        sales: true,
        postings: true,
        writeOffs: true,
        reservations: true,

      }
    });
  }

  async findOne(id: number) {
    const store = await this.model.findUnique({
      where: { id },
      include: {

        receipts: true,
        sales: true,
        postings: true,
        writeOffs: true,
        reservations: true,

      }
    });

    if (!store) {
      throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    }

    return store;
  }

  async update(id: number, dto: UpdateStoreDto) {
    await this.ensureExists(id);
    return this.model.update({
      where: { id },
      data: dto,
    });
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
}