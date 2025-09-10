import { Injectable, BadRequestException } from '@nestjs/common';
import { CalculateGSTDto, GSTCalculationResultDto, GSTBreakupDto } from '../dto/gst-calculation.dto';

@Injectable()
export class GSTCalculationService {
  private readonly indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  private readonly unionTerritories = [
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  /**
   * Calculate GST based on bill-to and ship-to states
   */
  calculateGST(calculateGSTDto: CalculateGSTDto): GSTCalculationResultDto {
    const { billToState, shipToState, subtotal, shippingCharges, taxRate } = calculateGSTDto;

    // Validate states
    this.validateStates(billToState, shipToState);

    // Calculate taxable amount (subtotal + shipping)
    const taxableAmount = subtotal + shippingCharges;
    
    // Determine transaction type
    const isIntraState = this.normalizeStateName(billToState) === this.normalizeStateName(shipToState);
    const transactionType = isIntraState ? 'intra-state' : 'inter-state';

    // Calculate GST breakdown
    const gstBreakup = this.calculateGSTBreakup(taxableAmount, taxRate, isIntraState);

    // Calculate totals
    const totalTax = gstBreakup.cgst + gstBreakup.sgst + gstBreakup.igst + (gstBreakup.utgst || 0);
    const grandTotal = taxableAmount + totalTax;

    return {
      transactionType,
      gstBreakup,
      totalTax,
      grandTotal
    };
  }

  /**
   * Calculate GST breakdown based on transaction type
   */
  private calculateGSTBreakup(taxableAmount: number, taxRate: number, isIntraState: boolean): GSTBreakupDto {
    const totalTaxAmount = (taxableAmount * taxRate) / 100;

    if (isIntraState) {
      // Intra-state: Split equally between CGST and SGST
      const halfTax = totalTaxAmount / 2;
      return {
        cgst: Math.round(halfTax * 100) / 100, // Round to 2 decimal places
        sgst: Math.round(halfTax * 100) / 100,
        igst: 0
      };
    } else {
      // Inter-state: Full amount as IGST
      return {
        cgst: 0,
        sgst: 0,
        igst: Math.round(totalTaxAmount * 100) / 100
      };
    }
  }

  /**
   * Validate GST override values
   */
  validateGSTOverride(gstBreakup: GSTBreakupDto, subtotal: number, isIntraState: boolean): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for negative values
    if (gstBreakup.cgst < 0 || gstBreakup.sgst < 0 || gstBreakup.igst < 0) {
      errors.push('GST amounts cannot be negative');
    }

    // Check total GST doesn't exceed 50% of subtotal (unrealistic tax rate)
    const totalGST = gstBreakup.cgst + gstBreakup.sgst + gstBreakup.igst + (gstBreakup.utgst || 0);
    if (totalGST > subtotal * 0.5) {
      errors.push('Total GST cannot exceed 50% of subtotal');
    }

    // Validate transaction type consistency
    if (isIntraState) {
      if (gstBreakup.igst > 0) {
        errors.push('IGST should be 0 for intra-state transactions');
      }
      if (gstBreakup.cgst === 0 && gstBreakup.sgst === 0 && totalGST > 0) {
        errors.push('Intra-state transactions should have CGST and SGST');
      }
    } else {
      if (gstBreakup.cgst > 0 || gstBreakup.sgst > 0) {
        errors.push('CGST and SGST should be 0 for inter-state transactions');
      }
      if (gstBreakup.igst === 0 && totalGST > 0) {
        errors.push('Inter-state transactions should have IGST');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique invoice number in format INV-YYYYMMDD-XXXX
   */
  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Generate random 4-digit number
    const random = Math.floor(Math.random() * 9000) + 1000;
    
    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Validate GSTIN format
   */
  validateGSTIN(gstin: string): boolean {
    if (!gstin || gstin.length !== 15) {
      return false;
    }

    // GSTIN format: 2 digits (state code) + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Get state code from GSTIN
   */
  getStateCodeFromGSTIN(gstin: string): string | null {
    if (!this.validateGSTIN(gstin)) {
      return null;
    }
    return gstin.substring(0, 2);
  }

  /**
   * Validate if states exist in India
   */
  private validateStates(billToState: string, shipToState: string): void {
    const allStatesAndUTs = [...this.indianStates, ...this.unionTerritories];
    
    if (!allStatesAndUTs.includes(billToState)) {
      throw new BadRequestException(`Invalid bill-to state: ${billToState}`);
    }
    
    if (!allStatesAndUTs.includes(shipToState)) {
      throw new BadRequestException(`Invalid ship-to state: ${shipToState}`);
    }
  }

  /**
   * Normalize state names for comparison
   */
  private normalizeStateName(stateName: string): string {
    return stateName.toLowerCase().trim();
  }

  /**
   * Check if location is a Union Territory
   */
  isUnionTerritory(stateName: string): boolean {
    return this.unionTerritories.includes(stateName);
  }

  /**
   * Calculate reverse charge GST (for future enhancement)
   */
  calculateReverseChargeGST(amount: number, taxRate: number): GSTBreakupDto {
    // For reverse charge mechanism
    return {
      cgst: 0,
      sgst: 0,
      igst: 0
    };
  }
}
