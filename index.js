// 자바스크립트 엄격모드 ON
'use strict';

const express = require('express');
const app = express();
const mysql = require('mysql');
// let db = mysql.createConnection(require('./server/config.json').db);


// 엔진 셋팅
app.use(require('cors')());
app.use('/', express.static(__dirname + '/client/build'));

// 서버엔진, 데이터베이스 내보내기
module.exports = { app };
global.app = app;
// global.db = db;

// 실행
const { serverStart, dbConnectCallback, dbConnectErr } = require('./server/main');
// db.connect(dbConnectCallback);
// db.on('error', dbConnectErr);
app.listen(8080, '0.0.0.0', serverStart);


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
  getScreen,
  pageControl,
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

app.get('/api/pageControl', pageControl);
app.get('/api/getScreen', getScreen);
app.get('/api/getData', getData);

app.get('*', pageNotFound);