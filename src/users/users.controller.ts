import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MongoIdParamDto, ScopedQueryDto } from '../common/common.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserManagementGuard } from './guards/user-management.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(UserManagementGuard)
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

  @Patch(':id')
  @UseGuards(UserManagementGuard)
  update(@Param() params: MongoIdParamDto, @Body() dto: UpdateUserDto) {
    return this.usersService.update(params.id, dto);
  }

  @Delete(':id')
  @UseGuards(UserManagementGuard)
  remove(@Param() params: MongoIdParamDto) {
    return this.usersService.remove(params.id);
  }
}
