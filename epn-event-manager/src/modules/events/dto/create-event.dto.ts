import {
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @Matches(/\S/, { message: 'source must be a non-blank string' })
  @MaxLength(100)
  source: string;

  @Matches(/\S/, { message: 'entity must be a non-blank string' })
  @MaxLength(100)
  entity: string;

  @Matches(/^(CREATE|UPDATE|DELETE|QUERY)$/i, {
    message: 'action must be CREATE, UPDATE, DELETE, or QUERY',
  })
  action: string;

  @Matches(/\S/, { message: 'title must be a non-blank string' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}
