// 클라이언트
const requestIp = require('request-ip');
const { db } = require('../web');
const { log, fail, useDateFormat } = require('./hook');

// 장비 리스트 조회
module.exports.getDevice = (req, res) => {
  db.query(`
    SELECT 
    a.ID, a.NAME, DATE_FORMAT(a.CREATE_DATE, '%Y-%m-%d %H:%i:%S') AS CREATE_DATE, a.IP_ADDRESS, a.AGENT, a.DESCRIPTION, a.LOCATION_ID, a.STATION_ID,
    b.PATH1, b.PATH2, b.PATH3,
    c.STATION_NAME,
    d.ID AS AREA_ID, d.AREA, d.CITY
    FROM hardware_list AS a 
    LEFT JOIN location_list AS b
    ON a.LOCATION_ID = b.ID 
    LEFT JOIN station_list AS c
    ON a.STATION_ID = c.ID
    LEFT JOIN area_list AS d
    ON a.AREA_ID = d.ID;
  `, (err, result) => {
    if (err) {
      res.send([]);
      log('장비 조회에 실패하였습니다.', '장비 조회 실패');
      return;
    }
    res.send(result);
  })
}

// 장비 등록
module.exports.addDevice = (req, res) => {
  let query = req.query;
  let nameValue = query.nameValue;
  let locationValue = query.locationValue;
  let stationValue = query.stationValue;
  let areaValue = query.areaValue;
  let agentValue = query.agentValue;
  let memoValue = query.memoValue;
  let ip = requestIp.getClientIp(req);

  db.query(`
    INSERT INTO hardware_list
    (LOCATION_ID,NAME,IP_ADDRESS,AGENT,DESCRIPTION,STATION_ID,AREA_ID)
    VALUES
    ('${locationValue}','${nameValue}','${ip}','${agentValue}','${memoValue}','${stationValue}','${areaValue}')
  `, (err, result) => {
    if (err) {
      res.send(false);
      log('장비 등록에 실패하였습니다.', '장비 등록 실패');
      return;
    }
    log('장비 등록에 성공하였습니다.', '장비 등록 성공');
    res.send(true);
  });
}

// 장비 수정
module.exports.modifyDevice = (req, res) => {
  let id = req.params.id;
  let query = req.query;
  let nameValue = query.nameValue;
  let locationValue = query.locationValue;
  let stationValue = query.stationValue;
  let areaValue = query.areaValue;
  let agentValue = query.agentValue;
  let memoValue = query.memoValue;
  let ip = requestIp.getClientIp(req);

  db.query(`
    UPDATE hardware_list SET
    LOCATION_ID = '${locationValue}',
    NAME = '${nameValue}',
    IP_ADDRESS = '${ip}',
    AGENT = '${agentValue}',
    DESCRIPTION = '${memoValue}',
    STATION_ID = '${stationValue}',
    AREA_ID = '${areaValue}'
    WHERE ID = ${id};
  `, (err, result) => {
    if (err) {
      res.send(false);
      log('장비 수정에 실패하였습니다.', '장비 수정 실패');
      return;
    }
    log('장비 수정에 성공하였습니다.', '장비 수정 성공');
    res.send(true);
  });
}

// 장비 삭제
module.exports.delDevice = (req, res) => {
  db.query(`
    DELETE FROM hardware_list WHERE ID = ${req.params.id};
  `, (err, result) => {
    if (err) {
      res.send(false);
      log('장비 삭제에 실패하였습니다.', '장비 삭제 실패');
      return;
    }
    res.send(true);
  })
}

// 위치 리스트 조회 (검색)
module.exports.getLocation = (req, res) => {
  db.query(`
    SELECT * FROM location_list WHERE PATH1 LIKE '%${req.params.path}%' OR PATH2 LIKE '%${req.params.path}%' OR PATH3 LIKE '%${req.params.path}%';
  `, (err, result) => {
    if (err) log('위치 조회에 실패하였습니다.', '위치 조회 실패');
    res.send(result);
  });
}

// 측정소 리스트 조회 (검색)
module.exports.getStation = (req, res) => {
  db.query(`
    SELECT * FROM station_list WHERE 
    SIDO_NAME LIKE '%${req.params.path}%' ORDER BY STATION_NAME ASC;
  `, (err, result) => {
    if (err) log('측정소 조회에 실패하였습니다.', '측정소 조회 실패');
    res.send(result);
  });
}

// 지역코드 리스트 조회 (검색)
module.exports.getArea = (req, res) => {
  db.query(`
    SELECT * FROM area_list WHERE 
    AREA LIKE '%${req.params.path}%' ORDER BY CITY ASC;
  `, (err, result) => {
    if (err) log('측정소 조회에 실패하였습니다.', '측정소 조회 실패');
    res.send(result);
  });
}

// 404 페이지를 찾을 수 없습니다.
module.exports.pageNotFound = (req, res) => {
  res.send(fail('Page Not Found'));
}

// DB 연결상태 확인
module.exports.isConnect = (req, res) => {
  let getInfo = {};
  getInfo.infoList = [];
  
  const DT_FORMAT = (result = []) => {
    let date;
    let { DATE_TIME, CHECK_DT } = result[0];
    return RESULT_TXT({ DATE_TIME, CHECK_DT });
  }

  const RESULT_TXT = ({ DATE_TIME, CHECK_DT }) => {
    return `마지막 데이터: ${DATE_TIME} | 업데이트 시간: ${CHECK_DT}`;
    
  }

  db.query(`
    SELECT DATE_TIME,CHECK_DT FROM now_weather ORDER BY ID DESC LIMIT 1;
  `, (err, result) => {
    let DT = err ? '-' : DT_FORMAT(result);
    getInfo.ip = requestIp.getClientIp(req);
    getInfo.result = err ? false : true;
    getInfo.infoList.push({ name: 'nowWeather', value: err ? '-' : DT });

    db.query(`
      SELECT DATE_TIME,CHECK_DT FROM short_weather ORDER BY ID DESC LIMIT 1;
    `, (err, result) => {
      DT = err ? '-' : DT_FORMAT(result);
      getInfo.infoList.push({ name: 'shortWeather', value: err ? '-' : DT });

      db.query(`
        SELECT DATE_TIME,CHECK_DT FROM now_dust ORDER BY ID DESC LIMIT 1;
      `, (err, result) => {
        DT = err ? '-' : DT_FORMAT(result);
        getInfo.infoList.push({ name: 'nowDust', value: err ? '-' : DT });
        
        db.query(`
          SELECT DATE_TIME,CHECK_DT FROM short_dust ORDER BY ID DESC LIMIT 1;
        `, (err, result) => {
          DT = err ? '-' : DT_FORMAT(result);
          getInfo.infoList.push({ name: 'shortDust', value: err ? '-' : DT });
          
          db.query(`
            SELECT DATE_TIME,CHECK_DT FROM long_weather ORDER BY ID DESC LIMIT 1;
          `, (err, result) => {
            DT = err ? '-' : DT_FORMAT(result);
            getInfo.infoList.push({ name: 'longWeather', value: err ? '-' : DT });
          
            db.query(`
              SELECT DATE_TIME,CHECK_DT FROM long_detail_dust ORDER BY ID DESC LIMIT 1;
            `, (err, result) => {
              DT = err ? '-' : DT_FORMAT(result);
              getInfo.infoList.push({ name: 'longDetailDust', value: err ? '-' : DT });
            
              db.query(`
                SELECT DATE_TIME,CHECK_DT FROM weather_text ORDER BY ID DESC LIMIT 1;
              `, (err, result) => {
                DT = err ? '-' : DT_FORMAT(result);
                getInfo.infoList.push({ name: 'weatherText', value: err ? '-' : DT });

                err && console.log(err);
                res.send(getInfo);
              })
            });
          });

        });

      });
    });
  });
}

// log View 페이지
module.exports.getLog = (req, res) => {
  db.query(`
    SELECT
    a.ID, a.IP, a.DESCRIPTION, DATE_FORMAT(a.DATE_TIME, '%Y-%m-%d %H:%i:%S') AS DATE_TIME
    FROM log a ORDER BY ID DESC LIMIT 1000
  `, (err, result) => {
    if (err) return log('log 리스트 조회에 실패하였습니다.', err);
    res.send(result);
  });
}

// 스마트 가로등 클라이언트에서 요청
module.exports.getData = (req, res) => {
  let id = req.query?.id;

  if (!id) return res.send(fail('Hardware\'s id is not found'));

  let now = new Date();
  let _now = new Date();
  let data = {
    now: [],
    today: [],
    tomorrow: [],
    afterTomorrow: [],
    week: [],
    text: [],
  }

  // now 요청
  db.query(`
    SELECT
    c.ID, b.NX, b.NY,
    c.RN1, c.T1H, d.SKY, c.DATE_TIME AS WEATHER_DATE,
    f.pm10Value, f.pm25Value, f.o3Value, f.DATE_TIME AS DUST_DATE
    FROM hardware_list a
    LEFT JOIN location_list b ON a.LOCATION_ID = b.ID
    LEFT JOIN now_weather c ON b.NX = c.NX AND b.NY = c.NY
    LEFT JOIN short_weather d ON c.DATE_TIME = d.DATE_TIME
    LEFT JOIN station_list e ON a.STATION_ID = e.ID
    LEFT JOIN now_dust f ON e.STATION_NAME = f.STATION
    WHERE a.ID = ${id}
    ORDER BY c.DATE_TIME desc, f.DATE_TIME desc
    LIMIT 1
  `, (err, result) => {
    if (err) console.log(err);
    if (err || result.length === 0) return res.send(data);

    // 오늘
    data.now = result[0] ?? [];

    db.query(`
      SELECT
      sw.ID,
      sw.SKY, sw.TMP, sw.POP,
      sd.VALUE10, sd.VALUE25,
      CONVERT(sw.DATE_TIME, CHAR(10)) AS DATE
      FROM hardware_list hl
      LEFT JOIN location_list ll ON hl.LOCATION_ID = ll.ID
      LEFT JOIN short_weather sw ON ll.NX = sw.NX AND ll.NY = sw.NY
      LEFT JOIN area_list al ON hl.AREA_ID = al.ID
      LEFT JOIN station_list sl ON hl.STATION_ID = sl.ID
      LEFT JOIN short_dust sd ON sl.SIDO_NAME = sd.LOCATION
      WHERE hl.ID = '${id}' AND 
      CONVERT(sw.DATE_TIME, DATE) >= CONVERT(NOW(), DATE) AND
      CONVERT(sd.DATE_TIME, DATE) >= CONVERT(NOW(), DATE) AND
      CONVERT(sw.DATE_TIME, DATE) = CONVERT(sd.DATE_TIME, DATE)
      ORDER BY sw.DATE_TIME ASC
    `, (err, result) => {
      if (err) console.log(err);
      if (err || result.length === 0) return res.send(data);
      
      // 오늘
      data.today = result?.filter(x => x.DATE === useDateFormat(now, true)) ?? null;
      
      // 내일
      now.setDate(now.getDate() + 1);
      data.tomorrow = result?.filter(x => x.DATE === useDateFormat(now, true)) ?? null;
      
      _now.setDate(_now.getDate() + 2);
      let afterTomorrowDate = useDateFormat(_now, true);

      // 중기
      db.query(`
        SELECT
        lw.ID,
        lw.MIN, lw.MAX,
        CONVERT(lw.DATE_TIME, CHAR(10)) AS DATE
        FROM hardware_list hl
        LEFT JOIN area_list al ON hl.AREA_ID = al.ID
        LEFT JOIN long_weather lw ON al.CODE = lw.AREA_CODE AND 
        lw.DATE_TIME >= '${afterTomorrowDate} 00:00:00'
      `, (err, result) => {
        if (err) console.log(err);
        if (err || result.length === 0) return res.send(data);

        // 중기
        data.week = result;

        res.send(data);
      })

    });
  });
}