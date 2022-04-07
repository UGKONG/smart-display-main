// 클라이언트
const requestIp = require('request-ip');
const { db } = require('../web');
const { useDateFormat } = require('./hook');

// 404 페이지를 찾을 수 없습니다.
module.exports.pageNotFound = (req, res) => {
  res.send('Page Not Found');
}

// DB 연결상태 확인
module.exports.isConnect = (req, res) => {
  let getInfo = {};
  getInfo.infoList = [];
  
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

  db.query(`
    SELECT DATE,TIME,UPDATE_DT FROM now_weather ORDER BY ID DESC LIMIT 1;
  `, (err, result) => {
    getInfo.ip = requestIp.getClientIp(req);
    getInfo.result = err ? false : true;
    getInfo.infoList.push({ name: 'nowWeather', value: err ? '-' : oneLineDateFormat(result) });

    db.query(`
      SELECT DATE,TIME,UPDATE_DT FROM short_weather ORDER BY ID DESC LIMIT 1;
    `, (err, result) => {
      getInfo.infoList.push({ name: 'shortWeather', value: err ? '-' : oneLineDateFormat(result) });

      db.query(`
        SELECT DATE_TIME,UPDATE_DT FROM now_dust ORDER BY ID DESC LIMIT 1;
      `, (err, result) => {
        let dateTime = result[0].DATE_TIME;
        result[0].DATE = dateTime.split(' ')[0].replace(/-/g, '');
        result[0].TIME = dateTime.split(' ')[1].replace(/:/g, '');
        getInfo.infoList.push({ name: 'nowDust', value: err ? '-' : oneLineDateFormat(result) });

        err && console.log(err);
        res.send(getInfo);
      });
    });
  });
}

// log View 페이지
module.exports.log = (req, res) => {
  db.query('SELECT * FROM log ORDER BY ID DESC LIMIT 1000', (err, result) => {
    if (err) return log('log 리스트 조회에 실패하였습니다.', err);
    
    let returnData = [];
    result.forEach(item => {
      returnData.push({
        id: item.ID,
        dateTime: useDateFormat(item.DATE_TIME),
        ip: item.IP,
        desc: item.DESCRIPTION
      });
    });
    
    res.send(returnData);
    return;
  });
}