module.exports = { useNow, serverStart, dbConnect }

let timeProcessCount = 0;
let requestCount = 0;
const ip = require('ip');
const requestIp = require('request-ip');
const fs = require('fs');
const request = require('request');
const config_api = require('./config/api.json');
const { db } = require('./web');
const {
  apiErrorCodeList,
  sidoNameList,
  nowWeatherCategoryList,
  nowDustCategoryList,
} = require('./public/static.json');

// 현재 날씨 상태 날짜 & 시간 셋팅
function getNowWeatherTimeSet () {
  let dateTime = useNow({ hour: 0, format: false });
  let [date, time] = dateTime.split(' ');
  time = time.slice(0, 2);
  time = time + '00';

  db.query(`
    SELECT DISTINCT b.NX, b.NY FROM 
    hardware_list AS a LEFT JOIN location_list AS b 
    ON a.LOCATION_ID = b.ID
  `, (err, result) => {
    if (err) return log('위치 정보 조회 요청에 실패하였습니다.', err);
  
    result.forEach(loc => getNowWeather({ date, time, loc }));
  });
}

// 현재 날씨 정보 요청 (기상청 API)
function getNowWeather ({ date, time, loc }) {

  let query = useQueryString({
    ServiceKey: config_api.nowWeatherKey,
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
      newNowWeather({ data, loc, date, time });
    }
  );
}

// 현재 날씨 정보 가공
function newNowWeather ({ data, loc, date, time }) {

  db.query(`
    SELECT COUNT(a.ID) AS COUNT 
    FROM now_weather AS a 
    WHERE NX=${loc.NX} AND NY=${loc.NY}
  `, (err, result) => {
    if (err) return log('초단기실황 데이터 존재여부 요청을 실패하였습니다.', err);
    log('초단기실황 데이터 존재여부를 조회했습니다.');
    let COUNT = result[0]?.COUNT;
    
    if (!COUNT) {  // 신규 생성

      let categorySQL = [];
      nowWeatherCategoryList.forEach(item => {
        let cate = data.find(x => x.category === item);
        categorySQL.push(cate ? cate?.obsrValue : null);
      });
      
      db.query(`
        INSERT INTO now_weather
        (NX,NY,DATE,TIME,${nowWeatherCategoryList.join(',')})
        VALUES
        (${loc.NX},${loc.NY},'${date}','${time}',${categorySQL.join(',')})
      `, (err, result) => {
        if (err) return log('초단기실황 신규 데이터 삽입에 실패하였습니다.', err);

        log('초단기실황: 새로운 데이터로 추가됨');
      });

    } else {  // 기존 수정
      let categorySQL = [];
      nowWeatherCategoryList.forEach(item => {
        let cate = data.find(x => x.category === item);
        categorySQL.push(item + '=' + (cate ? cate?.obsrValue : null));
      });

      db.query(`
        UPDATE now_weather SET
        DATE='${date}',TIME='${time}',${categorySQL.join(',')}
        WHERE
        NX=${loc.NX} AND NY=${loc.NY};
      `, (err, result) => {
        if (err) return log('초단기실황 신규 데이터 업데이트에 실패하였습니다', err)

        log('초단기실황: 새로운 데이터로 교체됨');
      });
    }
  });
}

// 현재 미세먼지 정보 요청 (에어코리아 API)
function getNowDust (item) {
  let sidoName = sidoNameList.find(x => x.long === item.PATH1)?.short ?? '서울';

  let query = useQueryString({
    serviceKey: config_api.nowDustKey,
    returnType: 'json',
    numOfRows: 1000,
    pageNo: 1,
    sidoName: encodeURI(sidoName),
  });
  
  request(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${query}`,
    (err, result) => {
      if (err) return log('시도별 실시간 미세먼지 데이터 요청에 실패하였습니다. (' + item.PATH3 + ')', err);

      log('시도별 실시간 미세먼지 데이터 요청에 성공하였습니다. (' + item.PATH3 + ')');

      let errorCode = JSON.parse(result.body).response.header.resultCode;
      if (Number(errorCode) > 0) return apiError(errorCode);

      let data = JSON.parse(result.body).response.body.items;
      newNowDust(data, item);
    }
  )
}

// 현재 미세먼지 정보 가공
function newNowDust (data, item) {
  // nowDustCategoryList
  let sidoName = sidoNameList.find(x => x.short === data.sidoName)?.long ?? '서울특별시';
  const _data = data[0];
  // console.log(_data);

  db.query(`
    SELECT * FROM now_weather WHERE
    LOCATION LIKE '${sidoName}%'
  `, (err, result) => {
    if (err) return log('시도별 실시간 미세먼지 데이터 존재여부 요청을 실패하였습니다.', err);

    log('시도별 실시간 미세먼지 데이터 존재여부를 조회했습니다.');

    if (result.length === 0) {  // 신규 생성
      db.query(`
        INSERT INTO now_weather ()
      `, (err, result) => {

      })
    } else {  // 기존 수정
      
    }
  });
}

// 일정 시간마다 실행할 함수들
function getFunctions () {
  getNowWeatherTimeSet();
  //
  //
}

// Time Process
function timeProcess () {

  getNowWeatherTimeSet();

  setInterval(() => {
    let minutes = new Date().getMinutes();
    if (minutes != config_api.getMinutes) return;
    timeProcessCount++;
    console.log('Time Process가 실행되었습니다.. (' + timeProcessCount + ')');
    getFunctions();
  }, 60000);
}

// 서버 시작 함수
function serverStart () {

  console.clear();
  log('Nodejs 서버 연결 성공');
  timeProcess();
}

// Database 연결 함수
function dbConnect (err) {
  if (err) return log('데이터베이스 연결에 실패하였습니다.', err);
  log('데이터베이스 연결 성공');
}

// log.txt에 log 저장
function log (logText = '', error) {
  db.query(`
    INSERT INTO log (DATE_TIME,DESCRIPTION) VALUES ('${useNow()}','${logText}');
  `, (err, result) => {
    err && console.log('log 저장에 실패하였습니다.');
    error && console.log(error);
  });
}

// API 에러 코드 함수
function apiError (code) {
  let find = apiErrorCodeList.find(x => Number(x.id) === Number(code));
  log(
    '공공데이터 포털 API 에러 (에러코드: ' + code + ', 메시지: ' + find.msg + ', 설명: ' + find.desc + ')',
    { code, msg: find.msg, description: find.desc }
  );
}

// Object -> Query (String) 변환 함수
function useQueryString (obj) {
  let strArr = [];
  let keys = Object.keys(obj);
  keys.forEach(key => strArr.push(key + '=' + obj[key]));
  let result = strArr.join('&');
  return result;
}

// 현재 날짜 & 시간 출력 함수
function useNow (option = { hour: 0, format: true }) {
  let hour = option.hour;
  let format = option.format;
  let date = new Date();
  if (hour !== 0) date.setHours(date.getHours() + hour);
  let Y = String(date.getFullYear());
  let M = String((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1));
  let D = String(date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
  let h = String(date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
  let m = String(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  let s = String(date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

  if (!format) return Y + M + D + ' ' + h + m + s;
  let result = Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
  return result;
}