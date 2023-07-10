import { Module } from '@nestjs/common';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  // forFeature는 TypeOrmModule이 특정 feature를 import할 수 있게 해줌
  providers: [
    RestaurantResolver,
    RestaurantService,
    CategoryRepository,
    CategoryResolver,
  ],
})
export class RestaurantsModule {}
