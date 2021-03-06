// 클라이언트 // mac
const { address } = require('ip');
const { getClientIp } = require('request-ip');
const { log, fail, useDateFormat, dbConnect } = require('./hook');
const fs = require('fs');
const mime = require('mime');


// 리소스 파일 다운로드
module.exports.getResourceFiles = (req, res) => {
  const filePath = '/web/resource/build.zip';
  const fileType = mime.getType(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.send(null);
    res.set({ 'Content-Type': fileType }).send(data);
  });
}
// 설정 정보 조회
module.exports.getSetting = (req, res) => {
  dbConnect(db => {
    db.query(`
      SELECT * FROM setting;
    `, (err, result) => {
      db.end();
      if (err) {
        console.log(err);
        return res.send(fail('설정 정보 조회를 실패하였습니다.'));
      }
      res.send(result);
    })
  })
}
// 설정 정보 조회
module.exports.getSettingDetail = (req, res) => {
  const id = req?.params?.id;

  dbConnect(db => {
    db.query(`
      SELECT * FROM setting WHERE GROUP_ID = '${id}';
    `, (err, result) => {
      db.end();
      if (err) {
        console.log(err);
        return res.send(fail('설정 정보 조회를 실패하였습니다.'));
      }
      if (result?.length === 0) return res.send(fail('설정 정보가 없습니다.'));
      res.send(result[0]);
    })
  })
}
// 업데이트 정보 조회
module.exports.getUpdateInfo = (req, res) => {
  const id = req?.params?.id;

  dbConnect(db => {
    db.query(`
      SELECT VERSION, 
      DATE_FORMAT(UPDATE_DT, '%Y-%m-%d %H:%i:%s') AS DATE
      FROM resource_update ORDER BY ID DESC LIMIT 1;

      SELECT VERSION FROM hardware_list WHERE ID = '${id}';
    `, (err, result) => {
      db.end();
      if (err) {
        console.log(err);
        return res.send(fail('업데이트 정보 조회를 실패하였습니다.'));
      }
      
      let [admin, hardware] = result;
      if (!admin[0]) return res.send(fail('업데이트 정보가 없습니다.'));
      if (!hardware[0]) return res.send(fail('장비 정보가 없습니다.'));
      admin = admin[0];
      hardware = hardware[0];
      res.send({ admin, hardware });
    })
  })
}
// 장비 업데이트 정보 갱신
module.exports.putHardwareUpdate = (req, res) => {
  const { id, version, isSuccess } = req?.params;
  if (isSuccess == 0) return res.send(fail('업데이트를 실패하였습니다.'));

  dbConnect(db => {
    db.query(`
      UPDATE hardware_list SET VERSION = ${version} WHERE ID = ${id};
    `, (err, result) => {
      db.end();
      if (err) {
        console.log(err);
        return res.send(fail('업데이트를 실패하였습니다.'));
      }
      res.send(true);
    })
  })
}
// 장비 리스트 조회
module.exports.getDevice = (req, res) => {
  dbConnect(db => {
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
      db.end();
      if (err) {
        res.send([]);
        log('장비 조회에 실패하였습니다.', '장비 조회 실패');
        return;
      }
      res.send(result);
    });
  })
}

// 장비 등록
module.exports.addDevice = (req, res) => {
  dbConnect(db => {
    let query = req.query;
    let nameValue = query.nameValue;
    let locationValue = query.locationValue;
    let stationValue = query.stationValue;
    let areaValue = query.areaValue;
    let agentValue = query.agentValue;
    let memoValue = query.memoValue;
    let ip = getClientIp(req);
  
    db.query(`
      INSERT INTO hardware_list
      (LOCATION_ID,NAME,IP_ADDRESS,AGENT,DESCRIPTION,STATION_ID,AREA_ID)
      VALUES
      ('${locationValue}','${nameValue}','${ip}','${agentValue}','${memoValue}','${stationValue}','${areaValue}')
    `, (err, result) => {
      db.end();
      if (err) {
        res.send(false);
        log('장비 등록에 실패하였습니다.', '장비 등록 실패');
        return;
      }
      log('장비 등록에 성공하였습니다.', '장비 등록 성공');
      res.send(true);
    });
  })
}

// 장비 수정
module.exports.modifyDevice = (req, res) => {
  dbConnect(db => {
    let id = req.params.id;
    let query = req.query;
    let nameValue = query.nameValue;
    let locationValue = query.locationValue;
    let stationValue = query.stationValue;
    let areaValue = query.areaValue;
    let agentValue = query.agentValue;
    let memoValue = query.memoValue;
    let ip = getClientIp(req);
  
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
      db.end();
      if (err) {
        res.send(false);
        log('장비 수정에 실패하였습니다.', '장비 수정 실패');
        return;
      }
      log('장비 수정에 성공하였습니다.', '장비 수정 성공');
      res.send(true);
    });
  })
}

// 장비 삭제
module.exports.delDevice = (req, res) => {
  dbConnect(db => {
    db.query(`
      DELETE FROM hardware_list WHERE ID = ${req.params.id};
    `, (err, result) => {
      db.end();
      if (err) {
        res.send(false);
        log('장비 삭제에 실패하였습니다.', '장비 삭제 실패');
        return;
      }
      res.send(true);
    })
  })
}

// 위치 리스트 조회 (검색)
module.exports.getLocation = (req, res) => {
  dbConnect(db => {
    db.query(`
      SELECT * FROM location_list WHERE PATH1 LIKE '%${req.params.path}%' OR PATH2 LIKE '%${req.params.path}%' OR PATH3 LIKE '%${req.params.path}%';
    `, (err, result) => {
      db.end();
      if (err) log('위치 조회에 실패하였습니다.', '위치 조회 실패');
      res.send(result);
    });
  })
}

// 측정소 리스트 조회 (검색)
module.exports.getStation = (req, res) => {
  dbConnect(db => {
    db.query(`
      SELECT * FROM station_list WHERE 
      SIDO_NAME LIKE '%${req.params.path}%' ORDER BY STATION_NAME ASC;
    `, (err, result) => {
      db.end();
      if (err) log('측정소 조회에 실패하였습니다.', '측정소 조회 실패');
      res.send(result);
    });
  })
}

// 지역코드 리스트 조회 (검색)
module.exports.getArea = (req, res) => {
  dbConnect(db => {
    db.query(`
      SELECT * FROM area_list WHERE 
      AREA LIKE '%${req.params.path}%' ORDER BY CITY ASC;
    `, (err, result) => {
      db.end();
      if (err) log('측정소 조회에 실패하였습니다.', '측정소 조회 실패');
      res.send(result);
    });
  })
}

// 404 페이지를 찾을 수 없습니다.
module.exports.pageNotFound = (req, res) => {
  res.send(fail('페이지를 찾을 수 없습니다.'));
}

// DB 연결상태 확인
module.exports.isConnect = (req, res) => {
  let getInfo = {};
  getInfo.infoList = [];
  
  const DT_FORMAT = (resultData = []) => {
    let { DATE_TIME, CHECK_DT } = resultData[0];
    let result = `마지막 데이터: ${DATE_TIME} | 업데이트 시간: ${CHECK_DT}`;
    return result;
  }

  dbConnect(db => {
    db.query(`
      SELECT DATE_TIME,CHECK_DT FROM now_weather ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
    `, (err, result) => {
      let DT = err ? '-' : DT_FORMAT(result);
      getInfo.ip = getClientIp(req);
      getInfo.result = err ? false : true;
      getInfo.infoList.push({ name: 'nowWeather', value: err ? '-' : DT });
  
      db.query(`
        SELECT DATE_TIME,CHECK_DT FROM short_weather ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
      `, (err, result) => {
        DT = err ? '-' : DT_FORMAT(result);
        getInfo.infoList.push({ name: 'shortWeather', value: err ? '-' : DT });
  
        db.query(`
          SELECT DATE_TIME,CHECK_DT FROM now_dust ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
        `, (err, result) => {
          DT = err ? '-' : DT_FORMAT(result);
          getInfo.infoList.push({ name: 'nowDust', value: err ? '-' : DT });
          
          db.query(`
            SELECT DATE_TIME,CHECK_DT FROM short_dust ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
          `, (err, result) => {
            DT = err ? '-' : DT_FORMAT(result);
            getInfo.infoList.push({ name: 'shortDust', value: err ? '-' : DT });
            
            db.query(`
              SELECT DATE_TIME,CHECK_DT FROM long_weather1 ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
            `, (err, result) => {
              DT = err ? '-' : DT_FORMAT(result);
              getInfo.infoList.push({ name: 'longWeather1', value: err ? '-' : DT });
  
              db.query(`
                SELECT DATE_TIME,CHECK_DT FROM long_weather2 ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
              `, (err, result) => {
                DT = err ? '-' : DT_FORMAT(result);
                getInfo.infoList.push({ name: 'longWeather2', value: err ? '-' : DT });
              
                db.query(`
                  SELECT DATE_TIME,CHECK_DT FROM long_detail_dust ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
                `, (err, result) => {
                  DT = err ? '-' : DT_FORMAT(result);
                  getInfo.infoList.push({ name: 'longDetailDust', value: err ? '-' : DT });
                
                  db.query(`
                    SELECT DATE_TIME,CHECK_DT FROM weather_text ORDER BY CHECK_DT DESC, DATE_TIME DESC LIMIT 1;
                  `, (err, result) => {
                    DT = err ? '-' : DT_FORMAT(result);
                    getInfo.infoList.push({ name: 'weatherText', value: err ? '-' : DT });
  
                    err && console.log(err);
                    res.send(getInfo);
                    db.end();
                  })
                });
              });
            });
  
          });
  
        });
      });
    });
  })
}

// log View 페이지
module.exports.getLog = (req, res) => {
  dbConnect(db => {
    db.query(`
      SELECT
      a.ID, a.IP, a.DESCRIPTION, DATE_FORMAT(a.DATE_TIME, '%Y-%m-%d %H:%i:%S') AS DATE_TIME
      FROM log a ORDER BY ID DESC LIMIT 500
    `, (err, result) => {
      db.end();
      if (err) return log('log 리스트 조회에 실패하였습니다.', err);
      res.send(result);
    });
  })
}

// 스크린, 페이지 설정
module.exports.pageControl = (req, res) => {
  let id = req.query?.id;
  if (!id) return res.send(fail('장비 ID가 없습니다.'));

  dbConnect(db => {
    db.query(`
      SELECT * FROM page_control WHERE HARDWARE_ID = '${id}' ORDER BY ID ASC
    `, (err, result) => {
      db.end();
      if (err) {
        console.log(err);
        res.send([]);
        return;
      }
      res.send(result);
    });
  })
}

// 스크린 정보
module.exports.getScreen = (req, res) => {
  let id = req.query?.id;
  if (!id) return res.send(fail('장비 ID가 없습니다.'));

  dbConnect(db => {
    db.query(`
      SELECT
      scr.ID, scr.NAME, scr.WIDTH, scr.HEIGHT, pc.PAGE_ID, pc.ORDER, pc.ID AS DEFAULT_PAGE
      FROM screen scr 
      LEFT JOIN page_control pc ON pc.SCREEN_ID = scr.ID AND pc.ORDER = 1
      WHERE pc.HARDWARE_ID = '${id}'
      GROUP BY scr.ID
      ORDER BY pc.ORDER ASC, scr.ID;
    `, (err, result) => {
      db.end();
      if (err || result.length === 0) return res.send(fail('설정된 스크린이 없습니다.'));
      result = result.map(item => {
        item.DEFAULT_PAGE = '/' + item.DEFAULT_PAGE;
        return item;
      });
      res.send(result);
    });
  })
}

// 스마트 가로등 클라이언트에서 요청
module.exports.getData = (req, res) => {
  let id = req.query?.id;
  if (!id) return res.send(fail('장비 ID가 없습니다.'));
  let now = new Date();
  let _now = new Date();
  let data = { info: {}, now: {}, today: {}, tomorrow: {}, week: [], text: {}, img: [], video: [] }

  dbConnect(db => {
    db.query(`
      SELECT
      pc.ID, pc.SCREEN_ID, scr.NAME AS SCREEN_NAME, scr.WIDTH AS SCREEN_WIDTH, scr.HEIGHT AS SCREEN_HEIGHT, pc.ORDER,
      pc.PAGE_ID, pc.TIMER, pc.MEDIA_URL, pg.NAME AS PAGE_NAME, pg.TITLE AS PAGE_TITLE, pg.DEFAULT_TIMER AS PAGE_DEFAULT_TIMER, pg.DESCRIPTION AS PAGE_DESCRIPTION,
      pg.TYPE
      FROM hardware_list hl
      LEFT JOIN page_control pc ON hl.ID = pc.HARDWARE_ID
      LEFT JOIN screen scr ON pc.SCREEN_ID = scr.ID
      LEFT JOIN page pg ON pc.PAGE_ID = pg.ID
      WHERE hl.ID = ${id}
      ORDER BY pc.ORDER ASC
    `, (err, result) => {
      if (err || result?.length === 0) {
        res.send(fail('해당 ID와 일치하는 장비가 없습니다.'));
        db.end();
        return;
      }

      let SCREEN_DATA = result;
  
      db.query(`
        SELECT 
        hl.ID, hl.NAME, hl.AGENT, hl.DESCRIPTION, 
        ll.NX, ll.NY, hl.LOCATION_ID, ll.PATH1, ll.PATH2, ll.PATH3,
        hl.STATION_ID, sl.SIDO_NAME, sl.STATION_NAME,
        hl.AREA_ID, al.AREA, al.CITY, al.CODE1, al.CODE2
        FROM hardware_list hl
        LEFT JOIN location_list ll ON hl.LOCATION_ID = ll.ID
        LEFT JOIN station_list sl ON hl.STATION_ID = sl.ID
        LEFT JOIN area_list al ON hl.AREA_ID = al.ID
        WHERE hl.ID = '${id}'
      `, (err, result) => {
        if (err || result?.length === 0) {
          res.send(fail('해당 ID와 일치하는 장비가 없습니다.'));
          db.end();
          return;
        }
        let HW = result[0];
  
        data.info = {
          ID: HW.ID,
          NAME: HW.NAME,
          AGENT: HW.AGENT,
          DESCRIPTION: HW.DESCRIPTION,
          PAGE: SCREEN_DATA,
          LOCATION: {
            ID: HW.LOCATION_ID, PATH1: HW.PATH1, PATH2: HW.PATH2, PATH3: HW.PATH3,
          },
          STATION: {
            ID: HW.STATION_ID, SIDO_NAME: HW.SIDO_NAME, STATION_NAME: HW.STATION_NAME,
          },
          AREA: {
            ID: HW.AREA_ID, AREA: HW.AREA, CITY: HW.CITY, CODE1: HW.CODE1, CODE2: HW.CODE2,
          },
          NOW: useDateFormat(new Date()),
          IP1: getClientIp(req),
          IP2: address()
        };
  
        // now 요청
        db.query(`
          SELECT
          c.ID,
          d.SKY, g.TEXT AS SKY_TEXT,
          c.T1H AS TMP, CONCAT(CONVERT(c.T1H, CHAR), '℃') AS TMP_TEXT,
          c.PTY AS PTY, j.TEXT AS PTY_TEXT,
          c.RN1 AS POP, CONCAT(CONVERT(c.RN1, CHAR), '％') AS POP_TEXT,
          f.pm10Value AS PM10, 
          h.TEXT AS PM10_TEXT,
          f.pm25Value AS PM25, 
          i.TEXT AS PM25_TEXT,
          f.o3Value AS O3, CONCAT(CONVERT(f.o3Value, CHAR), 'ppm') AS O3_TEXT,
          c.DATE_TIME AS WEATHER_DATE,
          f.DATE_TIME AS DUST_DATE
          FROM hardware_list a
          LEFT JOIN location_list b ON a.LOCATION_ID = b.ID
          LEFT JOIN now_weather c ON b.NX = c.NX AND b.NY = c.NY AND c.DATE_TIME = (SELECT MAX(DATE_TIME) FROM now_weather)
          LEFT JOIN short_weather d ON c.DATE_TIME = d.DATE_TIME
          LEFT JOIN station_list e ON a.STATION_ID = e.ID
          LEFT JOIN now_dust f ON e.STATION_NAME = f.STATION AND f.DATE_TIME = (SELECT MAX(DATE_TIME) FROM now_dust)
          LEFT JOIN common g ON d.SKY = g.CODE AND g.CURRENT = 2
          LEFT JOIN common h ON f.pm10Grade = h.CODE AND h.CURRENT = 1
          LEFT JOIN common i ON f.pm25Grade = i.CODE AND i.CURRENT = 1
          LEFT JOIN common j ON c.PTY = j.CODE AND j.CURRENT = 3
          WHERE a.ID = '${id}'
          ORDER BY c.DATE_TIME desc, f.DATE_TIME desc
          LIMIT 1;
        `, (err, result) => {
          if (err) console.log(err);
          if (err || result.length === 0) {
            res.send(data);
            db.end();
            return;
          }
  
          // 오늘
          data.now = result[0] ?? {};
  
          db.query(`
            SELECT
            sw.ID,
            sw.SKY, c1.TEXT AS SKY_TEXT, 
            sw.TMP, CONCAT(CONVERT(sw.TMP, CHAR), '℃') AS TMP_TEXT,
            sw.POP, CONCAT(CONVERT(sw.POP, CHAR), '％') AS POP_TEXT,
            sw.PTY, c4.TEXT AS PTY_TEXT,
            sd.VALUE10 AS PM10,
            c2.TEXT AS PM10_TEXT,  
            sd.VALUE25 AS PM25,
            c3.TEXT AS PM25_TEXT, 
            CONVERT(sw.DATE_TIME, CHAR(10)) AS DATE,
            sw.DATE_TIME
            FROM hardware_list hl
            LEFT JOIN location_list ll ON hl.LOCATION_ID = ll.ID
            LEFT JOIN short_weather sw ON ll.NX = sw.NX AND ll.NY = sw.NY
            LEFT JOIN area_list al ON hl.AREA_ID = al.ID
            LEFT JOIN station_list sl ON hl.STATION_ID = sl.ID
            LEFT JOIN short_dust sd ON sl.SIDO_NAME = sd.LOCATION
            LEFT JOIN common c1 ON sw.SKY = c1.CODE AND c1.CURRENT = 2
            LEFT JOIN common c2 ON sd.VALUE10 = c2.CODE AND c2.CURRENT = 1
            LEFT JOIN common c3 ON sd.VALUE25 = c3.CODE AND c3.CURRENT = 1
            LEFT JOIN common c4 ON sw.PTY = c4.CODE AND c4.CURRENT = 3
            WHERE hl.ID = '${id}' AND 
            CONVERT(sw.DATE_TIME, DATE) >= CONVERT(NOW(), DATE) AND
            CONVERT(sd.DATE_TIME, DATE) >= CONVERT(NOW(), DATE) AND
            CONVERT(sw.DATE_TIME, DATE) = CONVERT(sd.DATE_TIME, DATE)
            ORDER BY sw.DATE_TIME ASC
          `, (err, result) => {
            if (err) console.log(err);
            if (err || result.length === 0) {
              res.send(data);
              db.end();
              return;
            }
  
            // 최저/최고 필터 함수
            const filterMinMax = (arr) => {
              let min = arr.filter(item => {
                let calc = new Date(item.DATE + ' ' + '12:00:00') - new Date(item.DATE_TIME).getTime() > 0;
                if (calc) return item;
              }).sort((x, y) => x.TMP - y.TMP)[0];
  
              let max = arr.filter(item => {
                let calc = new Date(item.DATE + ' ' + '12:00:00') - new Date(item.DATE_TIME).getTime() <= 0;
                if (calc) return item;
              }).sort((x, y) => y.TMP - x.TMP)[0];
  
              return { min, max };
            }
  
            // 오늘
            let todayArr = result?.filter(x => x.DATE === useDateFormat(now, true)) ?? [];
            data.today = filterMinMax(todayArr);
            
            // 내일
            now.setDate(now.getDate() + 1);
            let tomorrowArr = result?.filter(x => x.DATE === useDateFormat(now, true)) ?? [];
            data.tomorrow = filterMinMax(tomorrowArr);
            
            // 모레 날짜 셋팅
            _now.setDate(_now.getDate() + 2);
            let afterTomorrowDate = useDateFormat(_now, true);
  
            // 중기
            db.query(`
              SELECT
              hl.ID,
              lw2.SKY_PM AS SKY,
              c.TEXT AS SKY_TEXT,
              lw2.PTY_PM AS PTY,
              d.TEXT AS PTY_TEXT,
              lw1.MIN, CONCAT(CONVERT(lw1.MIN, CHAR), '℃') AS MIN_TEXT,
              lw1.MAX, CONCAT(CONVERT(lw1.MAX, CHAR), '℃') AS MAX_TEXT,
              lw2.RAIN_PM AS RAIN, CONCAT(CONVERT(lw2.RAIN_PM, CHAR), '％') AS RAIN_TEXT,
              CONVERT(lw1.DATE_TIME, CHAR(10)) AS DATE
              FROM hardware_list hl
              LEFT JOIN area_list al ON hl.AREA_ID = al.ID
              LEFT JOIN long_weather1 lw1 ON al.CODE1 = lw1.AREA_CODE AND 
              lw1.DATE_TIME >= '${afterTomorrowDate} 00:00:00'
              INNER JOIN long_weather2 lw2 ON al.CODE2 = lw2.AREA_CODE AND lw1.DATE_TIME = lw2.DATE_TIME
              LEFT JOIN common c ON lw2.SKY_PM = c.CODE AND c.CURRENT = 2
              LEFT JOIN common d ON lw2.PTY_PM = d.CODE AND d.CURRENT = 3
              WHERE hl.ID = '${id}'
              ORDER BY lw1.DATE_TIME ASC
              LIMIT 4;
            `, (err, result) => {
              if (err) console.log(err);
              if (err || result.length === 0) {
                res.send(data);
                db.end();
                return;
              }
  
              // 중기
              data.week = result;
  
              // 날씨 통보문
              db.query(`
                SELECT
                ID,
                TEXT,
                DATE_TIME AS DATE
                FROM weather_text
                WHERE CONVERT(NOW(), DATETIME) <= CONVERT(DATE_TIME, DATETIME)
                ORDER BY DATE ASC
                LIMIT 1
              `, (err, result) => {
                if (err) console.log(err);
                if (err || result.length === 0) {
                  res.send(data);
                  db.end();
                  return;
                }
                data.text = result[0];
  
                db.query(`
                  SELECT
                  pc.ID, pc.SCREEN_ID, pc.PAGE_ID, pg.TYPE AS PAGE_TYPE, pc.TIMER, pc.MEDIA_URL
                  FROM page_control pc
                  LEFT JOIN page pg ON pc.PAGE_ID = pg.ID
                  WHERE pc.HARDWARE_ID = '${id}' AND pc.MEDIA_URL IS NOT NULL AND (pg.TYPE = 2 OR pg.TYPE = 3)
                  ORDER BY pc.SCREEN_ID ASC
                `, (err, result) => {
                  if (err) console.log(err);
                  if (err) {
                    res.send(data);
                    db.end();
                    return;
                  }
  
                  data.img = result.filter(x => x.PAGE_TYPE === 2);
                  data.video = result.filter(x => x.PAGE_TYPE === 3);
  
                  res.send(data);
                  db.end();
                })
              });
            });
          });
        });
      });
    });
  })
}