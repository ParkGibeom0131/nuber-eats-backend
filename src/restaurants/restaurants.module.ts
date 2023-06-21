import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.resovlers';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurants.entity';
import { RestaurantService } from './restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant])],
  // forFeature는 TypeOrmModule이 특정 feature를 import할 수 있게 해줌
  providers: [RestaurantResolver, RestaurantService],
})
export class RestaurantsModule {}
