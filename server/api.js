// 클라이언트
const requestIp = require('request-ip');
const { db } = require('../web');
const { useDateFormat } = require('./hook');
const { log } = require('./hook');

// 장비 리스트 조회
module.exports.getDevice = (req, res) => {
  db.query(`
    SELECT 
    a.ID, a.NAME, DATE_FORMAT(a.CREATE_DATE, '%Y-%m-%d %H:%i:%S') AS CREATE_DATE, a.IP_ADDRESS, a.AGENT, a.DESCRIPTION, a.LOCATION_ID, a.STATION_ID,
    b.PATH1, b.PATH2, b.PATH3,
    c.STATION_NAME,
    d.ID AS AREA_CODE_ID, d.AREA, d.CITY
    FROM hardware_list AS a 
    LEFT JOIN location_list AS b
    ON a.LOCATION_ID = b.ID 
    LEFT JOIN station_list AS c
    ON a.STATION_ID = c.ID
    LEFT JOIN location_code_list AS d
    ON a.AREA_CODE_ID = d.ID;
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
    (LOCATION_ID,NAME,IP_ADDRESS,AGENT,DESCRIPTION,STATION_ID,AREA_CODE_ID)
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
    AREA_CODE_ID = '${areaValue}'
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
    SELECT * FROM location_code_list WHERE 
    AREA LIKE '%${req.params.path}%' ORDER BY CITY ASC;
  `, (err, result) => {
    if (err) log('측정소 조회에 실패하였습니다.', '측정소 조회 실패');
    res.send(result);
  });
}

// 404 페이지를 찾을 수 없습니다.
module.exports.pageNotFound = (req, res) => {
  res.send('Page Not Found');
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
              SELECT DATE_TIME,CHECK_DT FROM long_dust ORDER BY ID DESC LIMIT 1;
            `, (err, result) => {
              DT = err ? '-' : DT_FORMAT(result);
              getInfo.infoList.push({ name: 'longDetailDust', value: DT });
            
              err && console.log(err);
              res.send(getInfo);
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