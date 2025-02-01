import { Type } from "@nestjs/class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "@nestjs/class-validator";
import { UserDetailsDto } from "./user-details.dto";

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  items: string;

  @IsNotEmpty()
  @IsString()
  totalAmount: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UserDetailsDto)
  user: UserDetailsDto;
}
