import { IsDefined, IsOptional, IsString, IsPositive } from 'class-validator';

export abstract class NewMediaValidator {
  @IsDefined()
  @IsString()
  abstract fileName: string;

  @IsDefined()
  @IsString()
  abstract originalFileName: string;

  @IsDefined()
  @IsString()
  abstract extension: string;

  @IsDefined()
  @IsString()
  abstract mimeType: string;

  @IsDefined()
  @IsString()
  abstract path: string;
}

export abstract class MediaMetaDataValidator {
  @IsDefined()
  @IsPositive()
  abstract fileSize: number;

  @IsOptional()
  @IsPositive()
  abstract width?: number;

  @IsOptional()
  @IsPositive()
  abstract height?: number;
}
