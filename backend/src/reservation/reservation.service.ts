import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}


  private get model() {
    return this.prisma.reservation;
  }
  private readonly entityName = 'Резерв';


  create(dto: CreateReservationDto) {
    return this.model.create({
      data: dto,
      include: { store: true }
    });
  }

  findAll() {
    return this.model.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        store: true,
      },
    });
  }


  async findOne(id: number) {
    const reservation = await this.model.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException(`${this.entityName} с ID ${id} не найден`);
    }

    return reservation;
  }

  async update(id: number, dto: UpdateReservationDto) {
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