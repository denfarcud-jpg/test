import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { SalesInvoiceService } from './sales-invoice.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { GetSalesInvoicesFilterDto } from './dto/get-sales-invoices-filter.dto';

@Controller('sales-invoice')
export class SalesInvoiceController {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {}

  @Post()
  create(@Body() createSalesInvoiceDto: CreateSalesInvoiceDto) {
    return this.salesInvoiceService.create(createSalesInvoiceDto);
  }

  @Get()
  findAll(@Query() filters: GetSalesInvoicesFilterDto) {
    return this.salesInvoiceService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesInvoiceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalesInvoiceDto: UpdateSalesInvoiceDto) {
    return this.salesInvoiceService.update(+id, updateSalesInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesInvoiceService.remove(+id);
  }

  @Get(':id/print')
  async print(@Param('id', ParseIntPipe) id: number) {
    return this.salesInvoiceService.printBitrix(id);
  }
}