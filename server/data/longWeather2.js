const request = require('request');
const conf = require('../config.json').api.subject.longWeather2;
const { useQueryString, log, apiError, useNow, useDateFormat } = require('../hook');

module.exports = {
  getLongWeatherSet(lastDataRequest) {
    db.query(`
      SELECT DISTINCT a.ID, b.CODE2 FROM
      hardware_list a LEFT JOIN area_list b
      ON a.AREA_ID = b.ID
    `, (err, result) => {
      if (err) return console.log(err);

      let dateTime = useNow({ hour: 0, format: false });
      let time = dateTime.split(' ')[1];
      time = time.slice(0, 2) + '00';

      let isGetMinutes = conf.time.indexOf(time);
      if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
        [date] = useNow({ hour: lastDataRequest ? -12 : 0, format: false }).split(' ');

      } else {  // 현재 시간이 요청 시간이 아닐때

        let _date = new Date();
        _date.setHours(0);_date.setMinutes(0);_date.setSeconds(0);
        
        let getTimeList = [...conf.time];
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
    
      result.forEach(item => this.getLongWeather({ areaCode: item.CODE2, date, time }, item.ID));
    });

  },
  getLongWeather({ areaCode, date, time }, hardwareId) {

    let query = useQueryString({
      serviceKey: conf.apiKey,
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

    request(`http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst?${query}`,
      (err, result) => {
        if (err) return console.log(err);

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다. (longWeather2)');

        let data = JSON.parse(result?.body)?.response?.body?.items?.item[0];
        this.newLongWeather({ date, time, data, areaCode }, hardwareId);
      }
    )
    
  },
  newLongWeather({ date, time, data, areaCode }, hardwareId) {
    let resultArr = [];
    let startDate = 3;
    let dayCount = parseInt(Object.keys(data).length / 6, 0);
    let dateFormat = date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  
    for (let i = 0; i < 5; i ++) {
      let _date = new Date(dateFormat);
      _date.setDate(_date.getDate() + i + 3);
      _date = useDateFormat(_date).split(' ')[0];

      let rainAM = data['rnSt' + (i + startDate) + 'Am'];
      let rainPM = data['rnSt' + (i + startDate) + 'Pm'];
      let skyAM = data['wf' + (i + startDate) + 'Am'];
      let skyPM = data['wf' + (i + startDate) + 'Pm'];
      let pushObj = { date: _date, rainAM, rainPM, skyAM, skyPM };
      resultArr.push(pushObj);
    }

    let insertSQL = [];

    resultArr.forEach(item => {
      insertSQL.push(`('${areaCode}','${item.date} 00:00:00',${item.rainAM},${item.rainPM},'${item.skyAM}','${item.skyPM}','${time}','${date}','${useNow()}')`);
    });

    db.query(`
      INSERT INTO long_weather2
      (AREA_CODE,DATE_TIME,RAIN_AM,RAIN_PM,SKY_AM,SKY_PM,BASE_TM,BASE_DT,CHECK_DT)
      VALUES
      ${insertSQL.join(',')}
      ON DUPLICATE KEY UPDATE
      RAIN_AM=VALUES(RAIN_AM),RAIN_PM=VALUES(RAIN_PM),
      SKY_AM=VALUES(SKY_AM),SKY_PM=VALUES(SKY_PM),
      BASE_TM=VALUES(BASE_TM),BASE_DT=VALUES(BASE_DT),
      CHECK_DT=VALUES(CHECK_DT)
    `, (err, result) => {
      if (err) return log(`중기예보(하늘,강수량) 조회 실패 (장비: ${hardwareId})`, err);
      log(
        `중기예보(하늘,강수량) 조회: 새로운 데이터 조회 (장비: ${hardwareId})`,
        `중기예보(하늘,강수량) 조회: 새로운 데이터 조회 (장비: ${hardwareId})`
      );
    })
  }
}