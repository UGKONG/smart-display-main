// 자바스크립트 엄격모드 ON
'use strict';

const express = require('express');
const app = express();
const mysql = require('mysql');
const db = mysql.createConnection(require('./server/json/db.json'));

// 서버엔진, 데이터베이스 내보내기
module.exports = { db, app };
global.app = app;
global.db = db;

// 엔진 셋팅
app.use(require('cors')());
app.use('/', express.static(__dirname + '/client/build'));

// 실행
const { serverStart, dbConnect } = require('./server/main');
db.connect(dbConnect);
app.listen(8001, '0.0.0.0', serverStart);

// API에 사용되는 함수 가져오기
const {
  isConnect, 
  getDevice,
  addDevice,
  modifyDevice,
  delDevice,
  getLocation,
  getStation,
  pageNotFound, 
  getLog,
  getData,
} = require('./server/api');

// API
app.get('/api/isConnect', isConnect);
app.get('/api/getDevice', getDevice);
app.post('/api/addDevice', addDevice);
app.put('/api/modifyDevice/:id', modifyDevice);
app.delete('/api/delDevice/:id', delDevice);
app.get('/api/getLocation/:path', getLocation);
app.get('/api/getStation/:path', getStation);
app.get('/api/log', getLog);

app.get('/api/getData', getData);

app.get('*', pageNotFound);