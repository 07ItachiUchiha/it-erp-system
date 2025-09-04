import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ManufacturingOrderService, CreateManufacturingOrderDto, UpdateManufacturingOrderDto } from '../services/manufacturing-order.service';

@Controller('inventory/manufacturing-orders')
export class ManufacturingOrderController {
  constructor(private readonly moService: ManufacturingOrderService) {}

  @Post()
  create(@Body() createMODto: CreateManufacturingOrderDto) {
    return this.moService.create(createMODto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('workstationId') workstationId?: string
  ) {
    if (status) {
      return this.moService.findByStatus(status);
    }
    if (productId) {
      return this.moService.findByProduct(productId);
    }
    if (workstationId) {
      return this.moService.findByWorkstation(workstationId);
    }
    return this.moService.findAll();
  }

  @Get('search')
  search(@Query('q') searchTerm: string) {
    return this.moService.searchOrders(searchTerm);
  }

  @Get('dashboard')
  getDashboardMetrics() {
    return this.moService.getDashboardMetrics();
  }

  @Get('schedule')
  getProductionSchedule(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.moService.getProductionSchedule(new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMODto: UpdateManufacturingOrderDto) {
    return this.moService.update(id, updateMODto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() statusUpdate: { 
      status: 'draft' | 'confirmed' | 'in_progress' | 'paused' | 'completed' | 'cancelled' 
    }
  ) {
    return this.moService.updateStatus(id, statusUpdate.status);
  }

  @Post(':id/start')
  startProduction(@Param('id') id: string) {
    return this.moService.startProduction(id);
  }

  @Post(':id/complete')
  completeProduction(
    @Param('id') id: string,
    @Body() completionData: { quantityProduced: number }
  ) {
    return this.moService.completeProduction(id, completionData.quantityProduced);
  }

  @Post(':id/pause')
  pauseProduction(
    @Param('id') id: string,
    @Body() pauseData?: { reason?: string }
  ) {
    return this.moService.pauseProduction(id, pauseData?.reason);
  }

  @Post(':id/resume')
  resumeProduction(@Param('id') id: string) {
    return this.moService.resumeProduction(id);
  }

  @Post(':id/cancel')
  cancelOrder(
    @Param('id') id: string,
    @Body() cancelData?: { reason?: string }
  ) {
    return this.moService.cancelOrder(id, cancelData?.reason);
  }

  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() progressData: { 
      quantityProduced: number; 
      actualHours?: number; 
      notes?: string;
    }
  ) {
    return this.moService.updateProgress(
      id, 
      progressData.quantityProduced, 
      progressData.actualHours, 
      progressData.notes
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moService.remove(id);
  }
}
