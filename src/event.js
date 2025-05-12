// src/event.js
const { finalizeEvent, getPublicKey, getEventHash } = require('nostr-tools');

class NostrEvent {
  // u30a4u30d9u30f3u30c8u3092u4f5cu6210u3059u308b
  static createEvent(privateKey, kind, content, tags = []) {
    const pubkey = getPublicKey(privateKey);
    const createdAt = Math.floor(Date.now() / 1000);

    const event = {
      kind,
      pubkey,
      created_at: createdAt,
      tags,
      content,
    };

    // u30a4u30d9u30f3u30c8u306bu7f72u540du3059u308b
    return finalizeEvent(event, privateKey);
  }

  // u30c6u30adu30b9u30c8u30ceu30fcu30c8u30a4u30d9u30f3u30c8u3092u4f5cu6210u3059u308b
  static createTextNote(privateKey, content, replyTo = null, mentions = []) {
    const tags = [];

    // u8fd4u4fe1u5148u304cu3042u308cu3070u30bfu30b0u306bu8ffdu52a0
    if (replyTo) {
      tags.push(['e', replyTo.id, '', 'reply']);
      if (replyTo.pubkey) {
        tags.push(['p', replyTo.pubkey]);
      }
    }

    // u30e1u30f3u30b7u30e7u30f3u304cu3042u308cu3070u30bfu30b0u306bu8ffdu52a0
    mentions.forEach(pubkey => {
      if (!tags.some(tag => tag[0] === 'p' && tag[1] === pubkey)) {
        tags.push(['p', pubkey]);
      }
    });

    return this.createEvent(privateKey, 1, content, tags);
  }

  // u30e6u30fcu30b6u30fcu30e1u30bfu30c7u30fcu30bfu30a4u30d9u30f3u30c8u3092u4f5cu6210u3059u308b
  static createUserMetadata(privateKey, name, about = '', picture = '') {
    const metadata = {
      name,
      about,
      picture,
    };

    return this.createEvent(privateKey, 0, JSON.stringify(metadata));
  }

  // u30d5u30a9u30edu30fcu30eau30b9u30c8u30a4u30d9u30f3u30c8u3092u4f5cu6210u3059u308b
  static createFollowList(privateKey, follows) {
    const tags = follows.map(pubkey => ['p', pubkey]);
    return this.createEvent(privateKey, 3, '', tags);
  }

  // u30d5u30a3u30ebu30bfu30fcu3092u4f5cu6210u3059u308b
  static createFilter(options = {}) {
    const filter = {};

    if (options.ids) filter.ids = options.ids;
    if (options.authors) filter.authors = options.authors;
    if (options.kinds) filter.kinds = options.kinds;
    if (options.since) filter.since = options.since;
    if (options.until) filter.until = options.until;
    if (options.limit) filter.limit = options.limit;

    // u30bfu30b0u30d5u30a3u30ebu30bfu30fcu306eu8ffdu52a0
    if (options.tags) {
      Object.entries(options.tags).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filter[`#${key}`] = value;
        } else {
          filter[`#${key}`] = [value];
        }
      });
    }

    return filter;
  }
}

module.exports = NostrEvent;