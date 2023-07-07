import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AllowedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  // metadata를 get 하기 위해서 Reflector class를 get 해야 함
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      // SetMetadata는 metadata를 key, value로 저장함
      // 따라서 role.decorator.ts의 key와 일치하게 작성해야함
      'roles',
      context.getHandler()
    );
    // metadata가 없으면 resolver가 public,
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];

    // resolver에 metadata가 설정되어 있지만, user가 없는 경우
    // graphqlcontext에 user가 없다면 user에게 valid token이 없거나
    // token을 아예 보내지 않았다는 것임
    if (!user) {
      // metadata는 user가 로그인 되어 있기를 기대하기 때문
      return false;
    }

    // 위의 단계를 거친 경우는 metadata가 있고 로그인된 user가 존재한다는 뜻이며,
    // 어떤 role의 경우에도 접근 가능하기 때문에 true를 return,
    // resolver는 어떤 user든 진행할 수 있도록 허용해줌
    if (roles.includes('Any')) {
      return true;
    }

    // 그렇지 않다면 metadata roles가 다른 metadata인
    // user.role을 포함하는가를 return 함
    return roles.includes(user.role);
  }
}
