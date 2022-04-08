const request = require('request');
const config_api = require('../json/api.json');
const { useQueryString, log, apiError, useDateFormat } = require('../hook');

module.exports.weatherText = {
  getWeatherText() {
    let query = useQueryString({
      ServiceKey: config_api.apiKey,
      pageNo: 1,
      numOfRows: 10000,
      dataType: 'JSON',
      stnId: 108,
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

    request(`http://apis.data.go.kr/1360000/VilageFcstMsgService/getWthrSituation?${query}`,
      (err, result) => {
        if (err) return log('기상개황조회 데이터 요청에 실패하였습니다.', err);
        log('기상개황조회 데이터 요청에 성공하였습니다.');

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');

        let data = JSON.parse(result?.body)?.response?.body?.items?.item[0];
        if (!data) return console.log('데이터를 가져오지 못했습니다.');
        this.newWeatherText({ data });
      }
    );
  },
  newWeatherText({ data }) {
    let insertSQL = [];
    let result = [];
    let resultArr = [];
    let split = data.wfSv1.split('\n\n')[0].split('○ ');
    split = split.map(item => item.replace('\n', '').replace('  ', ''));
    split.forEach((item, i) => i !== 0 && resultArr.push(item));
    
    let baseDT = String(data.tmFc);
    let baseDate = baseDT.slice(0, 8);
    let baseTime = baseDT.slice(8, 12);
    let Y = baseDate.slice(0, 4);
    let M = baseDate.slice(4, 6);
    let D = baseDate.slice(6, 8);
    let h = baseTime.slice(0, 2);
    let m = baseTime.slice(2, 4);
    let dtResult = `${Y}-${M}-${D} ${h}:${m}:00`;
    
    resultArr.forEach(item => {
      let date = new Date(dtResult);
      let text = '';
      if (item.indexOf('(오늘) ') > -1) {
        date.setDate(date.getDate() + 0);
        text = item.split('(오늘) ')[1];
      } else if (item.indexOf('(내일) ') > -1) {
        date.setDate(date.getDate() + 1);
        text = item.split('(내일) ')[1];
      } else if (item.indexOf('(모레) ') > -1) {
        date.setDate(date.getDate() + 2);
        text = item.split('(모레) ')[1];
      } else {
        text = '';
      }
      date = useDateFormat(date);
      let [dt, tm] = date.split(' ');
      dt = dt.replace(/-/g, '');
      tm = tm.replace(/:/g, '');

      result.push({ date: dt, time: tm, text });
    });

    result.forEach(item => {
      insertSQL.push(`('${item.time}','${item.date}','${item.text}')`);
    });

    db.query(`
      INSERT INTO weather_text
      (TIME,DATE,TEXT)
      VALUES
      ${insertSQL.join(',')}
      ON DUPLICATE KEY UPDATE
      TIME=VALUES(TIME),DATE=VALUES(DATE),TEXT=VALUES(TEXT)
    `, (err, result) => {
      if (err) return log('기상개황조회 데이터 수정 요청을 실패하였습니다.', err);
      log(
        '기상개황조회: 새로운 데이터 조회',
        '기상개황조회: 새로운 데이터 조회'
      );
    });
  }
}

