import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BarcodeService, CreateBarcodeDto, UpdateBarcodeDto } from '../services/barcode.service';

@Controller('inventory/barcodes')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Post()
  create(@Body() createBarcodeDto: CreateBarcodeDto) {
    return this.barcodeService.create(createBarcodeDto);
  }

  @Post('generate')
  generateBarcode(@Body() generateData: { 
    entityType: 'item' | 'variant'; 
    entityId: string; 
    barcodeType?: string;
  }) {
    return this.barcodeService.generateBarcode(
      generateData.entityType, 
      generateData.entityId, 
      generateData.barcodeType
    );
  }

  @Post('bulk-generate')
  bulkGenerate(@Body() items: Array<{id: string, type: 'item' | 'variant'}>) {
    return this.barcodeService.bulkGenerate(items);
  }

  @Get()
  findAll() {
    return this.barcodeService.findAll();
  }

  @Get('scan/:barcode')
  scanBarcode(@Param('barcode') barcode: string) {
    return this.barcodeService.scanBarcode(barcode);
  }

  @Get('item/:itemId')
  findByItem(@Param('itemId') itemId: string) {
    return this.barcodeService.findByItem(itemId);
  }

  @Get('variant/:variantId')
  findByVariant(@Param('variantId') variantId: string) {
    return this.barcodeService.findByVariant(variantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.barcodeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBarcodeDto: UpdateBarcodeDto) {
    return this.barcodeService.update(id, updateBarcodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.barcodeService.remove(id);
  }
}
