import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dts';

@InputType()
export class UpdateRestaurantInputType extends PartialType(
  CreateRestaurantDto,
) {}

@InputType()
export class UpdateRestaurantDto {
  @Field(() => Number)
  id: number;

  @Field(() => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}
