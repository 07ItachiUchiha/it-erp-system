import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WorkstationService, CreateWorkstationDto, UpdateWorkstationDto } from '../services/workstation.service';

@Controller('inventory/workstations')
export class WorkstationController {
  constructor(private readonly workstationService: WorkstationService) {}

  @Post()
  create(@Body() createWorkstationDto: CreateWorkstationDto) {
    return this.workstationService.create(createWorkstationDto);
  }

  @Get()
  findAll(@Query('type') type?: string, @Query('status') status?: string) {
    if (type) {
      return this.workstationService.findByType(type);
    }
    if (status) {
      return this.workstationService.findByStatus(status);
    }
    return this.workstationService.findAll();
  }

  @Get('search')
  search(@Query('q') searchTerm: string) {
    return this.workstationService.searchWorkstations(searchTerm);
  }

  @Get('available')
  findAvailable() {
    return this.workstationService.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workstationService.findOne(id);
  }

  @Get(':id/utilization')
  getUtilization(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.workstationService.getWorkstationUtilization(
      id, 
      new Date(startDate), 
      new Date(endDate)
    );
  }

  @Get(':id/load')
  getLoad(@Param('id') id: string) {
    return this.workstationService.getWorkstationLoad(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkstationDto: UpdateWorkstationDto) {
    return this.workstationService.update(id, updateWorkstationDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() statusUpdate: { status: 'operational' | 'maintenance' | 'breakdown' | 'idle' }
  ) {
    return this.workstationService.updateStatus(id, statusUpdate.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workstationService.remove(id);
  }
}
