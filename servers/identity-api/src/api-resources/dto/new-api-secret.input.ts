import { InputType, Field } from '@nestjs/graphql';
import { NewApiSecretValidator } from './new-api-secret.validator';

@InputType({ description: 'New api secret input' })
export class NewApiSecretInput extends NewApiSecretValidator {
  @Field({
    description: 'Type, allowed options: "SharedSecret", "X509Thumbprint", "X509Name", "X509CertificateBase64"',
  })
  type!: string;

  @Field({ description: 'Expires lifetime in seconds. ' })
  expiresAt?: number | undefined;

  @Field({ description: 'Description' })
  description?: string | undefined;
}
