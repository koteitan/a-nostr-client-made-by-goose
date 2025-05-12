// src/user.js
const { nip19, generateSecretKey, getPublicKey } = require('nostr-tools');

class NostrUser {
  constructor(privateKey = null) {
    // u79d8u5bc6u9375u304cu306au3051u308cu3070u65b0u3057u304fu751fu6210
    this.privateKey = privateKey || generateSecretKey();
    this.publicKey = getPublicKey(this.privateKey);
  }

  // u30e6u30fcu30b6u30fcu306eu516cu958bu9375u3092u53d6u5f97
  getPublicKey() {
    return this.publicKey;
  }

  // u30e6u30fcu30b6u30fcu306eu79d8u5bc6u9375u3092u53d6u5f97
  getPrivateKey() {
    // u30d0u30a4u30c8u914du5217u3092u5341u516du9032u6570u6587u5b57u5217u306bu5909u63db
    return Buffer.from(this.privateKey).toString('hex');
  }

  // u65b0u3057u3044u30e6u30fcu30b6u30fcu3092u751fu6210
  static generateNewUser() {
    return new NostrUser();
  }

  // u79d8u5bc6u9375u304bu3089u30e6u30fcu30b6u30fcu3092u5fa9u5143
  static fromPrivateKey(privateKey) {
    return new NostrUser(privateKey);
  }

  // u516cu958bu9375u3092u77edu3044u5f62u5f0fu3067u8868u793a
  getShortPublicKey() {
    return `${this.publicKey.substring(0, 8)}...${this.publicKey.substring(this.publicKey.length - 8)}`;
  }
}

module.exports = NostrUser;