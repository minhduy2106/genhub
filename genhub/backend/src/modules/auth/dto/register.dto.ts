import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567)',
  })
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên cửa hàng không được để trống' })
  @MinLength(2, { message: 'Tên cửa hàng tối thiểu 2 ký tự' })
  storeName: string;
}
