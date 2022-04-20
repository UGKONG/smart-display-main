const request = require('request');
const conf = require('../config.json').api.subject.nowWeather;
const { useNow, useQueryString, log, apiError } = require('../hook');

module.exports = {
  getNowWeatherSet (lastDataRequest) {
    let dateTime = useNow({ hour: lastDataRequest ? -1 : 0, format: false });
    let [date, time] = dateTime.split(' ');
    time = time.slice(0, 2);
    time = time + '00';

    db.query(`
      SELECT DISTINCT b.NX, b.NY FROM 
      hardware_list AS a 
      LEFT JOIN location_list AS b ON a.LOCATION_ID = b.ID
    `, (err, result) => {
      if (err) return log('위치 정보 조회 요청에 실패하였습니다.', err);
      
      result.forEach(loc => this.getNowWeather({ date, time, loc }));
    });
  },
  getNowWeather ({ date, time, loc }) {

    let query = useQueryString({
      ServiceKey: conf.apiKey,
      pageNo: 1,
      numOfRows: 1000,
      dataType: 'JSON',
      base_date: date,
      base_time: time,
      nx: loc.NX,
      ny: loc.NY
    });

    const validation = (data) => {
      let body = data?.body;
      if (typeof(data) !== 'object') return false;
      if (!body) return false;
      if (body.indexOf('<') > -1) return false;
      let errorCode = JSON.parse(body)?.response?.header?.resultCode;
      if (Number(errorCode)) {
        apiError(errorCode);
        return false;
      }
      return true;
    }

    request(`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?${query}`,
      (err, result) => {
        if (err) return log('초단기실황 데이터 요청에 실패하였습니다. (날짜: ' + date + ', 시간: ' + time + ')', err);
        
        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다. (nowWeather)');

        let data = JSON.parse(result?.body)?.response?.body?.items?.item;
        this.newNowWeather({ data, loc, date, time });
      }
    );
  },
  newNowWeather ({ data, loc, date, time }) {

    let insertSQL = [];
    let updateSQL = [];

    conf.category.forEach(item => {
      let cate = data.find(x => x.category === item);
      insertSQL.push(cate ? cate?.obsrValue : null);
      updateSQL.push(item + '=VALUES(' + item + ')');
    });
    
    let dateTime = 
      ([date.slice(0, 4), '-', date.slice(4, 6), '-', date.slice(6, 8)]).join('') + ' ' +
      ([time.slice(0, 2), ':', time.slice(2, 4), ':', '00']).join('');

    db.query(`
      INSERT INTO now_weather
      (NX,NY,BASE_TM,BASE_DT,DATE_TIME,${conf.category.join(',')},CHECK_DT)
      VALUES
      (${loc.NX},${loc.NY},'${time}','${date}','${dateTime}',${insertSQL.join(',')},'${useNow()}')
      ON DUPLICATE KEY UPDATE
      ${updateSQL.join(',')},CHECK_DT=VALUES(CHECK_DT)
    `, (err, result) => {
      if (err) return log(`초단기실황 데이터 조회 실패`, err);
      log(
        `초단기실황: 새로운 데이터 조회`,
        `초단기실황: 새로운 데이터 조회`
      );
    });
  }
}