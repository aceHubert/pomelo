import { InputType, Field, Int } from '@nestjs/graphql';
import { NewClientSecretValidator } from './new-client-secret.validator';

@InputType({ description: 'New client secret input' })
export class NewClientSecretInput extends NewClientSecretValidator {
  /**
   * Type, allowed options: "SharedSecret", "X509Thumbprint", "X509Name", "X509CertificateBase64"
   */
  type!: string;

  /**
   * Expires lifetime in seconds from creation time.
   */
  @Field(() => Int)
  expiresAt?: number;

  /**
   * Description
   */
  description?: string;
}
