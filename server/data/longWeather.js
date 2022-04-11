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
        dateTime = useNow({ hour: lastDataRequest ? -12 : 0, format: false });
        [date] = dateTime.split(' ');
      } else {  // 현재 시간이 요청 시간이 아닐때
        [date] = useNow({ hour: -12, format: false });
      }
    
      result.forEach(item => this.getLongWeather({ areaCode: item.CODE, date, time }));
    })

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
    console.log('base:', date);
    request(`http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?${query}`,
      (err, result) => {
        if (err) return log('중기기온조회 데이터 요청에 실패하였습니다. (측정소: ' + areaCode + ')', err);
        log('중기기온조회 데이터 요청에 성공하였습니다.');

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');
        
        let data = JSON.parse(result?.body)?.response?.body?.items?.item[0];
        this.newLongWeather({ date, data });
      }
    )
    
  },
  newLongWeather({ date, data }) {
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

    console.log(resultArr);
  }
}