import { InputType, Field, Int } from '@nestjs/graphql';
import { NewApiSecretValidator } from './new-api-secret.validator';

@InputType({ description: 'New api secret input' })
export class NewApiSecretInput extends NewApiSecretValidator {
  /**
   * Type, allowed options: "SharedSecret", "X509Thumbprint", "X509Name", "X509CertificateBase64"
   */
  type!: string;

  /**
   * Expires lifetime in seconds
   */
  @Field(() => Int)
  expiresAt?: number;

  /**
   * Description
   */
  description?: string;
}
