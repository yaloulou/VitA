import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LocationsModule } from '../locations/locations.module';
import { UserManagementGuard } from './guards/user-management.guard';

@Module({
  imports: [
    LocationsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserManagementGuard],
  exports: [MongooseModule, UsersService],
})
export class UsersModule {}
