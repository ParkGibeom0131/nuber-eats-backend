import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    RestaurantsModule,
    //root 모델 설정
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

// typeDefs: document 혹은 서버의 schema를 표현하는 것
// resolvers: Query를 처리하고 mutate시키는 function
