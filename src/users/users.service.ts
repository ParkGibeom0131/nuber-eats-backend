import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // 새로운 user인지 확인
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        return {
          ok: false,
          error: '해당 이메일을 가진 사용자가 이미 존재합니다.',
        };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role })
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        })
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: '계정을 생성할 수 없습니다.' };
    }
    // 계정을 생성하고 비밀번호를 hashing

    // Database에 존재하지 않는 email을 확인
  }
  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // 해당 email을 가진 user를 찾기
    try {
      const user = await this.users.findOne({
        where: { email },
        select: ['id', 'password'],
      });
      if (!user) {
        return { ok: false, error: '사용자를 찾을 수 없습니다.' };
      }

      // 비밀번호가 일치하는지 확인
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return { ok: false, error: '비밀번호가 일치하지 않습니다.' };
      }

      // JWT를 만들고 user에게 배포
      const token = this.jwtService.sign(user.id);
      return { ok: true, token };
    } catch (error) {
      return { ok: false, error: '로그인할 수 없습니다.' };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ where: { id } });
      return {
        ok: true,
        user: user,
      };
    } catch (error) {
      return { ok: false, error: '사용자를 찾을 수 없습니다.' };
    }
  }

  async editProfile(
    id: number,
    { email, password }: EditProfileInput
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({ where: { id } });
      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.verifications.save(
          this.verifications.create({ user })
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: '프로필을 업데이트할 수 없습니다.' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne({
        where: { code },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        // verification이 있으면 사용자가 인증되었음을 저장
        // 사용자를 인증
        await this.users.save(verification.user);

        // verification을 삭제 해주어야 함
        // 사용자 당 하나의 인증서만 가질 수 있고, 인증서 당 하나의 사용자만 가질 수 있기 때문
        await this.verifications.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: '인증을 확인할 수 없습니다.' };
    } catch (error) {
      console.log(error);
      return { ok: false, error: '이메일을 확인할 수 없습니다.' };
    }
  }
}
