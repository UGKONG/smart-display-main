// 클라이언트
const requestIp = require('request-ip');
const { db } = require('./web');
const { useDateFormat } = require('./main');

module.exports = { dbIsConnect, pageNotFound, logView };

// ROOT ('/') 요청 시
const indexHTML = (info = {}) => {
  const dbstateStyle = `background-color: ${info?.result ? '#33db33' : '#ff4b4b'}`;
  const tag = `
    <head>
      <title>스마트 가로등</title>
      <link rel='stylesheet' href='index.css' />
    </head>
    <body>
      <a class='log' href='/log'>로그보기</a>
      <img src='logo.png' /><h1>Access IP: ${info?.ip}</h1><h1 style='margin-bottom: 0;'>Connect State</h1>
      <ul>
        <li><span class='type'>서버</span><span class='dot' style='background-color: #33db33'></span></li>
        <li><span class='type'>데이터베이스</span><span class='dot' style='${dbstateStyle}'></span></li>
      </ul>
      <h1 style='margin-bottom: 0;'>Last API Request</h1>
      <ul class='api'>
        <li><span class='category'>실시간 날씨</span><span class='dateTime'>${info?.nowWeather ?? '-'}</span></li>
        <li><span class='category'>단기 날씨 예보</span><span class='dateTime'>${info?.shortWeather ?? '-'}</span></li>
        <li><span class='category'>중기 날씨 예보</span><span class='dateTime'>${info?.longWeather ?? '-'}</span></li>
        <li><span class='category'>실시간 미세먼지</span><span class='dateTime'>${info?.nowDust ?? '-'}</span></li>
        <li><span class='category'>단기 미세먼지 예보</span><span class='dateTime'>${info?.shortDust ?? '-'}</span></li>
      </ul>
    </body>
  `;
  return tag;
}

// DB 연결상태 확인
function dbIsConnect (req, res) {
  const oneLineDateFormat = (result) => {
    let data = result[0];
    let Y = data?.DATE?.slice(0, 4);
    let M = data?.DATE?.slice(4, 6);
    let D = data?.DATE?.slice(6, 8);
    let h = data?.TIME?.slice(0, 2);
    let m = data?.TIME?.slice(2, 4);
    let updateDT = useDateFormat(data?.UPDATE_DT);
    return Y + '-' + M + '-' + D + ' ' + h + ':' + m + ' (업데이트: ' + updateDT + ')';
  }
  let getInfo = {};

  db.query(`
    SELECT DATE,TIME,UPDATE_DT FROM now_weather ORDER BY ID DESC LIMIT 1;
  `, (err, result) => {
    getInfo.ip = requestIp.getClientIp(req);
    getInfo.result = err ? false : true;
    getInfo.nowWeather = err ? '-' : oneLineDateFormat(result);

    db.query(`
      SELECT DATE,TIME,UPDATE_DT FROM short_weather ORDER BY ID DESC LIMIT 1;
    `, (err, result) => {
      getInfo.shortWeather = err ? '-' : oneLineDateFormat(result);

      let HTML = indexHTML(getInfo);
      err && console.log(err);
      res.send(HTML);
    });

    
  });
}

// log View 페이지
function logView (req, res) {
  db.query('SELECT * FROM log ORDER BY ID DESC', (err, result) => {
    if (err) return log('log 리스트 조회에 실패하였습니다.', err);
    let tag = '';
    result.forEach(item => {
      tag += `<li>
        <p>${useDateFormat(item.DATE_TIME)} :: ${item.IP}</p>
        <p>${item.DESCRIPTION}</p>
      </li>`;
    });
    res.send(`
      <style>
        * { margin: 0; padding: 0; }
        body { background-color: #333; color: #fff; }
        li { margin-bottom: 10px; line-height: 20px; }
        li > p:first-of-type { font-weight: 700; letter-spacing: 1px; }
        .back { position: fixed; right: 10px; top: 10px; color: #fff; text-decoration: none; padding: 6px 10px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
        .back:hover { background-color: #aaaaaa20; }
        .back:active { background-color: #aaaaaa40; }
      </style>
      <p style='padding: 10px 10px 0px;font-weight: 700;'>최신순 정렬</p>
      <ul style='padding: 10px 20px;'>${tag}</ul>
      <a class='back' href='/'>뒤로가기</a>
    `);
  });
}

// 404 페이지를 찾을 수 없습니다.
function pageNotFound (req, res) {
  res.redirect('/');
}


// IP 필터 함수
// const ipFilter = () => {
//   const isTrue = db.query('SELECT (*) AS COUNT FROM hardware_list');
//   return isTrue;
// }

// 현재 날씨 상태 정보 요청 (클라이언트 응답)
// const _getNowWeather = (req, res) => {
//   let x = req.params.x;
//   let y = req.params.y;
//   db.query(`
//     SELECT * FROM now_weather WHERE NX=${x} AND NY=${y}
//   `, (err, result) => {
//     if (err) {
//       console.log(err);
//       log('클라이언트를 통해 초단기실황 데이터 요청에 실패하였습니다.');
//       return;
//     }
//     log('클라이언트를 통해 초단기실황 데이터 요청에 성공하였습니다.');
//     res.send(result);
//   })
// }

// 장비 리스트 조회
// const getHardwareList = (req, res) => {
//   db.query(`
//     SELECT * FROM hardware_list
//   `, (err, result) => {
//     if (err) {
//       console.log(err);
//       log('장비 리스트 조회 요청에 실패하였습니다.');
//       return;
//     }

//     log('장비 리스트 조회에 성공하였습니다.');
//     res.send(result);
//   })
// }