module.exports = { useNow, serverStart, dbConnect, useDateFormat }

let timeProcessCount = 0;
let requestCount = 0;
const ip = require('ip');
const _ = require('lodash');
const requestIp = require('request-ip');
const fs = require('fs');
const request = require('request');
const config_api = require('./config/api.json');
<<<<<<< HEAD
const { db, io, app } = require('./web');
=======
const { db } = require('./web');
>>>>>>> 9c216677dd983682f452bc6d212fb5d9e8df3330
const {
  apiErrorCodeList,
  sidoNameList,
  nowWeatherCategoryList,
  shortWeatherCategoryList,
  shortWeatherGetTimeList,
  nowDustCategoryList,
} = require('./public/static.json');

// 현재 날씨 상태 날짜 & 시간 셋팅
function getNowWeatherTimeSet (lastDataRequest) {
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

// 단기 날씨 상태 날짜 & 시간 셋팅
function getShortWeatherTimeSet (lastDataRequest) {
  let dateTime = useNow({ hour: 0, format: false });
  let [date, time] = dateTime.split(' ');
  time = time.slice(0, 2) + '00';

  let isGetMinutes = shortWeatherGetTimeList.indexOf(time);
  if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
    dateTime = useNow({ hour: lastDataRequest ? -3 : 0, format: false });
    [date, time] = dateTime.split(' ');
    time = time.slice(0, 2) + '00';
  } else {  // 현재 시간이 요청 시간이 아닐때
    let date = new Date();
    date.setHours(0);date.setMinutes(0);date.setSeconds(0);
    
    let getTimeList = [...shortWeatherGetTimeList];
    getTimeList.push(time);
    getTimeList = getTimeList.sort((x, y) => x - y);
    let getTimeIdx = getTimeList.indexOf(time);

    if (getTimeIdx === 0) {
      time = getTimeList[getTimeList.length - 1];
      date.setHours(date.getHours() - 1);
    } else {
      time = getTimeList[getTimeIdx - 1];
    }
    date = useDateFormat(date).split(' ')[0].replaceAll('-', '');
  }
  

  db.query(`
    SELECT DISTINCT b.NX, b.NY FROM 
    hardware_list AS a LEFT JOIN location_list AS b 
    ON a.LOCATION_ID = b.ID
  `, (err, result) => {
    if (err) return log('위치 정보 조회 요청에 실패하였습니다.', err);
    result.forEach(loc => getShortWeather({ time, date, loc }));
  });
}

// 단기 날씨 정보 요청 (기상청 API)
function getShortWeather ({ time, date, loc }) {

  let query = useQueryString({
    ServiceKey: config_api.nowWeatherKey,
    pageNo: 1,
    numOfRows: 10000,
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
  
  request(`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?${query}`,
    (err, result) => {
      if (err) return log('단기예보조회 데이터 요청에 실패하였습니다. (날짜: ' + date + ', 시간: ' + time + ')', err);
      log('단기예보조회 데이터 요청에 성공하였습니다. (날짜: ' + date + ', 시간: ' + time + ')');
      
      if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');

      let data = JSON.parse(result?.body)?.response?.body?.items?.item;
      newShortWeather({ data, loc, date, time });
    }
  );
}

// 단기 날씨 정보 가공
function newShortWeather ({ data, loc, time, date }) {
  // return console.log(data.filter(x => x.fcstTime === '1500').length);
  let resultArr = [];
  let dateArray = useCleanArray(data, 'fcstDate').map(item => item.fcstDate);
  let timeArray = useCleanArray(data, 'fcstTime').map(item => item.fcstTime);
  let cateArray = useCleanArray(data, 'category').map(item => item.category);

  // Sort
  dateArray.sort((x, y) => Number(x) - Number(y));
  timeArray.sort((x, y) => Number(x) - Number(y));

  dateArray.forEach(_date => {
    timeArray.forEach(_time => {
      let obj = { NX: loc.NX, NY: loc.NY, TIME: '\'' + _time + '\'', DATE: '\'' + _date + '\'' };
      cateArray.forEach(cate => {
        let find = data.find(x => x.fcstDate === _date && x.fcstTime === _time && x.category === cate)?.fcstValue;
        obj[cate] = find ? '\'' + find + '\'' : 'null';
      });
      
      let find = resultArr.filter(x => x.NX === obj.NX && x.NY === obj.NY && x.TIME === obj.TIME && x.DATE === obj.DATE)?.length;
      let nullish = obj.TMP === 'null' && obj.UUU === 'null' && obj.VVV === 'null' && obj.VEC === 'null' && obj.WSD === 'null' && obj.SKY === 'null' && obj.PTY === 'null' && 
                    obj.POP === 'null' && obj.WAV === 'null' && obj.PCP === 'null' && obj.REH === 'null' && obj.SNO === 'null' && obj.TMN === 'null' && obj.TMX === 'null';
      if (find === 0 && !nullish) resultArr.push(obj);
    });
  });
  
  let insertSQL = [];
  let updateSQL = shortWeatherCategoryList.map(item => item + '=VALUES(' + item + ')');

  resultArr.forEach(item => {
    let itemInsertVal = [loc.NX, loc.NY, item.TIME, item.DATE];
    shortWeatherCategoryList.forEach(_item => {
      itemInsertVal.push(item[_item]);
    });

    insertSQL.push(`(${itemInsertVal.join(',')},'${time}','${date}')`);
  });
  
  db.query(`
    INSERT INTO short_weather
    (NX,NY,TIME,DATE,${shortWeatherCategoryList.join(',')},BASE_TM,BASE_DT)
    VALUES
    ${insertSQL.join(',')}
    ON DUPLICATE KEY UPDATE
    ${updateSQL.join(',')},BASE_TM=VALUES(BASE_TM),BASE_DT=VALUES(BASE_DT)
  `, (err, result) => {
    if (err) return log('단기예보 데이터 수정 요청을 실패하였습니다.', err);
    log(
      '단기예보: 새로운 데이터 조회 (NX=' + loc.NX + ', NY=' + loc.NY + ')',
      '단기예보: 새로운 데이터 조회 (NX=' + loc.NX + ', NY=' + loc.NY + ')'
    );
  });
}

// 일정 시간마다 실행할 함수들
function getFunctions (minutes, isAuto) {
  if (isAuto) {
    (minutes == config_api.nowWeatherGetMinutes) && getNowWeatherTimeSet(minutes < config_api.nowWeatherGetMinutes);
    (minutes == config_api.shortWeatherGetMinutes) && getShortWeatherTimeSet(minutes < config_api.shortWeatherGetMinutes);
  } else {
    getNowWeatherTimeSet(minutes < config_api.nowWeatherGetMinutes);
    getShortWeatherTimeSet(minutes < config_api.shortWeatherGetMinutes);
  }
}

// Time Process
function timeProcess () {
  let minutes = new Date().getMinutes();
  getFunctions(minutes, false);

  setInterval(() => {
    let minutes = new Date().getMinutes();
    getFunctions(minutes, true);
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
  if (err) return log('데이터베이스 연결에 실패하였습니다.');
  log('데이터베이스 연결 성공');
  console.log(useNow() + ' : 서버 & DB 연결');
}

// log.txt에 log 저장
function log (logText = '', error) {
  db.query(`
    INSERT INTO log (DESCRIPTION,IP) VALUES ('${logText}','${ip.address()}');
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

// 날짜 & 시간 Format
function useDateFormat (date) {
  if (!date) return null;
  let Y = String(date.getFullYear());
  let M = String((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1));
  let D = String(date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
  let h = String(date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
  let m = String(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  let s = String(date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

  let result = Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
  return result;
}

// 배열 중복 제거 함수
function useCleanArray (allArr = [], fieldName, returnKey = []) {
  if (allArr.length === 0) return console.warn('배열 allArr가 비어있습니다.');
  if (!fieldName) return console.warn('Key값이 없습니다.');
  if (!Array.isArray(returnKey)) return console.warn('Return Key값이 배열이 아닙니다.');
  let result = _.uniqBy(allArr, fieldName);
  let returnValue = [...result];
  
  if (returnKey.length > 0) {
    returnValue = result.map(item => {
      let data = {};
      returnKey.forEach(key => data[key] = item[key]);
      return data;
    })
  }
  return returnValue;
}