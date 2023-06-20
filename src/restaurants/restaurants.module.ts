import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.resovlers';

@Module({
  providers: [RestaurantResolver],
})
export class RestaurantsModule {}
