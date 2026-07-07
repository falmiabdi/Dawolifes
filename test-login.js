const { randomBytes, scrypt, timingSafeEqual } = require('crypto');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');
    scrypt(password, salt, 64, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

function verifyPassword(password, stored) {
  return new Promise((resolve) => {
    const [salt, key] = stored.split(':');
    if (!salt || !key) {
      resolve(false);
      return;
    }
    scrypt(password, salt, 64, (error, derived) => {
      if (error) {
        resolve(false);
        return;
      }
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== derived.length) {
        resolve(false);
        return;
      }
      resolve(timingSafeEqual(keyBuffer, derived));
    });
  });
}

async function run() {
    const hash = await hashPassword('SecurePass@12345');
    console.log('Generated hash:', hash);
    const isValid = await verifyPassword('SecurePass@12345', hash);
    console.log('Is valid:', isValid);
}
run();
