import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

// Role-based Authorizaion
export type AllowedRoles = keyof typeof UserRole | 'Any';

// SetMetadata는 metadata를 key, value로 저장함
export const Role = (roles: AllowedRoles[]) => SetMetadata('roles', roles);
