const { useNow, log } = require('./hook');
const config_api = require('./json/api.json');
const { nowWeather } = require('./data/nowWeather');
const { shortWeather } = require('./data/shortWeather');
const { nowDust } = require('./data/nowDust');

// 일정 시간마다 실행할 함수들
function getFunctions (minutes, isAuto) {
  if (isAuto) {
    (minutes == config_api.nowWeatherGetMinutes) && nowWeather.getNowWeatherSet(minutes < config_api.nowWeatherGetMinutes);
    (minutes == config_api.shortWeatherGetMinutes) && shortWeather.getShortWeatherSet(minutes < config_api.shortWeatherGetMinutes);
    (minutes == config_api.nowDustGetMinutes) && nowDust.getNowDustSet();
  } else {
    nowWeather.getNowWeatherSet(minutes < config_api.nowWeatherGetMinutes);
    shortWeather.getShortWeatherSet(minutes < config_api.shortWeatherGetMinutes);
    nowDust.getNowDustSet();
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
module.exports.serverStart = () => {
  console.clear();
  log('Nodejs 서버 연결 성공');
  timeProcess();
}

// Database 연결 함수
module.exports.dbConnect = (err) => {
  if (err) return log('데이터베이스 연결에 실패하였습니다.', '데이터베이스 연결에 실패하였습니다.');
  log('데이터베이스 연결 성공');
  console.log(useNow() + ' : 서버 & DB 연결');
}