import { IsString, Length, Min, Max } from 'class-validator';

/**
 * Create Computer DTO
 *
 * Payload for computer creation endpoint.
 */
export class CreateComputerDto {
  @IsString()
  @Length(1, 50, {
    message: 'Computer name must be 1-50 characters',
  })
  name!: string;
}
