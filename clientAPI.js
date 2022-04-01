// 필요 모듈
const ip = require('ip');
const { app } = require('./web');
const { clientSQL } = require('./main');


// API
// app.get('/api/init', (req, res) => res.send({
//   result: false, 
//   info: '사용법 /api/init/OO동', 
//   msg: '동 위치를 함께 작성해주세요.'
// }));
// app.get('/api/remove', (req, res) => res.send({
//   result: false, 
//   info: '사용법 /api/remove/OO동', 
//   msg: '동 위치를 함께 작성해주세요.'
// }));

// app.get('/api/init/:dong', _init);
// app.get('/api/remove/:dong', _remove);
// app.get('/api/nowWeather/:x/:y', _getNowWeather);
// app.get('/api/hardware', getHardwareList);
// console.log(app);

// 테스트용 라우터
app.get('/clientSQL/:SQL', clientSQL);

// 기타
app.get('*', (req, res) => res.send({
  state: 404, 
  ip: ip.address(), 
  msg: '페이지를 찾을 수 없습니다.' 
}));