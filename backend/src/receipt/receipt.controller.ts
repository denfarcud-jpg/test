import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { GetReceiptsFilterDto } from './dto/get-receipts-filter.dto';

@Controller('receipt')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post()
  create(@Body() createReceiptDto: CreateReceiptDto) {
    return this.receiptService.create(createReceiptDto);
  }

  @Get()
  findAll(@Query() filters: GetReceiptsFilterDto) {
    return this.receiptService.findAll(filters);
  }

  @Get('last-price')
  getLastPrice(
      @Query('partnerId') partnerId: string,
      @Query('productId') productId: string,
  ) {
    return this.receiptService.findLastProductPrice(+partnerId, +productId);
  }

  @Get('supplier-price')
  getSupplierPrice(
      @Query('partnerId') partnerId: string,
      @Query('productId') productId: string,
  ) {
    return this.receiptService.getProductPriceForSupplier(+partnerId, +productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receiptService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReceiptDto: UpdateReceiptDto) {
    return this.receiptService.update(+id, updateReceiptDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receiptService.remove(+id);
  }

  @Post(':id/check-prices')
  checkPrices(@Param('id') id: string) {
    return this.receiptService.checkPrices(+id);
  }

  @Get(':id/generate-order')
  async generateOrder(@Param('id') id: string) {
    return await this.receiptService.generateOrderDocument(+id);
  }

}
