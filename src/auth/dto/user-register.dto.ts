import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'email can not be empty' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'password can not be empty' })
  @IsString()
  password: string;

  @IsNotEmpty({ message: 'First Name can not be empty' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last Name can not be empty' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'Phone Number can not be empty' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Address can not be empty' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'City can not be empty' })
  @IsString()
  city: string;

  @IsNotEmpty({ message: 'Country can not be empty' })
  @IsString()
  country: string;
}
