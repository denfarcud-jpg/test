import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetReportDto } from './dto/get-report.dto';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('residues')
  getResidues(@Query('storeId') storeId: string) {
    return this.reportService.getResidues(+storeId);
  }
  @Get()
  async getReport(@Query() query: GetReportDto) {
    switch (query.reportType) {
      case 'stock':
        return this.reportService.getStockReport(query);
      case 'sales':
        return this.reportService.getSalesReport(query);
      case 'price':
        return this.reportService.getPriceReport();
      case 'movement':
        return this.reportService.getMovementReport(query);
      default:
        return [];
    }
  }
}