import * as fs from 'fs';
import { Logger } from '@nestjs/common';
import { importSPKI, importPKCS8, exportJWK, KeyLike, JSONWebKeySet, PEMImportOptions } from 'jose';

const DEV_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArcLJ7hUNc3YmjqEL2QlB
bYQ5W/iZJGkYbbGCkj0nG+wNPrL4SWr+xGVLvlL2nj42Wr24NgNZgrVeXovo+Yv4
i0AsZG113l6P4KNFVzbGqIrntVyIlo+IjFG4YjZsWstvStSC6tMzmJs4gJtyZzrO
WD79UyDUOuw3tZa6PMBfmgPNH2XCe9i5bFHxe4wg8O+NX/SD1kc0InnsDScJ9KSE
1bOW+K4iDT65CXlTKqRHeJ4ZykQquDG4Iw+T1eg5JHUR9Rx2ZCSYzB1Dx3Z5DDEv
tzPg8RqXzs6Buv1JoJfsx93zIdPXiXlTMIxqJsGTcdYf8EDk57WjCokZd3nPxsv1
AwIDAQAB
-----END PUBLIC KEY-----`;

const DEV_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCtwsnuFQ1zdiaO
oQvZCUFthDlb+JkkaRhtsYKSPScb7A0+svhJav7EZUu+UvaePjZavbg2A1mCtV5e
i+j5i/iLQCxkbXXeXo/go0VXNsaoiue1XIiWj4iMUbhiNmxay29K1ILq0zOYmziA
m3JnOs5YPv1TINQ67De1lro8wF+aA80fZcJ72LlsUfF7jCDw741f9IPWRzQieewN
Jwn0pITVs5b4riINPrkJeVMqpEd4nhnKRCq4MbgjD5PV6DkkdRH1HHZkJJjMHUPH
dnkMMS+3M+DxGpfOzoG6/Umgl+zH3fMh09eJeVMwjGomwZNx1h/wQOTntaMKiRl3
ec/Gy/UDAgMBAAECggEAG/YGbItyuKvAlJ8RuwEkSC1I1aXxbsyCo9Q2wLWaf4HC
t94w2g+fo5bxU1UiXmCAeqWg6QAs/T2WS/yTpuSBQFc5TYfXucrZuDpNxDUKTsDb
fHHBgQjj3kCgPR2o3gtyg0YjMwp9eQcxVnCtPjNWVRj9xsy3miu84zm4CmKif7Ps
6KPpL/cpVZfpY2/FbmQCXH/Tc4oBgZNPmuQNk5vpteaDObOA1z7TwgtnTVj6Im0L
iREKT3XAvrVTv3j9uYuZ770ILB29DfCcpFieKcwoAxeWAfcPXspKZ12u7LmJ3tOu
lbfO+i2sYUDyKI4DbGbbaMw36DWN94H39lzQiyim8QKBgQDHkKhMq3WtzQn49uAG
Tssn8PSRY55weZsPKI5dnxXklewN+g3amT8sPDG9JEJX7o+LLkgLPr0Od+GNeujn
Pw7Ng6lScsV0nKJbDNdy8mEzuMEXtpbKbZj8vXrEsi2p1TWcs5WpZRVImQNVuvQx
3fJQJYa8eBZs1pf/pYV9SPb2FQKBgQDe5g9qXAGG6zr7+ycbTyL4VMdXAjuA0UrO
wp7HbtCrXxaYL3LrxibNTXhL+BoxShbDSFIR9zJW7ftUEDavfGdlhW20fpp9Fj4c
gfty/JP7bfnGU5bAqdjPYEG/X+lyLWm5Mb2zv/moECXocphRQU0FvQubPpmsP7E5
E+n1kajctwKBgAEaMXPK9qlxGn7/jhk60jB0SkWLUVK5uTuKM88ck9hhY55oJS9x
7UFnS7cJvjwSG0TfipJVVGICE4LejO7KEGDeO08zRxfvzY3HMmF2KUdJ2/cvkQGp
PVEYEteHTG1FujgVXdxDrKxr+/K7R6IG4dHDg00DNMyBGvHUjjo07vhJAoGAWwff
8dMDeKNm4nPuw7NtF7gf9QPfYzuWbpyDFfXG2MYrxxlRuMKjJCNoZrY7lDeq1jQZ
+GZZM7FbfDhm7QJEg+ybIiS2WTGVSjU3iP1oPj3qzTlkDukOt5qbH1o/T7cGP3D2
BYv4nM+De8wZMs4Vc6uCKvPE9NjKOwJMAVNsgD8CgYBmgUOaAMYeZJIQjockerig
njEvrQJXkgCbF1+dhLR4SxRiMtQfjvWMUXN01wRGxX+tZrLRSr0YKJsFVPS1SVIs
AwUCxHfkwsC+b9DR0C5RyS9pnwgeY0q20BzOUdQFwbcwcky8/+2kj7JzK6Ec7zvg
dJu1aa1nPvwShOcmabWhEw==
-----END PRIVATE KEY-----`;

const logger = new Logger('keys', { timestamp: true });

export const getKeyFromFile = async (path: string): Promise<string | undefined> => {
  try {
    const key = await fs.promises.readFile(path, 'utf8');
    return key;
  } catch (error: any) {
    logger.error(`Error reading private key from file: ${error.message}`);
    return;
  }
};

export const getPublicKey = async (
  pkcs8 = DEV_PUBLIC_KEY,
  alg = 'RS256',
  options?: PEMImportOptions,
): Promise<KeyLike> => {
  if (pkcs8 === DEV_PUBLIC_KEY) {
    logger.warn('Using default public key, please provide your own public key in production');
  }
  return importSPKI(pkcs8, alg, options);
};

export const getPrivateKey = async (
  pkcs8 = DEV_PRIVATE_KEY,
  alg = 'RS256',
  options?: PEMImportOptions,
): Promise<KeyLike> => {
  if (pkcs8 === DEV_PRIVATE_KEY) {
    logger.warn('Using default private key, please provide your own private key in production');
  }
  return importPKCS8(pkcs8, alg, options);
};

export const getJWKS = async (pkcs8 = DEV_PRIVATE_KEY): Promise<JSONWebKeySet> => {
  const key = await getPrivateKey(pkcs8);
  const jwk = await exportJWK(key);
  return {
    keys: [jwk],
  };
  // {
  //   keys: [
  //     {
  //       kty: 'RSA',
  //       use: 'sig',
  //       alg: 'RS256',
  //       kid: '1b0cb313-5fc2-42c2-a316-e1a277a3abc3',
  //       d: 'G_YGbItyuKvAlJ8RuwEkSC1I1aXxbsyCo9Q2wLWaf4HCt94w2g-fo5bxU1UiXmCAeqWg6QAs_T2WS_yTpuSBQFc5TYfXucrZuDpNxDUKTsDbfHHBgQjj3kCgPR2o3gtyg0YjMwp9eQcxVnCtPjNWVRj9xsy3miu84zm4CmKif7Ps6KPpL_cpVZfpY2_FbmQCXH_Tc4oBgZNPmuQNk5vpteaDObOA1z7TwgtnTVj6Im0LiREKT3XAvrVTv3j9uYuZ770ILB29DfCcpFieKcwoAxeWAfcPXspKZ12u7LmJ3tOulbfO-i2sYUDyKI4DbGbbaMw36DWN94H39lzQiyim8Q',
  //       n: 'rcLJ7hUNc3YmjqEL2QlBbYQ5W_iZJGkYbbGCkj0nG-wNPrL4SWr-xGVLvlL2nj42Wr24NgNZgrVeXovo-Yv4i0AsZG113l6P4KNFVzbGqIrntVyIlo-IjFG4YjZsWstvStSC6tMzmJs4gJtyZzrOWD79UyDUOuw3tZa6PMBfmgPNH2XCe9i5bFHxe4wg8O-NX_SD1kc0InnsDScJ9KSE1bOW-K4iDT65CXlTKqRHeJ4ZykQquDG4Iw-T1eg5JHUR9Rx2ZCSYzB1Dx3Z5DDEvtzPg8RqXzs6Buv1JoJfsx93zIdPXiXlTMIxqJsGTcdYf8EDk57WjCokZd3nPxsv1Aw',
  //       e: 'AQAB',
  //       p: 'x5CoTKt1rc0J-PbgBk7LJ_D0kWOecHmbDyiOXZ8V5JXsDfoN2pk_LDwxvSRCV-6Piy5ICz69DnfhjXro5z8OzYOpUnLFdJyiWwzXcvJhM7jBF7aWym2Y_L16xLItqdU1nLOVqWUVSJkDVbr0Md3yUCWGvHgWbNaX_6WFfUj29hU',
  //       q: '3uYPalwBhus6-_snG08i-FTHVwI7gNFKzsKex27Qq18WmC9y68YmzU14S_gaMUoWw0hSEfcyVu37VBA2r3xnZYVttH6afRY-HIH7cvyT-235xlOWwKnYz2BBv1_pci1puTG9s7_5qBAl6HKYUUFNBb0Lmz6ZrD-xORPp9ZGo3Lc',
  //       dp: 'ARoxc8r2qXEafv-OGTrSMHRKRYtRUrm5O4ozzxyT2GFjnmglL3HtQWdLtwm-PBIbRN-KklVUYgITgt6M7soQYN47TzNHF-_NjccyYXYpR0nb9y-RAak9URgS14dMbUW6OBVd3EOsrGv78rtHogbh0cODTQM0zIEa8dSOOjTu-Ek',
  //       dq: 'Wwff8dMDeKNm4nPuw7NtF7gf9QPfYzuWbpyDFfXG2MYrxxlRuMKjJCNoZrY7lDeq1jQZ-GZZM7FbfDhm7QJEg-ybIiS2WTGVSjU3iP1oPj3qzTlkDukOt5qbH1o_T7cGP3D2BYv4nM-De8wZMs4Vc6uCKvPE9NjKOwJMAVNsgD8',
  //       qi: 'ZoFDmgDGHmSSEI6HJHq4oJ4xL60CV5IAmxdfnYS0eEsUYjLUH471jFFzdNcERsV_rWay0Uq9GCibBVT0tUlSLAMFAsR35MLAvm_Q0dAuUckvaZ8IHmNKttAczlHUBcG3MHJMvP_tpI-ycyuhHO874HSbtWmtZz78EoTnJmm1oRM',
  //     },
  //   ],
  // };
};
