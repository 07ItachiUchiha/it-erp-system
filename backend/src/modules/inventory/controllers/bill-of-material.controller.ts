import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BillOfMaterialService, CreateBOMDto, UpdateBOMDto, CreateBOMComponentDto, CreateBOMOperationDto } from '../services/bill-of-material.service';

@Controller('inventory/bom')
export class BillOfMaterialController {
  constructor(private readonly bomService: BillOfMaterialService) {}

  @Post()
  create(@Body() createBOMDto: CreateBOMDto) {
    return this.bomService.create(createBOMDto);
  }

  @Get()
  findAll(@Query('productId') productId?: string) {
    if (productId) {
      return this.bomService.findByProduct(productId);
    }
    return this.bomService.findAll();
  }

  @Get('search')
  search(@Query('q') searchTerm: string) {
    return this.bomService.searchBOMs(searchTerm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bomService.findOne(id);
  }

  @Get(':id/material-requirements')
  calculateMaterialRequirements(
    @Param('id') id: string,
    @Query('quantity') quantity: number
  ) {
    return this.bomService.calculateRequiredMaterials(id, quantity);
  }

  @Get('product/:productId/active')
  findActiveByProduct(@Param('productId') productId: string) {
    return this.bomService.findActiveByProduct(productId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBOMDto: UpdateBOMDto) {
    return this.bomService.update(id, updateBOMDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() statusUpdate: { status: 'active' | 'inactive' | 'draft' }
  ) {
    return this.bomService.updateStatus(id, statusUpdate.status);
  }

  @Post(':id/components')
  addComponent(@Param('id') id: string, @Body() componentDto: CreateBOMComponentDto) {
    return this.bomService.addComponent(id, componentDto);
  }

  @Patch('components/:componentId')
  updateComponent(
    @Param('componentId') componentId: string, 
    @Body() updateDto: Partial<CreateBOMComponentDto>
  ) {
    return this.bomService.updateComponent(componentId, updateDto);
  }

  @Delete('components/:componentId')
  removeComponent(@Param('componentId') componentId: string) {
    return this.bomService.removeComponent(componentId);
  }

  @Post(':id/operations')
  addOperation(@Param('id') id: string, @Body() operationDto: CreateBOMOperationDto) {
    return this.bomService.addOperation(id, operationDto);
  }

  @Patch('operations/:operationId')
  updateOperation(
    @Param('operationId') operationId: string, 
    @Body() updateDto: Partial<CreateBOMOperationDto>
  ) {
    return this.bomService.updateOperation(operationId, updateDto);
  }

  @Delete('operations/:operationId')
  removeOperation(@Param('operationId') operationId: string) {
    return this.bomService.removeOperation(operationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bomService.remove(id);
  }
}
