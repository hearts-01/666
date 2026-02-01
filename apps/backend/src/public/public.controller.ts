import { Controller, Get, Query } from '@nestjs/common';
import { PublicOverviewQueryDto } from './dto/public-overview-query.dto';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('overview')
  async overview(@Query() query: PublicOverviewQueryDto) {
    return this.publicService.getOverview(query);
  }
}
