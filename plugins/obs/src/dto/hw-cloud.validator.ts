import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsObject, IsInt, Max, Min } from 'class-validator';

export abstract class ObsUploadOptionsValiator {
  @IsNotEmpty()
  @IsString()
  abstract bucket: string;

  @IsOptional()
  @IsString()
  abstract key?: string;

  @Type()
  @IsOptional()
  @Min(300)
  @Max(3600)
  @IsInt()
  abstract expires?: number;
}

export abstract class ObsCreateUploadSignedUrlOptionsValiator extends ObsUploadOptionsValiator {
  @IsOptional()
  @IsObject()
  abstract queryParams?: Record<string, any>;

  @Type()
  @IsOptional()
  @IsObject()
  abstract headers?: Record<string, any>;
}

export abstract class ObsCreatePostUploadSignatureOptionsValiator extends ObsUploadOptionsValiator {
  @IsOptional()
  @IsObject()
  abstract formParams?: Record<string, any>;
}
