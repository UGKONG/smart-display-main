// 필요 모듈
const ip = require('ip');
const { app, db } = require('./web');
const { clientSQL } = require('./main');

// 테스트용 라우터
app.get('/', (req, res) => {
  //test
  db.query('SELECT * FROM test', (err, result) => {
    if (err) return res.send('MySQL Error');

    res.send(
      '<h1>Node Server Start</h1>' + 
      '<h2>접속 IP: ' + ip.address() + '</h2>' +
      '<h3>MySQL Test 결과: ' + JSON.stringify(result) + '</h3>'
    )
  })
});
app.get('/clientSQL/:SQL', clientSQL);

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


// 기타
// app.get('*', (req, res) => res.send({
//   state: 404, 
//   ip: ip.address(), 
//   msg: '페이지를 찾을 수 없습니다.' 
// }));