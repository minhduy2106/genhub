import { IsEmail } from 'class-validator';

export class SendRegisterVerificationDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
