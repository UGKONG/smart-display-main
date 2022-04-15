const request = require('request');
const config_api = require('../json/api.json');
const { useQueryString, log, apiError, useDateFormat, useNow } = require('../hook');
const { longDustCategoryList, longDetailDustGetTimeList } = require('../json/static.json');

module.exports = {
  getLongDetailDustSet (lastDataRequest) {
    
    let [date, time] = useNow({ hour: 0, format: true }).split(' ');
    let [h] = time.split(':');
    time = h + '30';
    let isGetMinutes = longDetailDustGetTimeList.indexOf(time);
    
    if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
      let dateTime = useNow({ hour: lastDataRequest ? -24 : 0, format: true });
      [date] = dateTime.split(' ');
    } else {  // 현재 시간이 요청 시간이 아닐때
      [date] = useNow({ hour: -24, format: true }).split(' ');
    }

    this.getLongDetailDust({ date });
  },
  getLongDetailDust ({ date }) {

    let query = useQueryString({
      serviceKey: config_api.apiKey,
      pageNo: 1,
      numOfRows: 10000,
      returnType: 'json',
      searchDate: date,
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

    request(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustWeekFrcstDspth?${query}`,
      (err, result) => {
        if (err) return log('초미세먼지 주간예보 조회 데이터 요청에 실패하였습니다.', err);
        // log('초미세먼지 주간예보 조회 데이터 요청에 성공하였습니다.');

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');

        let data = JSON.parse(result?.body)?.response?.body?.items[0];
        this.newLongDetailDust({ data });
      }
    );
  },
  newLongDetailDust ({ data }) {
    let resultArr = [];
    let baseDate = data.presnatnDt;
    
    longDustCategoryList.forEach(item => {
      let date = data[item + 'Dt'];
      let contents = data[item + 'Cn'];
      if (contents.indexOf(',') > -1) contents = contents.split(', ');

      contents.forEach(_item => {
        let [location, value] = _item.split(' : ');
        resultArr.push({ date, location, value, baseDate });
      });
    });

    let insertSQL = [];

    resultArr.forEach(item => {
      insertSQL.push(`('${item.date} 00:00:00','${item.location}','${item.baseDate}','${item.value}','${useNow()}')`);
    });
    
    db.query(`
      INSERT INTO long_dust
      (DATE_TIME,LOCATION,BASE_DT,VALUE,CHECK_DT)
      VALUES
      ${insertSQL}
      ON DUPLICATE KEY UPDATE
      BASE_DT=VALUES(BASE_DT),VALUE=VALUES(VALUE),CHECK_DT=VALUES(CHECK_DT)
    `, (err, result) => {
      if (err) return log('초미세먼지 주간예보 조회 데이터 수정 요청을 실패하였습니다.', err);
      log(
        '초미세먼지 주간예보 조회: 새로운 데이터 조회',
        '초미세먼지 주간예보 조회: 새로운 데이터 조회'
      );
    });
  }
}