const request = require('request');
const config_api = require('../json/api.json');
const { useQueryString, log, apiError, useNow } = require('../hook');
const { nowDustCategoryList } = require('../json/static.json');

module.exports = {
  getNowDustSet () {
    db.query(`
      SELECT DISTINCT b.STATION_NAME
      FROM hardware_list a LEFT JOIN station_list b
      ON a.STATION_ID = b.ID
    `, (err, result) => {
      if (err) return console.log('위치 정보 조회 요청에 실패하였습니다.', err);

      result.forEach(loc => this.getNowDust({ loc }));
    });
  },
  getNowDust ({ loc }) {

    let query = useQueryString({
      ServiceKey: config_api.apiKey,
      pageNo: 1,
      numOfRows: 10000,
      returnType: 'json',
      dataTerm: 'DAILY',
      ver: '1.0',
      stationName: encodeURI(loc?.STATION_NAME ?? '서울'),
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

    request(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?${query}`,
      (err, result) => {
        if (err) return log('현재 미세먼지 데이터 요청에 실패하였습니다. (측정소: ' + loc.STATION_NAME + ')', err);
        // log('현재 미세먼지 데이터 요청에 성공하였습니다. (측정소: ' + loc.STATION_NAME + ')');
        
        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다.');

        let data = JSON.parse(result?.body)?.response?.body?.items;
        if (data) data = data[0] ?? null;
        this.newNowDust({ data, loc });
      }
    );
  },
  newNowDust ({ data, loc }) {
    let insertSQL = [];
    let updateSQL = [];

    let [date, time] = data.dataTime.split(' ');
    date = date.replace(/-/g, '');
    time = time.replace(/:/g, '');

    nowDustCategoryList.forEach(item => {
      let find = data[item] ?? 'null';
      insertSQL.push('\'' + find + '\'');
      updateSQL.push(item + '=VALUES(' + item + ') ');
    });

    db.query(`
      INSERT INTO now_dust
      (STATION,BASE_TM,BASE_DT,DATE_TIME,${nowDustCategoryList.join(',')},CHECK_DT)
      VALUES
      ('${loc?.STATION_NAME}','${time}','${date}','${data.dataTime}:00',${insertSQL.join(',')},'${useNow()}')
      ON DUPLICATE KEY UPDATE
      ${updateSQL.join(',')},BASE_TM=VALUES(BASE_TM),BASE_DT=VALUES(BASE_DT),CHECK_DT=VALUES(CHECK_DT)
    `, (err, result) => {
      if (err) return log('현재 미세먼지 데이터 수정 요청을 실패하였습니다.', err);
      log(
        '현재 미세먼지: 새로운 데이터 조회 (측정소=' + String(loc.STATION_NAME) + ')',
        '현재 미세먼지: 새로운 데이터 조회 (측정소=' + String(loc.STATION_NAME) + ')'
      );
    });
  }
}