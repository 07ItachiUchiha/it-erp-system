import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductVariantService, CreateProductVariantDto, UpdateProductVariantDto } from '../services/product-variant.service';

@Controller('inventory/product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Post()
  create(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantService.create(createProductVariantDto);
  }

  @Get()
  findAll(@Query('parentItemId') parentItemId?: string) {
    if (parentItemId) {
      return this.productVariantService.findByParentItem(parentItemId);
    }
    return this.productVariantService.findAll();
  }

  @Get('search')
  search(@Query('q') searchTerm: string) {
    return this.productVariantService.searchVariants(searchTerm);
  }

  @Get('low-stock')
  getLowStock() {
    return this.productVariantService.getLowStockVariants();
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productVariantService.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productVariantService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductVariantDto: UpdateProductVariantDto) {
    return this.productVariantService.update(id, updateProductVariantDto);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() stockUpdate: { quantity: number; operation: 'add' | 'subtract' }
  ) {
    return this.productVariantService.updateStock(id, stockUpdate.quantity, stockUpdate.operation);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productVariantService.remove(id);
  }
}
