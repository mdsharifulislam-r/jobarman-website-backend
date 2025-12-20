import crypto from 'crypto';

const cryptoToken = (len:number=32) => {
  return crypto.randomBytes(len).toString('hex');
};

export default cryptoToken;
