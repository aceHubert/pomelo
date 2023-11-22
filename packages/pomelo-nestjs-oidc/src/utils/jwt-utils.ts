import { JWT, ConsumeKeyInput, EmbeddedVerifyKeys } from 'jose';
import { JwtClaims } from '../interfaces/claims.interface';

/**
 * @internal
 */
export class JwtUtils {
  // IMPORTANT: doesn't validate the token
  public static decode(token: string) {
    try {
      return JWT.decode(token) as JwtClaims;
    } catch (err) {
      throw err;
    }
  }

  public static verify(token: string, key: ConsumeKeyInput | EmbeddedVerifyKeys) {
    try {
      return JWT.verify(token, key) as JwtClaims;
    } catch (err) {
      throw err;
    }
  }
}
