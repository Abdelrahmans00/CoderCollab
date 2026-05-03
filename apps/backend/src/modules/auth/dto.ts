import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsString()
  @MinLength(1, { message: "Password is required" })
  password!: string;
}