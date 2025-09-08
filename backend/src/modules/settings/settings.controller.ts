import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  UpdateUserProfileDto, 
  UpdateSecuritySettingsDto,
  ChangePasswordDto,
  UpdateNotificationSettingsDto,
  UpdateAppearanceSettingsDto,
  UpdateCompanySettingsDto,
  UpdateSystemSettingsDto
} from './dto/settings.dto';

@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // User Profile Endpoints
  @Get('profile/:userId')
  async getUserProfile(@Param('userId') userId: string) {
    return this.settingsService.getUserProfile(userId);
  }

  @Put('profile/:userId')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateData: UpdateUserProfileDto,
  ) {
    return this.settingsService.updateUserProfile(userId, updateData);
  }

  // Security Endpoints
  @Get('security/:userId')
  async getSecuritySettings(@Param('userId') userId: string) {
    return this.settingsService.getSecuritySettings(userId);
  }

  @Put('security/:userId')
  async updateSecuritySettings(
    @Param('userId') userId: string,
    @Body() updateData: UpdateSecuritySettingsDto,
  ) {
    return this.settingsService.updateSecuritySettings(userId, updateData);
  }

  @Put('password/:userId')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('userId') userId: string,
    @Body() changePasswordData: ChangePasswordDto,
  ) {
    return this.settingsService.changePassword(userId, changePasswordData);
  }

  // Notification Endpoints
  @Get('notifications/:userId')
  async getNotificationSettings(@Param('userId') userId: string) {
    return this.settingsService.getNotificationSettings(userId);
  }

  @Put('notifications/:userId')
  async updateNotificationSettings(
    @Param('userId') userId: string,
    @Body() updateData: UpdateNotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(userId, updateData);
  }

  // Appearance Endpoints
  @Get('appearance/:userId')
  async getAppearanceSettings(@Param('userId') userId: string) {
    return this.settingsService.getAppearanceSettings(userId);
  }

  @Put('appearance/:userId')
  async updateAppearanceSettings(
    @Param('userId') userId: string,
    @Body() updateData: UpdateAppearanceSettingsDto,
  ) {
    return this.settingsService.updateAppearanceSettings(userId, updateData);
  }

  // Company Settings Endpoints
  @Get('company')
  async getCompanySettings() {
    return this.settingsService.getCompanySettings();
  }

  @Put('company')
  async updateCompanySettings(@Body() updateData: UpdateCompanySettingsDto) {
    return this.settingsService.updateCompanySettings(updateData);
  }

  // System Settings Endpoints
  @Get('system')
  async getSystemSettings() {
    return this.settingsService.getSystemSettings();
  }

  @Put('system')
  async updateSystemSettings(@Body() updateData: UpdateSystemSettingsDto) {
    return this.settingsService.updateSystemSettings(updateData);
  }

  // System Info and Actions
  @Get('system-info')
  async getSystemInfo() {
    return this.settingsService.getSystemInfo();
  }

  @Post('backup')
  async createBackup() {
    return this.settingsService.createBackup();
  }

  @Post('export')
  async exportData(@Body() { modules }: { modules: string[] }) {
    return this.settingsService.exportData(modules);
  }

  @Post('clear-cache')
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    return this.settingsService.clearCache();
  }

  // Module-specific endpoints
  @Get('modules')
  async getModuleSettings() {
    const systemSettings = await this.settingsService.getSystemSettings();
    return systemSettings.moduleSettings;
  }

  @Put('modules')
  async updateModuleSettings(@Body() moduleSettings: any) {
    return this.settingsService.updateSystemSettings({ moduleSettings });
  }
}
