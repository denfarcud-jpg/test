import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WriteOffActService } from './write-off-act.service';
import { CreateWriteOffActDto } from './dto/create-write-off-act.dto';
import { UpdateWriteOffActDto } from './dto/update-write-off-act.dto';
import { GetWriteOffActsFilterDto } from './dto/get-write-off-acts-filter.dto';

@Controller('write-off-act')
export class WriteOffActController {
  constructor(private readonly service: WriteOffActService) {}

  @Post()
  create(@Body() dto: CreateWriteOffActDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filters: GetWriteOffActsFilterDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWriteOffActDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
