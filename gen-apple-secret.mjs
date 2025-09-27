import { importPKCS8, SignJWT } from 'jose';
import { readFileSync } from 'fs';

const TEAM_ID   = 'F47ZLJP9R7';     // Ajusta si difiere
const CLIENT_ID = 'ai.humaniza';
const KEY_ID    = 'S7UM99W73Y';

let PRIVATE_KEY_PEM = readFileSync(
  './AuthKey_fixed.p8', // si no hiciste fixed, pon './AuthKey_S7UM99W73Y.p8'
  'utf8'
).replace(/\r\n/g, '\n').trim();

if (!PRIVATE_KEY_PEM.startsWith('-----BEGIN PRIVATE KEY-----') || !PRIVATE_KEY_PEM.endsWith('-----END PRIVATE KEY-----')) {
  console.error('El .p8 no tiene headers/footers PKCS#8. Verifica el archivo.');
  process.exit(1);
}

const alg = 'ES256';
const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 180;

const main = async () => {
  const privateKey = await importPKCS8(PRIVATE_KEY_PEM, alg);
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg, kid: KEY_ID })
    .setIssuer(TEAM_ID)
    .setSubject(CLIENT_ID)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);
  console.log(jwt);
};

main().catch(e => { console.error('Error generando client secret de Apple:', e); process.exit(1); });
