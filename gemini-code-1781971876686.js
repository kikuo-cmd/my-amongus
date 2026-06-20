const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// publicフォルダ内の静的ファイル（HTMLなど）を公開
app.use(express.static('public'));

// 接続中の全プレイヤーの位置データ
let players = {};

io.on('connection', (socket) => {
  console.log(`ユーザーが接続しました: ${socket.id}`);

  // 新しいプレイヤーをランダムな位置に生成（本家風に初期位置を設定）
  players[socket.id] = {
    x: Math.floor(Math.random() * 400) + 50,
    y: Math.floor(Math.random() * 400) + 50,
    color: '#' + Math.floor(Math.random()*16777215).toString(16), // ランダムな服の色
    id: socket.id
  };

  // 全員に現在のプレイヤー一覧を送信
  io.emit('currentPlayers', players);

  // プレイヤーが移動したとき
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      // 他の全員に「この人が動いたよ」と通知
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // 切断したとき
  socket.on('disconnect', () => {
    console.log(`ユーザーが切断しました: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});