import { IsNotEmpty, IsEnum, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ReviewPeriod, ReviewStatus, Rating } from '../entities/performance-review.entity';

export class CreatePerformanceReviewDto {
  @ApiProperty({ description: 'Employee ID being reviewed' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Review period (YYYY-MM format)' })
  @IsNotEmpty()
  @IsString()
  reviewPeriod: string;

  @ApiProperty({ enum: ReviewPeriod, description: 'Period type' })
  @IsNotEmpty()
  @IsEnum(ReviewPeriod)
  periodType: ReviewPeriod;

  @ApiProperty({ description: 'Review date' })
  @IsNotEmpty()
  @IsDateString()
  reviewDate: string;

  @ApiProperty({ enum: Rating, description: 'Overall rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  overallRating: Rating;

  @ApiProperty({ enum: Rating, description: 'Technical skills rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  technicalSkills: Rating;

  @ApiProperty({ enum: Rating, description: 'Communication rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  communication: Rating;

  @ApiProperty({ enum: Rating, description: 'Teamwork rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  teamwork: Rating;

  @ApiProperty({ enum: Rating, description: 'Leadership rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  leadership: Rating;

  @ApiProperty({ enum: Rating, description: 'Problem solving rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  problemSolving: Rating;

  @ApiProperty({ enum: Rating, description: 'Time management rating' })
  @IsNotEmpty()
  @IsEnum(Rating)
  timeManagement: Rating;

  @ApiPropertyOptional({ description: 'Employee achievements' })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({ description: 'Areas of improvement' })
  @IsOptional()
  @IsString()
  areasOfImprovement?: string;

  @ApiPropertyOptional({ description: 'Goals for next period' })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({ description: 'Reviewer comments' })
  @IsOptional()
  @IsString()
  reviewerComments?: string;

  @ApiPropertyOptional({ description: 'Employee comments' })
  @IsOptional()
  @IsString()
  employeeComments?: string;
}

export class UpdatePerformanceReviewDto extends PartialType(CreatePerformanceReviewDto) {}

export class CompleteReviewDto {
  @ApiProperty({ enum: ReviewStatus, description: 'Review status' })
  @IsNotEmpty()
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ description: 'Employee comments' })
  @IsOptional()
  @IsString()
  employeeComments?: string;
}

export class PerformanceReviewFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Reviewer ID' })
  @IsOptional()
  @IsUUID()
  reviewerId?: string;

  @ApiPropertyOptional({ enum: ReviewPeriod, description: 'Period type' })
  @IsOptional()
  @IsEnum(ReviewPeriod)
  periodType?: ReviewPeriod;

  @ApiPropertyOptional({ enum: ReviewStatus, description: 'Review status' })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: 'Review period' })
  @IsOptional()
  @IsString()
  reviewPeriod?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}
