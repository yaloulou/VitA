import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdParamDto } from '../common/common.dto';
import {
  CreateIndicatorDto,
  IndicatorQueryDto,
  ReviewIndicatorDto,
  UpdateIndicatorDto,
} from './indicator.dto';
import { IndicatorsService } from './indicators.service';

@Controller('indicators')
@UseGuards(JwtAuthGuard)
export class IndicatorsController {
  constructor(private readonly service: IndicatorsService) {}
  @Get('catalog') catalog() {
    return this.service.catalog();
  }
  @Get('reports') list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: IndicatorQueryDto,
  ) {
    return this.service.list(user.id, query);
  }
  @Post('reports') create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIndicatorDto,
  ) {
    return this.service.create(user.id, dto);
  }
  @Get('reports/:id') get(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: MongoIdParamDto,
  ) {
    return this.service.get(user.id, params.id);
  }
  @Patch('reports/:id') update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateIndicatorDto,
  ) {
    return this.service.update(user.id, params.id, dto);
  }
  @Post('reports/:id/review') review(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: MongoIdParamDto,
    @Body() dto: ReviewIndicatorDto,
  ) {
    return this.service.review(user.id, params.id, dto);
  }
}
