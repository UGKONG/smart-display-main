const ip = require('ip');
const _ = require('lodash');
const apiErrorCodeList = require('./config.json').api.errorCodeList;

// Object -> Query (String) 변환 함수
module.exports.useQueryString = (obj) => {
  let strArr = [];
  let keys = Object.keys(obj);
  keys.forEach(key => strArr.push(key + '=' + obj[key]));
  let result = strArr.join('&');
  return result;
}

// 현재 날짜 & 시간 출력 함수
module.exports.useNow = (option = { hour: 0, format: true }) => {
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
module.exports.useDateFormat = (date, option = false) => {
  if (!date) return null;
  let Y = String(date.getFullYear());
  let M = String((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1));
  let D = String(date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
  let h = String(date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
  let m = String(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  let s = String(date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

  let result = Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
  if (option) result = Y + '-' + M + '-' + D;
  return result;
}

// 배열 중복 제거 함수
module.exports.useCleanArray = (allArr = [], fieldName, returnKey = []) => {
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

// log.txt에 log 저장
module.exports.log = (logText = '', error) => {
  db.query(`
    INSERT INTO log (DESCRIPTION,IP) VALUES ('${logText}','${ip.address()}');
  `, (err, result) => {
    err && console.log('log 저장에 실패하였습니다.');
    error && console.log(error);
  });
}

// API 에러 코드 함수
module.exports.apiError = (code) => {
  let find = apiErrorCodeList.find(x => Number(x.id) === Number(code));
  this.log(
    '공공데이터 포털 API 에러 (에러코드: ' + code + ', 메시지: ' + find.msg + ', 설명: ' + find.desc + ')',
    { code, msg: find.msg, description: find.desc }
  );
}

// 클라이언트로 전송 실패 양식
module.exports.fail = (msg = 'fail') => (
  { result: false, msg }
)