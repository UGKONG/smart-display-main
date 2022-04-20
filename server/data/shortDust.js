const request = require('request');
const conf = require('../config.json').api.subject.shortDust;
const { useNow, useQueryString, useDateFormat, log, apiError } = require('../hook');

module.exports = {
  getShortDustSet (lastDataRequest) {
    let dateTime = useNow({ hour: 0, format: true });
    let [date, time] = dateTime.split(' ');
    time = time.slice(0, 2) + '00';

    let isGetMinutes = conf.time.indexOf(time);
    if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
      dateTime = useNow({ hour: lastDataRequest ? -6 : 0, format: true });
      [date, time] = dateTime.split(' ');
      time = time.slice(0, 2) + '00';
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
      date = dateFormat;

    }
    this.getShortDust({ date });
  },
  getShortDust ({ date }) {

    let query = useQueryString({
      ServiceKey: conf.apiKey,
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

        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다. (shortDust)');

        let data = JSON.parse(result?.body)?.response?.body?.items;
        this.newShortDust({ data, date });
      }
    );
  },
  newShortDust ({ data, date }) {
    let resultArr = [];

    data.forEach(item => {
      let category = item.informCode;
      let dataDate = item.informData;
      let locDataArr = item.informGrade.split(',');
      let [baseDate, baseTime] = item.dataTime.split(' ');
      baseTime = baseTime.slice(0, 2) + ':00';
      locDataArr.forEach(grade => {
        let [loc, val] = grade.split(' : ');
        resultArr.push({ date: dataDate, category, location: loc, value: val, baseDate, baseTime });
      });
    });
    
    let PM10Arr = resultArr.filter(x => x.category === conf.category[0]);
    let PM25Arr = resultArr.filter(x => x.category === conf.category[1]);
    resultArr = [];
    
    PM10Arr.forEach(item => {
      let find = PM25Arr.find(x => x.location === item.location && x.baseDate === item.baseDate && x.baseTime === item.baseTime);
      resultArr.push({ date: item.date, location: item.location, baseDate: item.baseDate, baseTime: item.baseTime, value10: item.value, value25: find.value });
    });
    
    let insertSQL = [];
    resultArr.forEach(item => {
      if (item.location === '경기북부' || item.location === '경기남부') item.location = '경기';
      if (item.location === '영동' || item.location === '영서') item.location = '강원';
      
      insertSQL.push(`('${item.date} 00:00:00','${item.location}','${item.baseDate}','${item.baseTime}','${item.value10}','${item.value25}','${useNow()}')`);
    });

    db.query(`
      INSERT INTO short_dust
      (DATE_TIME,LOCATION,BASE_DT,BASE_TM,VALUE10,VALUE25,CHECK_DT)
      VALUES
      ${insertSQL.join(',')}
      ON DUPLICATE KEY UPDATE
      BASE_DT=VALUES(BASE_DT),BASE_TM=VALUES(BASE_TM),
      VALUE10=VALUES(VALUE10),VALUE25=VALUES(VALUE25),
      CHECK_DT=VALUES(CHECK_DT)
    `, (err, result) => {
      if (err) return log(`대기질 예보통보 조회 실패`, err);
      log(
        `대기질 예보통보 조회: 새로운 데이터 조회`,
        `대기질 예보통보 조회: 새로운 데이터 조회`
      );
    });
  }
}
