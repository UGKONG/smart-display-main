// 클라이언트
const requestIp = require('request-ip');
const { db } = require('./web');

module.exports = { dbIsConnect, pageNotFound };

// ROOT ('/') 요청 시
const indexHTML = ({ ipAddress, result }) => {
  const dbstateStyle = `background-color: ${result ? '#33db33' : '#ff4b4b'}`;
  const tag = `
    <head>
      <title>스마트 가로등</title>
      <link rel='stylesheet' href='index.css' />
    </head>
    <body>
      <img src='logo.png' /><h1>Access IP: ${ipAddress}</h1><h1 style='margin-bottom: 0;'>Connect State</h1>
      <ul>
        <li><span class='type'>Server</span><span class='dot' style='background-color: #33db33'></span></li>
        <li><span class='type'>MySQL</span><span class='dot' style='${dbstateStyle}'></span></li>
      </ul>
    </body>
  `;
  return tag;
}

// DB 연결상태 확인
function dbIsConnect (req, res) {
  db.query('SELECT * FROM test', (err) => {
    res.send(indexHTML({
      ipAddress: requestIp.getClientIp(req),
      result: err ? false : true
    }));
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
