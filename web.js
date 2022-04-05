// 자바스크립트 엄격모드 ON
'use strict';

const express = require('express');
const app = express();
const mysql = require('mysql');
const db_config = require('./config/db.json');
const db = mysql.createConnection(db_config);
const port = 8001;

// 서버엔진, 데이터베이스 내보내기
module.exports = { db, app };

// 엔진 셋팅
<<<<<<< HEAD
app.use(express.static(__dirname + '/public'));
=======
app.set('port', 8001);
app.use('/test', express.static(__dirname + '../view'));
>>>>>>> 9c216677dd983682f452bc6d212fb5d9e8df3330

// 실행
const { serverStart, dbConnect } = require('./main');
db.connect(dbConnect);
app.listen(port, '0.0.0.0', serverStart);

// 클라이언트 API 불러오기
require('./router');