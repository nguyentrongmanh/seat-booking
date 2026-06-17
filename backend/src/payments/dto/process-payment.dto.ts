import { IsString, Length, Matches } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @Matches(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, { message: 'Invalid card number' })
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Expiry must be MM/YY' })
  expiry: string;

  @IsString()
  @Length(3, 4)
  @Matches(/^\d+$/, { message: 'CVV must be numeric' })
  cvv: string;

  @IsString()
  cardholderName: string;
}
