import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

@ObjectType()
export class AllCategoriesOutput extends CoreOutput {
  // GraphQL을 위한 Type
  @Field((type) => [Category], { nullable: true })

  // Typescript를 위한 Type
  categories?: Category[];
}
