// 클라이언트
const requestIp = require('request-ip');
const { db } = require('./web');

module.exports = { dbIsConnect };

const indexHTML = ({ ipAddress, result }) => {
  const stateStyle = `background-color: ${result ? '#33db33' : '#ff4b4b'}`;
  const tag = `
    <style>
      * { list-style: none; padding: 0; font-family: monospace; }
      html, body { width: 100%; height: 100%; }
      body { color: #fff; background-color: #333; display: flex; align-items: center; justify-content: center; flex-flow: column; }
      img { width: 300px; margin-bottom: 40px; } h1 { font-size: 28px; }
      li { margin-bottom: 6px; font-size: 24px; }
      span { display: inline-block; width: 60px; }
      span.type { width: 120px; }
      span.dot { width: 10px; height: 10px; border-radius: 100%; }
    </style>
    <body>
      <title>스마트 가로등</title>
      <img src='/logo.png' /><h1>Access IP: ${ipAddress}</h1><h1 style='margin-bottom: 0;'>Connect State</h1>
      <ul>
        <li><span class='type'>Server</span><span class='dot' style='${stateStyle}'></span></li>
        <li><span class='type'>MySQL</span><span class='dot' style='${stateStyle}'></span></li>
      </ul>
    </body>
  `;
  return tag;
}

function dbIsConnect (req, res) {
  db.query('SELECT * FROM test', (err) => {
    const ipAddress = requestIp.getClientIp(req);
    let result = err ? false : true;
    res.send(indexHTML({ ipAddress, result }));
  })
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
