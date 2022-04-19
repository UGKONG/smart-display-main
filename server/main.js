const { useNow, log } = require('./hook');
const intervalTime = require('./config.json').api.get;
const conf = require('./config.json').api.subject;
const nowWeather = require('./data/nowWeather');
const shortWeather = require('./data/shortWeather');
const longWeather1 = require('./data/longWeather1');
const longWeather2 = require('./data/longWeather2');
const nowDust = require('./data/nowDust');
const weatherText = require('./data/weatherText');
const shortDust = require('./data/shortDust');
const longDetailDust = require('./data/longDetailDust');

// 일정 시간마다 실행할 함수들
function getFunctions (now, isAuto) {
  if (isAuto) {
    (now == conf.nowWeather.get) && nowWeather.getNowWeatherSet(now < conf.nowWeather.get);
    (now == conf.shortWeather.get) && shortWeather.getShortWeatherSet(now < conf.shortWeather.get);
    (now == conf.longWeather1.get) && longWeather1.getLongWeatherSet(now < conf.longWeather1.get);
    (now == conf.longWeather2.get) && longWeather2.getLongWeatherSet(now < conf.longWeather2.get);
    (now == conf.nowDust.get) && nowDust.getNowDustSet();
    (now == conf.weatherText.get) && weatherText.getWeatherText();
    (now == conf.shortDust.get) && shortDust.getShortDustSet(now < conf.shortDust.get);
    (now == conf.longDetailDust.get) && longDetailDust.getLongDetailDustSet(now < conf.longDetailDust.get);
  } else {
    nowWeather.getNowWeatherSet(now < conf.nowWeather.get);
    shortWeather.getShortWeatherSet(now < conf.shortWeather.get);
    longWeather1.getLongWeatherSet(now < conf.longWeather1.get);
    longWeather2.getLongWeatherSet(now < conf.longWeather2.get);
    nowDust.getNowDustSet();
    weatherText.getWeatherText();
    shortDust.getShortDustSet(now < conf.shortDust.get);
    longDetailDust.getLongDetailDustSet(now < conf.longDetailDust.get);
  }
}

// Time Process
function timeProcess () {
  let now = new Date().getMinutes();
  getFunctions(now, false);

  setInterval(() => {
    let now = new Date().getMinutes();
    getFunctions(now, true);
  }, intervalTime);
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