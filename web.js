// 자바스크립트 엄격모드 ON
'use strict';

const express = require('express');
const app = express();
const mysql = require('mysql');
const db_config = require('./config/db.json');
const db = mysql.createConnection(db_config);

// 서버엔진, 데이터베이스 내보내기
module.exports = { db, app }

// 클라이언트 API 불러오기
require('./router');

// 엔진 셋팅
app.set('port', 8001);
app.use(express.static(__dirname + '/public'));

// 실행
const { serverStart, dbConnect } = require('./main');
db.connect(dbConnect);
app.listen(app.get('port'), '0.0.0.0', serverStart);