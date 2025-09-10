import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAddress } from '../entities/bill.entity';

export interface CreateCustomerAddressDto {
  customerId: string;
  addressType: 'billing' | 'shipping' | 'both';
  contactName?: string;
  companyName?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  gstin?: string;
  isDefault?: boolean;
  createdBy?: string;
}

export interface UpdateCustomerAddressDto {
  contactName?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

@Injectable()
export class CustomerAddressService {
  constructor(
    @InjectRepository(CustomerAddress)
    private customerAddressRepository: Repository<CustomerAddress>,
  ) {}

  /**
   * Create a new customer address
   */
  async createAddress(createDto: CreateCustomerAddressDto): Promise<CustomerAddress> {
    // Validate GSTIN if provided
    if (createDto.gstin && !this.validateGSTIN(createDto.gstin)) {
      throw new BadRequestException('Invalid GSTIN format');
    }

    // If this is set as default, unset other default addresses of same type for same customer
    if (createDto.isDefault) {
      await this.unsetDefaultAddresses(createDto.customerId, createDto.addressType);
    }

    const address = this.customerAddressRepository.create({
      ...createDto,
      country: createDto.country || 'India',
    });

    return await this.customerAddressRepository.save(address);
  }

  /**
   * Get all addresses for a customer
   */
  async getCustomerAddresses(
    customerId: string, 
    addressType?: 'billing' | 'shipping' | 'both',
    activeOnly: boolean = true
  ): Promise<CustomerAddress[]> {
    const queryBuilder = this.customerAddressRepository
      .createQueryBuilder('address')
      .where('address.customerId = :customerId', { customerId });

    if (addressType) {
      queryBuilder.andWhere(
        '(address.addressType = :addressType OR address.addressType = :both)',
        { addressType, both: 'both' }
      );
    }

    if (activeOnly) {
      queryBuilder.andWhere('address.isActive = :isActive', { isActive: true });
    }

    queryBuilder.orderBy('address.isDefault', 'DESC')
              .addOrderBy('address.createdAt', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Get a specific address by ID
   */
  async getAddressById(id: string): Promise<CustomerAddress> {
    const address = await this.customerAddressRepository.findOne({
      where: { id }
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  /**
   * Update an existing address
   */
  async updateAddress(id: string, updateDto: UpdateCustomerAddressDto): Promise<CustomerAddress> {
    const address = await this.getAddressById(id);

    // Validate GSTIN if provided
    if (updateDto.gstin && !this.validateGSTIN(updateDto.gstin)) {
      throw new BadRequestException('Invalid GSTIN format');
    }

    // If setting as default, unset other default addresses
    if (updateDto.isDefault) {
      await this.unsetDefaultAddresses(address.customerId, address.addressType);
    }

    Object.assign(address, updateDto);
    return await this.customerAddressRepository.save(address);
  }

  /**
   * Soft delete an address (mark as inactive)
   */
  async deleteAddress(id: string): Promise<void> {
    const address = await this.getAddressById(id);
    address.isActive = false;
    await this.customerAddressRepository.save(address);
  }

  /**
   * Get default address for a customer and type
   */
  async getDefaultAddress(
    customerId: string, 
    addressType: 'billing' | 'shipping'
  ): Promise<CustomerAddress | null> {
    return await this.customerAddressRepository.findOne({
      where: [
        { 
          customerId, 
          addressType, 
          isDefault: true, 
          isActive: true 
        },
        { 
          customerId, 
          addressType: 'both', 
          isDefault: true, 
          isActive: true 
        }
      ]
    });
  }

  /**
   * Search addresses by various criteria
   */
  async searchAddresses(criteria: {
    customerId?: string;
    city?: string;
    state?: string;
    gstin?: string;
    addressType?: string;
    activeOnly?: boolean;
  }): Promise<CustomerAddress[]> {
    const queryBuilder = this.customerAddressRepository.createQueryBuilder('address');

    if (criteria.customerId) {
      queryBuilder.andWhere('address.customerId = :customerId', { customerId: criteria.customerId });
    }

    if (criteria.city) {
      queryBuilder.andWhere('LOWER(address.city) LIKE LOWER(:city)', { city: `%${criteria.city}%` });
    }

    if (criteria.state) {
      queryBuilder.andWhere('LOWER(address.state) = LOWER(:state)', { state: criteria.state });
    }

    if (criteria.gstin) {
      queryBuilder.andWhere('address.gstin = :gstin', { gstin: criteria.gstin });
    }

    if (criteria.addressType) {
      queryBuilder.andWhere(
        '(address.addressType = :addressType OR address.addressType = :both)',
        { addressType: criteria.addressType, both: 'both' }
      );
    }

    if (criteria.activeOnly !== false) {
      queryBuilder.andWhere('address.isActive = :isActive', { isActive: true });
    }

    queryBuilder.orderBy('address.isDefault', 'DESC')
              .addOrderBy('address.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get address statistics for a customer
   */
  async getAddressStatistics(customerId: string): Promise<{
    total: number;
    billing: number;
    shipping: number;
    both: number;
    withGSTIN: number;
    default: number;
  }> {
    const addresses = await this.getCustomerAddresses(customerId, undefined, false);

    return {
      total: addresses.length,
      billing: addresses.filter(addr => addr.addressType === 'billing').length,
      shipping: addresses.filter(addr => addr.addressType === 'shipping').length,
      both: addresses.filter(addr => addr.addressType === 'both').length,
      withGSTIN: addresses.filter(addr => addr.gstin).length,
      default: addresses.filter(addr => addr.isDefault).length,
    };
  }

  /**
   * Validate GSTIN format
   */
  private validateGSTIN(gstin: string): boolean {
    if (!gstin || gstin.length !== 15) {
      return false;
    }

    // GSTIN format: 2 digits (state code) + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Unset default flag for existing addresses of same type
   */
  private async unsetDefaultAddresses(customerId: string, addressType: string): Promise<void> {
    await this.customerAddressRepository
      .createQueryBuilder()
      .update(CustomerAddress)
      .set({ isDefault: false })
      .where('customerId = :customerId', { customerId })
      .andWhere(
        '(addressType = :addressType OR addressType = :both)',
        { addressType, both: 'both' }
      )
      .execute();
  }

  /**
   * Bulk import addresses from CSV/Excel data
   */
  async bulkImportAddresses(addresses: CreateCustomerAddressDto[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const addressData of addresses) {
      try {
        await this.createAddress(addressData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to create address for ${addressData.customerId}: ${error.message}`);
      }
    }

    return results;
  }
}
