import { InputType, Field } from '@nestjs/graphql';
import { NewClientSecretValidator } from './new-client-secret.validator';

@InputType({ description: 'New client secret input' })
export class NewClientSecretInput extends NewClientSecretValidator {
  @Field({
    description: 'Type, allowed options: "SharedSecret", "X509Thumbprint", "X509Name", "X509CertificateBase64"',
  })
  type!: string;

  @Field({ description: 'Expires lifetime in seconds from creation time. ' })
  expiresAt?: number | undefined;

  @Field({ description: 'Description' })
  description?: string | undefined;
}
