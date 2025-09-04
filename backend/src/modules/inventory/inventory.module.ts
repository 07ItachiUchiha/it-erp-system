import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { 
  Warehouse, 
  Zone, 
  Item, 
  StockMovement, 
  Batch, 
  Serial,
  ProductVariant,
  Barcode,
  Workstation,
  ManufacturingOrder,
  BillOfMaterial,
  BOMComponent,
  BOMOperation
} from './entities';

// Services
import { 
  WarehouseService, 
  ItemService, 
  StockMovementService,
  ProductVariantService,
  BarcodeService,
  WorkstationService,
  BillOfMaterialService,
  ManufacturingOrderService
} from './services';

// Controllers
import { 
  WarehouseController, 
  ItemController, 
  StockMovementController,
  ProductVariantController,
  BarcodeController,
  WorkstationController,
  BillOfMaterialController,
  ManufacturingOrderController
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      Zone,
      Item,
      StockMovement,
      Batch,
      Serial,
      ProductVariant,
      Barcode,
      Workstation,
      ManufacturingOrder,
      BillOfMaterial,
      BOMComponent,
      BOMOperation
    ]),
  ],
  controllers: [
    WarehouseController,
    ItemController,
    StockMovementController,
    ProductVariantController,
    BarcodeController,
    WorkstationController,
    BillOfMaterialController,
    ManufacturingOrderController,
  ],
  providers: [
    WarehouseService,
    ItemService,
    StockMovementService,
    ProductVariantService,
    BarcodeService,
    WorkstationService,
    BillOfMaterialService,
    ManufacturingOrderService,
  ],
  exports: [
    WarehouseService,
    ItemService,
    StockMovementService,
    ProductVariantService,
    BarcodeService,
    WorkstationService,
    BillOfMaterialService,
    ManufacturingOrderService,
  ],
})
export class InventoryModule {}
