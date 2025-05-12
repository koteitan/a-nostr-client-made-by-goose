// src/index.js
const NostrRelay = require('./relay');
const NostrEvent = require('./event');
const NostrUser = require('./user');

// よく使われるリレーリスト
// 実際のアプリでは複数のリレーを使用すべき
const RELAY_URLS = [
  'wss://yabu.me',
];

// メインクラス
(async function() {
  console.log('Nostrクライアントを起動しています...');
  
  // 新しいユーザーを生成または既存の鍵を使用
  const user = NostrUser.generateNewUser();
  console.log(`ユーザーを生成しました: ${user.getShortPublicKey()}`);
  console.log(`公開鍵: ${user.getPublicKey()}`);
  console.log(`秘密鍵: ${user.getPrivateKey()} (安全に保管してください)`);

  // リレーに接続
  const relays = [];
  for (const url of RELAY_URLS) {
    const relay = new NostrRelay(url);
    try {
      await relay.connect();
      console.log(`リレー ${url} に接続しました on index.js`);
      relays.push(relay);
      console.log(`6`);
    } catch (error) {
      console.error(`リレー ${url} への接続に失敗しました`);
    }
  }
  console.log(`7`);

  if (relays.length === 0) {
    console.error('リレーに接続できませんでした');
    process.exit(1);
  }

  // ユーザーメタデータを作成して送信
  const userMetadata = NostrEvent.createUserMetadata(
    user.getPrivateKey(),
    'こていたんぐーす', // 名前
    'Nostrクライアントのテスト中', // 自己紹介
    'https://i.nostr.build/JTcviSXiuUORKnaJ.jpg' // プロフィール画像
  );

  console.log('\nユーザーメタデータを送信する準備ができました...');
  for (const relay of relays) {
    console.log(`リレー ${relay.url} にユーザーメタデータを送信中...`);
    relay.sendEvent(userMetadata);
  }

  // テキストノートを作成して送信
  const textNote = NostrEvent.createTextNote(
    user.getPrivateKey(),
    'こんにちは、Nostr! これは私の最初のノートです。'
  );

  console.log('\nテキストノートを送信する準備ができました...');
  for (const relay of relays) {
    console.log(`リレー ${relay.url} にテキストノートを送信中...`);
    relay.sendEvent(textNote);
  }

  // 最新のノートをリクエスト
  console.log('\n最新のノートを取得しています...');
  const filter = NostrEvent.createFilter({
    kinds: [1], // テキストノート
    limit: 10    // 最新の10件
  });

  // 最初のリレーからイベントを取得
  relays[0].subscribe('timeline', [filter], (event) => {
    const timestamp = new Date(event.created_at * 1000).toLocaleString();
    console.log(`\n[受信ノート] ${timestamp}`);
    console.log(`作者: ${event.pubkey.substring(0, 8)}...`);
    console.log(`内容: ${event.content}\n`);
  });

  // 単一ユーザーの投稿をリクエスト
  console.log('\nユーザーの投稿を取得しています...');
  const userFilter = NostrEvent.createFilter({
    authors: [user.getPublicKey()],
    kinds: [0, 1], // メタデータとテキストノート
  });

  relays[0].subscribe('user-posts', [userFilter], (event) => {
    if (event.kind === 0) {
      try {
        const metadata = JSON.parse(event.content);
        console.log(`\n[ユーザーメタデータ] ${metadata.name || '名無し'}`);
        if (metadata.about) console.log(`自己紹介: ${metadata.about}`);
      } catch (e) {
        console.error('メタデータの解析エラー');
      }
    } else if (event.kind === 1) {
      const timestamp = new Date(event.created_at * 1000).toLocaleString();
      console.log(`\n[ユーザーノート] ${timestamp}`);
      console.log(`内容: ${event.content}`);
    }
  });

  // 5秒ごとにヘルスチェックを表示
  let count = 0;
  const intervalId = setInterval(() => {
    count++;
    process.stdout.write('.');
    if (count >= 60) { // 5分後にクライアントを終了
      console.log('\nクライアントを終了します...');
      clearInterval(intervalId);
      for (const relay of relays) {
        relay.close();
      }
      process.exit(0);
    }
  }, 5000);

  // クライアントの終了処理
  process.on('SIGINT', () => {
    console.log('\nクライアントを終了します...');
    clearInterval(intervalId);
    for (const relay of relays) {
      relay.close();
    }
    process.exit(0);
  });
})();
