// 자바스크립트 엄격모드 ON
'use strict';

const cors = require('cors');
const express = require('express');
const app = express();
const mysql = require('mysql');
const db_config = require('./server/json/db.json');
const db = mysql.createConnection(db_config);
const port = 8001;

// 서버엔진, 데이터베이스 내보내기
module.exports = { db, app };
global.app = app;
global.db = db;

// 엔진 셋팅
app.use(cors());
app.use(express.static(__dirname + '/../client/build'));

// 실행
const { serverStart, dbConnect } = require('./server/main');
db.connect(dbConnect);
app.listen(port, '0.0.0.0', serverStart);

const {
  isConnect, 
  pageNotFound, 
  log 
} = require('./server/api');

// API
app.get('/api/isConnect', isConnect);
app.get('/api/log', log);
app.get('*', pageNotFound);