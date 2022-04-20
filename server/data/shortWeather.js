const request = require('request');
const conf = require('../config.json').api.subject.shortWeather;
const { useNow, useQueryString, useDateFormat, log, apiError, useCleanArray } = require('../hook');

module.exports = {
  getShortWeatherSet (lastDataRequest) {
    let dateTime = useNow({ hour: 0, format: false });
    let [date, time] = dateTime.split(' ');
    time = time.slice(0, 2) + '00';

    let isGetMinutes = conf.time.indexOf(time);
    if (isGetMinutes > -1) {  // 현재 시간이 요청 시간일때
      dateTime = useNow({ hour: lastDataRequest ? -3 : 0, format: false });
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
      let [y, m, d] = dateFormat.split('-');

      date = y + m + d;
    }
    
    db.query(`
      SELECT DISTINCT b.NX, b.NY FROM 
      hardware_list AS a LEFT JOIN location_list AS b 
      ON a.LOCATION_ID = b.ID
    `, (err, result) => {
      if (err) return log('위치 정보 조회 요청에 실패하였습니다.', err);
      result.forEach(loc => this.getShortWeather({ time, date, loc }));
    });

  },
  getShortWeather ({ time, date, loc }) {

    let query = useQueryString({
      ServiceKey: conf.apiKey,
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
        
        if (!validation(result)) return console.log('데이터를 가져오지 못했습니다. (shortWeather)');

        let data = JSON.parse(result?.body)?.response?.body?.items?.item;
        this.newShortWeather({ data, loc, date, time });
      }
    );
  },
  newShortWeather ({ data, loc, time, date }) {
    let resultArr = [];
    let dateArray = useCleanArray(data, 'fcstDate').map(item => item.fcstDate);
    let timeArray = useCleanArray(data, 'fcstTime').map(item => item.fcstTime);
    let cateArray = useCleanArray(data, 'category').map(item => item.category);

    // Sort
    dateArray.sort((x, y) => Number(x) - Number(y));
    timeArray.sort((x, y) => Number(x) - Number(y));

    dateArray.forEach(_date => {
      timeArray.forEach(_time => {
        let obj = { NX: loc.NX, NY: loc.NY, TIME: _time, DATE: _date + '\'' };
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
    let updateSQL = conf.category.map(item => item + '=VALUES(' + item + ')');

    resultArr.forEach(item => {
      let dateTime = '\'' + 
        ([item.DATE.slice(0, 4), '-', item.DATE.slice(4, 6), '-', item.DATE.slice(6, 8)]).join('') + ' ' +
        ([item.TIME.slice(0, 2), ':', item.TIME.slice(2, 4), ':', '00']).join('') + '\'';
      let itemInsertVal = [loc.NX, loc.NY, dateTime];
      
      conf.category.forEach(_item => {
        itemInsertVal.push(item[_item]);
      });


      insertSQL.push(`(${itemInsertVal.join(',')},'${time}','${date}','${useNow()}')`);
    });

    db.query(`
      INSERT INTO short_weather
      (NX,NY,DATE_TIME,${conf.category.join(',')},BASE_TM,BASE_DT,CHECK_DT)
      VALUES
      ${insertSQL.join(',')}
      ON DUPLICATE KEY UPDATE
      ${updateSQL.join(',')},BASE_TM=VALUES(BASE_TM),BASE_DT=VALUES(BASE_DT),CHECK_DT=VALUES(CHECK_DT)
    `, (err, result) => {
      if (err) return log(`단기예보 데이터 조회 실패`, err);
      log(
        `단기예보: 새로운 데이터 조회`,
        `단기예보: 새로운 데이터 조회`
      );
    });
  }
}