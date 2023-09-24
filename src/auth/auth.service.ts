import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    const pass = await argon.hash(dto.password.toString());
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toString(),
          password: pass,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('email já cadastrado!');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    //encontrar o usuario
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toString(),
      },
    });

    if (!user) throw new ForbiddenException('Usuário não cadastrado!');

    const pass = await argon.verify(user.password, dto.password.toString());
    if (!pass) throw new ForbiddenException('Senha incorreta');

    return this.signToken(user.id, user.email);
  }

  async signToken(userId: number, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token
    }
  }
}
