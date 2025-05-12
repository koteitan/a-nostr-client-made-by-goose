const WebSocket = require('ws');
const { generateSecretKey, getPublicKey } = require('nostr-tools');

class NostrRelay {
  constructor(url) {
    this.url = url;
    this.client = new WebSocket(this.url);
    this.connection = null;
    this.subscriptions = {};
    this.connected = false;
  }

  // リレーに接続する
  connect() {
    return new Promise((resolve, reject) => {
      this.client.on('open', () => {
        console.log(`1`);
        this.connection = this.client;
        this.connected = true;

        console.log(`2`);
        this.client.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        console.log(`3`);
        this.client.on('close', () => {
          console.log('リレー接続が閉じられました');
          this.connected = false;
        });

        this.client.on('error', (error) => {
          console.error(`リレー接続エラー: ${error.toString()}`);
          this.connected = false;
        });

        console.log(`4`);
        resolve(this.client);
      });

      console.log(`5`);
      this.client.on('error', (error) => {
        console.error(`接続エラー: ${error.toString()}`);
        reject(error);
      });
    });
  }

  // イベントを送信する
  sendEvent(event) {
    if (!this.connected || !this.connection) {
      console.error('リレーに接続されていません');
      return false;
    }

    try {
      const message = JSON.stringify(['EVENT', event]);
      console.log(`送信: ${message}`);
      this.connection.send(message);
      console.log('送信成功');
      return true;
    } catch (error) {
      console.error(`送信エラー: ${error.toString()}`);
      return false;
    }
  }
  // イベントをリクエストする
  subscribe(subscriptionId, filters, callback) {
    if (!this.connected || !this.connection) {
      console.error('リレーに接続されていません');
      return false;
    }

    // サブスクリプションを保存
    this.subscriptions[subscriptionId] = callback;

    // REQメッセージを送信
    const message = JSON.stringify(['REQ', subscriptionId, ...filters]);
    console.log(`送信: ${message}`);
    this.connection.send(message);
    return true;
  }

  // サブスクリプションを閉じる
  unsubscribe(subscriptionId) {
    if (!this.connected || !this.connection) {
      console.error('リレーに接続されていません');
      return false;
    }

    // CLOSEメッセージを送信
    const message = JSON.stringify(['CLOSE', subscriptionId]);
    console.log(`送信: ${message}`);
    this.connection.send(message);

    // サブスクリプション削除
    delete this.subscriptions[subscriptionId];
    return true;
  }

  // リレーからのメッセージを処理する
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log(`受信: ${data}`);

      // メッセージタイプに基づいて処理
      switch (message[0]) {
        case 'EVENT':
          // EVENTメッセージの処理
          const subscriptionId = message[1];
          const event = message[2];
          if (this.subscriptions[subscriptionId]) {
            this.subscriptions[subscriptionId](event);
          }
          break;

        case 'EOSE':
          // EOSEメッセージの処理（保存されたイベントの終わり）
          console.log(`EOSE: サブスクリプション ${message[1]} の保存済みイベント取得完了`);
          break;

        case 'OK':
          // OKメッセージの処理（イベント受理確認）
          const eventId = message[1];
          const success = message[2];
          const resultMessage = message[3];
          console.log(`イベント ${eventId} の送信結果: ${success ? '成功' : '失敗'}, メッセージ: ${resultMessage}`);
          break;

        case 'NOTICE':
          // NOTICEメッセージの処理
          console.log(`リレーからの通知: ${message[1]}`);
          break;

        case 'CLOSED':
          // CLOSEDメッセージの処理
          console.log(`サブスクリプション ${message[1]} がリレーによって閉じられました: ${message[2]}`);
          delete this.subscriptions[message[1]];
          break;

        default:
          console.log(`未知のメッセージタイプ: ${message[0]}`);
      }
    } catch (error) {
      console.error(`メッセージの解析エラー: ${error.toString()}`);
    }
  }

  // 接続を閉じる
  close() {
    if (this.connection) {
      this.connection.close();
      this.connected = false;
    }
  }
}

module.exports = NostrRelay;
