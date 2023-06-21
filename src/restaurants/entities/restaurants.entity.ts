import { Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// @InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;
  @Field(() => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;
  @Field(() => Boolean, { defaultValue: false })
  // GraphQL schema에서 해당 field의 defaultValue가 false
  @Column({ default: false })
  // Database에서 해당 field의 defaultValue가 false
  @IsOptional()
  // validation은 optional이고 value가 있을 경우, boolean 이어야 함
  @IsBoolean()
  isVegan?: boolean;
  @Field(() => String)
  @Column()
  @IsString()
  address: string;
}
