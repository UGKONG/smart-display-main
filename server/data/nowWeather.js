const request = require('request');
const config_api = require('../json/api.json');
const { useNow, useQueryString, log, apiError } = require('../hook');
const { nowWeatherCategoryList } = require('../json/static.json');

module.exports.nowWeather = {
  getNowWeatherSet (lastDataRequest) {
    let dateTime = useNow({ hour: lastDataRequest ? -1 : 0, format: false });
    let [date, time] = dateTime.split(' ');
    time = time.slice(0, 2);
    time = time + '00';

    db.query(`
      SELECT DISTINCT b.NX, b.NY FROM 
      hardware_list AS a LEFT JOIN location_list AS b 
      ON a.LOCATION_ID = b.ID
    `, (err, result) => {
      if (err) return log('위치 정보 조회 요청에 실패하였습니다.', err);
    
      result.forEach(loc => this.getNowWeather({ date, time, loc }));
    });
  },
  getNowWeather ({ date, time, loc }) {

    let query = useQueryString({
      ServiceKey: config_api.apiKey,
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
        log('초단기실황 데이터 요청에 성공하였습니다. (날짜: ' + date + ', 시간: ' + time + ')');
        
        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');

        let data = JSON.parse(result?.body)?.response?.body?.items?.item;
        this.newNowWeather({ data, loc, date, time });
      }
    );
  },
  newNowWeather ({ data, loc, date, time }) {

    let insertSQL = [];
    let updateSQL = [];
    nowWeatherCategoryList.forEach(item => {
      let cate = data.find(x => x.category === item);
      insertSQL.push(cate ? cate?.obsrValue : null);
      updateSQL.push(item + '=VALUES(' + item + ')');
    });

    db.query(`
      INSERT INTO now_weather
      (NX,NY,BASE_TM,BASE_DT,TIME,DATE,${nowWeatherCategoryList.join(',')})
      VALUES
      (${loc.NX},${loc.NY},'${time}','${date}','${time}','${date}',${insertSQL.join(',')})
      ON DUPLICATE KEY UPDATE
      ${updateSQL.join(',')}
    `, (err, result) => {
      if (err) return log('초단기실황 데이터 수정 요청을 실패하였습니다.', err);
      log(
        '초단기실황: 새로운 데이터 조회 (NX=' + loc.NX + ', NY=' + loc.NY + ')',
        '초단기실황: 새로운 데이터 조회 (NX=' + loc.NX + ', NY=' + loc.NY + ')'
      );
    });
  }
}