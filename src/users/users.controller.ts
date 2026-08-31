import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MongoIdParamDto, ScopedQueryDto } from '../common/common.dto';
import { CreateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  list(@Query() query: ScopedQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  get(@Param() params: MongoIdParamDto) {
    return this.usersService.get(params.id);
  }
}
