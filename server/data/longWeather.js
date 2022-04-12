const request = require('request');
const config_api = require('../json/api.json');
const { useQueryString, log, apiError, useNow, useDateFormat } = require('../hook');
const { longDustCategoryList, longWeatherGetTimeList } = require('../json/static.json');

module.exports = {
  getLongWeatherSet(lastDataRequest) {
    db.query(`
      SELECT DISTINCT b.CODE FROM
      hardware_list a LEFT JOIN location_code_list b
      ON a.AREA_CODE_ID = b.ID
    `, (err, result) => {
      if (err) return console.log('위치 정보 조회 요청에 실패하였습니다.', err);

      let dateTime = useNow({ hour: 0, format: false });
      let time = dateTime.split(' ')[1];
      time = time.slice(0, 2) + '00';

      let isGetMinutes = longWeatherGetTimeList.indexOf(time);
      if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
        [date] = useNow({ hour: lastDataRequest ? -12 : 0, format: false }).split(' ');

      } else {  // 현재 시간이 요청 시간이 아닐때

        let _date = new Date();
        _date.setHours(0);_date.setMinutes(0);_date.setSeconds(0);
        
        let getTimeList = [...longWeatherGetTimeList];
        getTimeList.push(time);
        getTimeList = getTimeList.sort((x, y) => x - y);
        let getTimeIdx = getTimeList.indexOf(time);

        if (getTimeIdx === 0) {
          time = getTimeList[getTimeList.length - 1];
          _date.setHours(_date.getHours() - 1);
        } else {
          time = getTimeList[getTimeIdx - 1];
        }

        let dateFormat = useDateFormat(_date)?.split(' ')[0];
        let [y, m, d] = dateFormat.split('-');

        date = y + m + d;
      }
    
      result.forEach(item => this.getLongWeather({ areaCode: item.CODE, date, time }));
    });

  },
  getLongWeather({ areaCode, date, time }) {

    let query = useQueryString({
      serviceKey: config_api.apiKey,
      pageNo: 1,
      numOfRows: 10000,
      dataType: 'JSON',
      tmFc: date + time,
      regId: areaCode,
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
    
    request(`http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?${query}`,
      (err, result) => {
        if (err) return log('중기기온조회 데이터 요청에 실패하였습니다. (측정소: ' + areaCode + ')', err);
        log('중기기온조회 데이터 요청에 성공하였습니다.');

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');
        
        let data = JSON.parse(result?.body)?.response?.body?.items?.item[0];
        this.newLongWeather({ date, time, data, areaCode });
      }
    )
    
  },
  newLongWeather({ date, time, data, areaCode }) {
    let resultArr = [];
    let startDat = 3;
    let dayCount = parseInt(Object.keys(data).length / 6, 0);
    let dateFormat = date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
    
    for (let i = 0; i < dayCount; i ++) {
      let _date = new Date(dateFormat);
      _date.setDate(_date.getDate() + i + 3);
      _date = useDateFormat(_date).split(' ')[0];
      
      let min = data['taMin' + (i + startDat)];
      let max = data['taMax' + (i + startDat)];
      let pushObj = { date: _date, min, max };
      resultArr.push(pushObj);
    }

    let insertSQL = [];

    resultArr.forEach(item => {
      insertSQL.push(`('${areaCode}','${item.date}',${item.min},${item.max},'${time}','${date}')`);
    });

    db.query(`
      INSERT INTO long_weather
      (AREA_CODE,DATE,MIN,MAX,BASE_TM,BASE_DT)
      VALUES
      ${insertSQL.join(',')}
      ON DUPLICATE KEY UPDATE
      MIN=VALUES(MIN),MAX=VALUES(MAX),
      BASE_TM=VALUES(BASE_TM),BASE_DT=VALUES(BASE_DT)
    `, (err, result) => {
      if (err) return log('중기예보 조회 데이터 수정 요청을 실패하였습니다.', err);
      log(
        '중기예보 조회: 새로운 데이터 조회',
        '중기예보 조회: 새로운 데이터 조회'
      );
    })
  }
}