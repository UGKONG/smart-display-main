const request = require('request');
const config_api = require('../json/api.json');
const { useNow, useQueryString, useDateFormat, log, apiError, useCleanArray } = require('../hook');
const { shortDustGetTimeList } = require('../json/static.json');

module.exports.shortDust = {
  getShortDustSet (lastDataRequest) {
    let dateTime = useNow({ hour: 0, format: false });
    let [date, time] = dateTime.split(' ');
    time = time.slice(0, 2) + '00';

    let isGetMinutes = shortDustGetTimeList.indexOf(time);
    if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
      dateTime = useNow({ hour: lastDataRequest ? -3 : 0, format: false });
      [date, time] = dateTime.split(' ');
      time = time.slice(0, 2) + '00';
    } else {  // 현재 시간이 요청 시간이 아닐때
      let _date = new Date();
      _date.setHours(0);_date.setMinutes(0);_date.setSeconds(0);
      
      let getTimeList = [...shortDustGetTimeList];
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
      date = dateFormat;

      this.getShortDust({ date });
      // let [y, m, d] = dateFormat.split('-');
      // date = y+
    }
  },
  getShortDust ({ date }) {

    let query = useQueryString({
      ServiceKey: config_api.apiKey,
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

    request(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth?${query}`,
      (err, result) => {
        if (err) return log('대기질 예보통보 조회 데이터 요청에 실패하였습니다.', err);
        // log('대기질 예보통보 조회 데이터 요청에 성공하였습니다.');

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');

        let data = JSON.parse(result?.body)?.response?.body?.items;
        this.newShortDust({ data, date });
      }
    );
  },
  newShortDust ({ data, date }) {
    let resultArr = [];

    data.forEach(item => {
      let dataDate = item.informData;
      let locDataArr = item.informGrade.split(',');
      let baseDate = item.dataTime;
      
      locDataArr.forEach(grade => {
        let [loc, val] = grade.split(' : ');
        resultArr.push({ date: dataDate, location: loc, value: val, baseDate });
      });
    });
    
    let insertSQL = [];
    
    resultArr.forEach(item => {
      insertSQL.push(`('${item.date}','${item.location}','${item.value}','${item.baseDate}')`);
    });

    db.query(`
      INSERT INTO short_dust
      (DATE,LOCATION,VALUE,BASE_DT)
      VALUES
      ${insertSQL.join(',')}
      ON DUPLICATE KEY UPDATE
      DATE=VALUES(DATE),LOCATION=VALUES(LOCATION),VALUE=VALUES(VALUE),BASE_DT=VALUES(BASE_DT)
    `, (err, result) => {
      if (err) return log('대기질 예보통보 조회 데이터 수정 요청을 실패하였습니다.', err);
      log(
        '대기질 예보통보 조회: 새로운 데이터 조회',
        '대기질 예보통보 조회: 새로운 데이터 조회'
      );
    })
  }
}
