import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PerformanceReview, ReviewStatus } from '../entities/performance-review.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { CreatePerformanceReviewDto, UpdatePerformanceReviewDto, CompleteReviewDto, PerformanceReviewFilterDto } from '../dto/performance-review.dto';

@Injectable()
export class PerformanceReviewService {
  constructor(
    @InjectRepository(PerformanceReview)
    private performanceReviewRepository: Repository<PerformanceReview>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createPerformanceReviewDto: CreatePerformanceReviewDto, reviewerId: string): Promise<PerformanceReview> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({ 
      where: { id: createPerformanceReviewDto.employeeId } 
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Validate reviewer exists
    const reviewer = await this.employeeRepository.findOne({ where: { id: reviewerId } });
    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    // Check if review already exists for this period
    const existingReview = await this.performanceReviewRepository.findOne({
      where: {
        employeeId: createPerformanceReviewDto.employeeId,
        reviewPeriod: createPerformanceReviewDto.reviewPeriod,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Performance review already exists for this employee and period');
    }

    const review = this.performanceReviewRepository.create({
      ...createPerformanceReviewDto,
      reviewerId,
      reviewDate: new Date(createPerformanceReviewDto.reviewDate),
    });

    return await this.performanceReviewRepository.save(review);
  }

  async findAll(filters: PerformanceReviewFilterDto) {
    const { 
      employeeId, 
      reviewerId, 
      periodType, 
      status, 
      reviewPeriod, 
      page = 1, 
      limit = 10 
    } = filters;

    const queryBuilder = this.performanceReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.employee', 'employee')
      .leftJoinAndSelect('review.reviewer', 'reviewer');

    if (employeeId) {
      queryBuilder.andWhere('review.employeeId = :employeeId', { employeeId });
    }

    if (reviewerId) {
      queryBuilder.andWhere('review.reviewerId = :reviewerId', { reviewerId });
    }

    if (periodType) {
      queryBuilder.andWhere('review.periodType = :periodType', { periodType });
    }

    if (status) {
      queryBuilder.andWhere('review.status = :status', { status });
    }

    if (reviewPeriod) {
      queryBuilder.andWhere('review.reviewPeriod = :reviewPeriod', { reviewPeriod });
    }

    queryBuilder.orderBy('review.reviewDate', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<PerformanceReview> {
    const review = await this.performanceReviewRepository.findOne({
      where: { id },
      relations: ['employee', 'reviewer'],
    });

    if (!review) {
      throw new NotFoundException('Performance review not found');
    }

    return review;
  }

  async findByEmployee(employeeId: string): Promise<PerformanceReview[]> {
    return await this.performanceReviewRepository.find({
      where: { employeeId },
      relations: ['reviewer'],
      order: { reviewDate: 'DESC' },
    });
  }

  async update(id: string, updatePerformanceReviewDto: UpdatePerformanceReviewDto, reviewerId: string): Promise<PerformanceReview> {
    const review = await this.findOne(id);

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('You can only update reviews you created');
    }

    if (review.status === ReviewStatus.APPROVED) {
      throw new BadRequestException('Cannot update approved reviews');
    }

    Object.assign(review, updatePerformanceReviewDto);
    
    if (updatePerformanceReviewDto.reviewDate) {
      review.reviewDate = new Date(updatePerformanceReviewDto.reviewDate);
    }

    return await this.performanceReviewRepository.save(review);
  }

  async complete(id: string, completeReviewDto: CompleteReviewDto, employeeId?: string): Promise<PerformanceReview> {
    const review = await this.findOne(id);

    if (completeReviewDto.status === ReviewStatus.COMPLETED && employeeId) {
      // Employee completing the review
      if (review.employeeId !== employeeId) {
        throw new ForbiddenException('You can only complete your own reviews');
      }
      
      review.employeeComments = completeReviewDto.employeeComments;
      review.status = ReviewStatus.COMPLETED;
      review.completedAt = new Date();
    } else if (completeReviewDto.status === ReviewStatus.APPROVED) {
      // Manager/HR approving the review
      review.status = ReviewStatus.APPROVED;
      review.approvedAt = new Date();
    }

    return await this.performanceReviewRepository.save(review);
  }

  async remove(id: string, reviewerId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('You can only delete reviews you created');
    }

    if (review.status === ReviewStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved reviews');
    }

    await this.performanceReviewRepository.remove(review);
  }

  async getEmployeePerformanceSummary(employeeId: string, year?: number) {
    const queryBuilder = this.performanceReviewRepository
      .createQueryBuilder('review')
      .where('review.employeeId = :employeeId', { employeeId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED });

    if (year) {
      queryBuilder.andWhere('review.reviewPeriod LIKE :year', { year: `${year}%` });
    }

    const reviews = await queryBuilder
      .orderBy('review.reviewDate', 'DESC')
      .getMany();

    if (reviews.length === 0) {
      return {
        employeeId,
        year,
        reviewCount: 0,
        averageRating: 0,
        reviews: [],
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    const averageRating = totalRating / reviews.length;

    const skillsAverage = {
      technicalSkills: reviews.reduce((sum, r) => sum + r.technicalSkills, 0) / reviews.length,
      communication: reviews.reduce((sum, r) => sum + r.communication, 0) / reviews.length,
      teamwork: reviews.reduce((sum, r) => sum + r.teamwork, 0) / reviews.length,
      leadership: reviews.reduce((sum, r) => sum + r.leadership, 0) / reviews.length,
      problemSolving: reviews.reduce((sum, r) => sum + r.problemSolving, 0) / reviews.length,
      timeManagement: reviews.reduce((sum, r) => sum + r.timeManagement, 0) / reviews.length,
    };

    return {
      employeeId,
      year,
      reviewCount: reviews.length,
      averageRating: Math.round(averageRating * 100) / 100,
      skillsAverage,
      reviews,
    };
  }

  async getTeamPerformanceSummary(reviewerId: string, period?: string) {
    const queryBuilder = this.performanceReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.employee', 'employee')
      .where('review.reviewerId = :reviewerId', { reviewerId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED });

    if (period) {
      queryBuilder.andWhere('review.reviewPeriod = :period', { period });
    }

    const reviews = await queryBuilder
      .orderBy('review.reviewDate', 'DESC')
      .getMany();

    const summary = {
      reviewerId,
      period,
      totalReviews: reviews.length,
      averageTeamRating: 0,
      ratingDistribution: {
        excellent: reviews.filter(r => r.overallRating === 5).length,
        good: reviews.filter(r => r.overallRating === 4).length,
        satisfactory: reviews.filter(r => r.overallRating === 3).length,
        needsImprovement: reviews.filter(r => r.overallRating === 2).length,
        unsatisfactory: reviews.filter(r => r.overallRating === 1).length,
      },
      reviews,
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
      summary.averageTeamRating = Math.round((totalRating / reviews.length) * 100) / 100;
    }

    return summary;
  }
}
