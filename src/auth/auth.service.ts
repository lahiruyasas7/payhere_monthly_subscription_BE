import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/configs/database-configs/prisma.service';
import { RegisterUserDto } from './dto/user-register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    try {
      this.logger.debug('register user');
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        //profileImage,
        address,
      } = registerUserDto;

      // hash password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check existing user
      const existingUser = await this.prismaService.user.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }

      // create new user
      const newUser = this.prismaService.user.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address,
      });

      await this.prismaService.user.save(newUser);

      return newUser;
    } catch (error) {
      this.logger.error(`register ${error}`);

      // conflict errors
      if (error instanceof ConflictException) {
        throw error;
      }
      // catch errors
      throw new UnauthorizedException('Failed to register new user');
    }
  }
}

@Injectable()
export class JWTAuthService {
  constructor(
    private configService: ConfigService,
    private readonly jwtServ: JwtService,
  ) {}

  validateToken(token: string) {
    return this.jwtServ.verify(token, {
      secret: this.configService.get('app.jwtSecret'),
    });
  }
}
