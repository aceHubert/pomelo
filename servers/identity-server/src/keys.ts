import * as fs from 'fs';
import { Logger } from '@nestjs/common';
import { importPKCS8, exportJWK, JSONWebKeySet, KeyLike } from 'jose';

const DEV_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDV151dqKKhNE3t
FfrCHL8UZ93i6a0zUHVz9BZ6Dily55bnqimY+T8prwMdWC6rN/gAB2n3JK1/6ct5
vYAuYqs5WSWymT3xQglehtYtRVAvJSent0i4Efj247tlckj6Ni7ovAe6F9UxtaHR
OxrVgRQXearhC2tdmlYaIQ/5b4FxxXKuoC60Yu0g14zfpYkuMnzCCk0fzmeLADok
fZgAfVEAjTIat8WvXFd4Kj6yUJ8uohgzze72GFJUfB4RLxjc0QPzTLEziGe7Rl7x
XMsq79S/lSpJdCzLv1tF56QnktfQwPEqjpng6nDinhSwTNUOkqi04aOLLWT+KQjM
YpI8y0b/AgMBAAECggEAKZKqeFvhih+GCtKcFoLKLyhmPcgaMQCyZOGOQRphuoIF
l3JAdgn22p64p0rOf+D4qODIHBEYXebQ9RD/S4VJLnQDXS5nmXCyK5thJhn0lcXO
aM+8JnTwBueNNhK611ITWpG7mtUpUGm0VN39wIZAprOzod67d84acSf+WAryinBy
d17qEeGChtXOmSVZrwJ1Mv+3gXEzq4qxJl7Bag6grHC0dD5oxk0LBqJQtuxYMLcN
knR/27CYvFIy6ebkWeJXEX+hb8WYlEioSvoN6giwE09iG3xe+ptKVqK4Y6gbUAvz
NBpXLPVhC20orhQVieZ0+USu5r3u1eR6ehvrC6vAYQKBgQDt+hW1oQs3LKWgE125
6HJPVM9+8LWqgRiEFbIyIBk1bt/TPX/aixaMMEeQJRLBOdDkVZtTvf7nEHl9U7X5
ZwLN94lJjUv/DMUWREjBYxgkFgvPsUeDxyUUvm3pOg4VWre484hQQOKeE/cBwzgf
6rqyJ6hJiuXdkf9ZJMLioHhkDwKBgQDmCZr68DBhnkW1H03hjKy+Yr44l1zzWquP
YNWmRvFiX8JzKKD2W/PzRYcc4B9dOMP51I1CBjM/4ypJNvT9IFuagpIZUfyrB6a0
cKxDFT9ONV82Frpso98S32EoCxCa1do3yrwKL81amNcsazogsjMqfyA7ffEjpWZ/
wySJBV8+EQKBgQDslR/6BlVBD9jEcBxQkv75USZLW4AvNtIplewmmvSUw1ovBkfR
+056JhEvAzxG7nR2W4jk0tDT4/PznUIe5MLMApfwkFEKCSbyQQZXg21fiq9JVkPz
hQqfOcXJBFc18Y8OhsVwi2D/qHd6wBpO2KusK3LJUhW9lcRWWg6JAOFPDwKBgQC8
0bGWvMTZu/J340QoGTJJ6/87sHKphglAXTnBjIXiO7v+jqDg10V8r9thxk24VTn3
vZJdWX2DuVEiW6vogkDuqLKHehatxE//2GRtg+k8pu6KFUnclv4qHZVAKyTsExFV
rmF+8xHahY5JdZJ2+A6rmUG503y1x7REtscseW5eIQKBgHrIFEiqFy4Dp0JhzBmV
M/Z0Y5nTVHEHSFtMObX28/x4cozjY8cPALDev8Nj8sqUDNividVqlQtkejp9TBF9
DIuVY3H9AfPj/SczqdAOODJipgtIaxdsaFGGrLLUWH65sTVjZgcLqJicEmhwZhKD
k+URxOjSDTFpcEFe2oTiOH6Z
-----END PRIVATE KEY-----`;

const logger = new Logger('keys', { timestamp: true });

export const getPrivateKeyFromFile = async (path: string): Promise<string | undefined> => {
  try {
    const privateKey = await fs.promises.readFile(path, 'utf8');
    return privateKey;
  } catch (error: any) {
    logger.error(`Error reading private key from file: ${error.message}`);
    return;
  }
};

export const getKey = async (pkcs8 = DEV_PRIVATE_KEY, alg = 'RS256'): Promise<KeyLike> => {
  if (pkcs8 === DEV_PRIVATE_KEY) {
    logger.warn('Using default private key, please provide your own private key in production');
  }
  return importPKCS8(pkcs8, alg);
};

export const getJWKS = async (pkcs8 = DEV_PRIVATE_KEY): Promise<JSONWebKeySet> => {
  const key = await getKey(pkcs8);
  const jwk = await exportJWK(key);
  return {
    keys: [jwk],
  };
  // {
  //   keys: debug
  //     ? [
  //         {
  //           p: 'xtPNYqTMy_AhvR7emZXo-ddOXQ3PekXLzefL7QC0X27Gsia2KZ3Zu1R6FE7fAT3cGGw4pfzS625H1jOH9zJJKiqzOigu63ison0vHsxFlAX2iu776DVqs6d7aOhYYklbY5xCUWP-wHAODRr1y6M5CCoUyzbS0SnQ0JGbbLQyGQ8',
  //           kty: 'RSA',
  //           q: 'qPsoMPzpx_bs49HFAHc4TNalOP_HM6eEwLAHMjrLc2gJIUeiAGlT8BdcPZtowSX82-hbZV8Ob81zpzJubTgivWs31w9rVX-j2hmKEH03ZgQSfY5ediMckssQjmRECpT2vN8VvNz23spePIN9P30flWaJuFg_vwgSx7Y3WsdmxUs',
  //           d: 'eb1_2nVLoKqZLJLarDVMmy2xVgW7WfwDLTQqmjxk5M93xeKoNob2RU9exRs9H38i6hZ9is5X60omRC-jk-_vqif9ZHbB-RNO9QpBS0YtfxS7le540FssJX4dVH-irgHtls81ukMx2vEy0TFQl-cTNQm7MSjS0a-nOqaSK8xU5SAnb3Z0ais4B1bMAs8pWxWM-dnUbEVN4fdCnHsFTRBpEYscdyTCzTs6ppgeTtkuonhSmO3TtrDRotPhqBDwCVbH8XxBsomwvl9KY1U4BIq9Y-EWq27oQDjEdmo9smh_0fh0OMJIZ51XKMwrxctrF7o7sg6NS7oeDpCMufmCLegBoQ',
  //           e: 'AQAB',
  //           use: 'sig',
  //           kid: '93J_YBZFn9dR-xu18kOV7A2EEeU4-w824Nnw1D6fFVo',
  //           qi: 'QTOHT0K-o_Jk8pnTcFRV_waouTrMYF3VjzCz_zIEid1SV8aYNVx_GTHlIhT5vwLLd-dzT3mrum38AwU9dcMOM_pI3FSYKTL3kHue7NgrSHnW4V84TVbW6Kgux6ogDpzjNaNjhYwUCk366-dZYVrRU6p21L2pcqSguhlDRODeYy4',
  //           dp: 'XXKaq2wtXQSFtu9VS_YrQ5GwIQgmpZ88RJBXRhL4s4nLFVwgbbrk5Ki1n-nZ4imC0m-6yDjloQV5-fDKTKJzxL_A8OqF8uIKsWwIw37ajNGoqG_eMas5dSqYVBwvvjIgI9cDTGGlECkaUYqET6ttWKr-juw7dVcj74Mf-51Nln0',
  //           alg: 'RS256',
  //           dq: 'GPTW7706jbTTMaZWcQYqg3aj-jIUanWQLqEQvwNd7tJrnsWkkGj945Sfo92i7_u7R4MelG8gg7SVIxlYo7rJrq36FkIJuRvbyCdDc8H6f4-UZ4SyQMJYwvlIna8DOYjck_JilH0R3L-IgWluAwVot7joGBi4eW8ozuQDct3GONc',
  //           n: 'gz4PqkAZ9yHmBccYwdgmVvXHFPNOH23Hgl9N6kQ_4PUaq5YkbCMXD58g7sKHEbz4QbuCagjWgKHHh-QjdJx3GSFZkCvShQZmpphvIOC9fLDpCRrG9c8jAVtov74z3t6p09q5zI-zDBtpwjuAbR25-oeQZtWrjZqRPc80mRMr-EdK4lJFPagIk718oWIPqvTojQhdYXsHtESMp6X8mdFgPRMPX2RM3thEtlWdxxLS6bAlJocYAtw8sW4Xm5sQEaWeYZ4Rg-vtywDZlJluMPDXEIfhswrg_Jitod-zGW4uHe0WR32oOAXA8VUpqB1X4eBLSBjVqu44gZcrTvU5_O_iZQ',
  //         },
  //       ]
  //     : [
  //         {
  //           p: '04eRUaRpAvXZikctZQ7t8_OwEYVteHphMpl9v0JBWQ8GfrKYsCSW6TyH9cPIbFi3Mx1flGO2nO7VfFCkmcxGO4MErjRGcEJmhpAGMZX9pWiLZMJ2XwD-gbZ1B1mqtUG8XifHxB5LOGqn7Dxu5e2hZzIZWYJkHPFFWEBOGBe2xvM',
  //           kty: 'RSA',
  //           q: 'u48bIaB2u7EzwtSqDYjT0rQp-VL0ivbD5y_gK7wukCfJRLHQYvWWtSFE4jYbzcb_DsXOgkH2SobZg7zI6S4nW7jMls5rqRmo5FbJlWcpCXkeOv4rbKxDx9hbgZ-SASIobqB6QcvHCoTSufdcr0yaF0DPZ47oGbDP423RjCGPDBU',
  //           d: 'EK0Vm10PbIqoiObD69Mw4MVNscO_nNlNWj9ZQF0UvBWZBwnf_s_Wdd6WVIlozRAaRcVcSsZm-Yh4RNyNH7fl0Pvau9gSCgtGh9HdP_ynRkOZ9gk2CV5lPBse_0D7gw2HZ8PMQftBbTg6GL5kpYj0ULGrL_kO1b6cDIfXmhgJWisLpQLRQY5AFBX0Ry19iGA4uu1MujinQ-2DZP87eoTie0oKt0drCUwdFjXshgrRSGi-vSpjlHTTCg99taHLODI3iwSmK7Y2uATQcpbH1GMaXRQ2jK-OZOeqH0qh_tTvVlBFeYI_IBlZdfJZh64un3Qev9gsknFyqSYzgSSN9umO4Q',
  //           e: 'AQAB',
  //           use: 'sig',
  //           kid: 'POAtnw37qoO9ibJfAAfpH9cslsNC5dyJo7raChSYqrQ',
  //           qi: 'VASQdA9bxQ0AbnHA9oBrVrMUNBYw5eCBspQivx8qnOb4yCyN4TlGHHNsZrTs7DkzeWZdnhLxHQgqFtzaMzFjHnvYjC-s8sUyhLPyfzfziG8BTr9-xEc4EFfb2Q2ieByt-PolgCh-KQEaGCS07Dr9hVySkB_Wo0uegfwJLAV4B0Y',
  //           dp: 'n9yPxazENBmLG4bpVruut7RONx-oeOm8NVps_zNaYa0KUow0-sHcT06Qzfr1qHRvl7C2QFYPd5DERNxJWXZZCbbdva4CIer8wutr0uOxOuXEmxSgEvKUZYF39mMcsTmJ23qi7aObY3qvh8iwYxJw7aWeJNh3QqxQpP6MRob9emM',
  //           alg: 'RS256',
  //           dq: 'YGfAVFp8bSE6L8zL08Uey9DbOlJPbBZGv9A184T4khRBOdQD_rmpS1TcaUHSrMS6WUeHTCDHjasepr4kruaQSG8GigV0BSkxTJznZKnvx_S_eycl_ufUtyYYctooW_jIu4Q1ExjBKED5Z6kjtN803PrtIJet6XaehJHwAY1GT7k',
  //           n: 'mvpGS-UXuhX3IFsTHbw2vd1ij86t-s5GHl-sWa1qxPxD1bR1D9JOVBznSHLoRpp55Y8ak-snWUg7unnBbPE-ncFnz-SfzfOIdjZ90QWi4gvqR0Q__BhYFhWacPhniK13aDrPRmhh4wTEWurZqajxZNh_138DS9m6_tWatzz3g0mlvi_MuujOkJ5gUTJffkOhmNLqKAGmYqcJUvkpWe5HBi-sNQFV7Gg5PdGW7BKrNkrrH3tdnIrDHhIF5sjgtYHD22guzpSQp9didTtRfHV8Nfno-C1zjYiIP9lwfJxWYY5k4O7Xra60wJICMSvLKJ3hCwwN-iNOGxJaS4e4-A617w',
  //         },
  //       ],
  // };
};
