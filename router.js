// 필요 모듈
const { app } = require('./web');
const { dbIsConnect, pageNotFound, logView } = require('./client');
const { getShortWeatherTimeSet } = require('./main');
// 테스트용 라우터
app.get('/', dbIsConnect);
app.get('/log', logView);

// app.get('/api/init/:dong', _init);
// app.get('/api/remove/:dong', _remove);
// app.get('/api/nowWeather/:x/:y', _getNowWeather);
// app.get('/api/hardware', getHardwareList);
// console.log(app);

// 기타
app.get('*', pageNotFound);