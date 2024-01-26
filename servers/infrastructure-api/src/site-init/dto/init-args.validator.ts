import { IsNotEmpty, IsLocale, IsUrl, IsEmail, MinLength } from 'class-validator';
import { SiteInitArgs } from '../interfaces/init-args.interface';

export abstract class SiteInitArgsValidator implements Omit<SiteInitArgs, 'siteUrl'> {
  @IsNotEmpty()
  abstract title: string;

  @IsNotEmpty()
  @MinLength(6)
  abstract password: string;

  @IsNotEmpty()
  @IsEmail({})
  abstract email: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  abstract homeUrl: string;

  @IsNotEmpty()
  @IsLocale()
  abstract locale: string;
}
