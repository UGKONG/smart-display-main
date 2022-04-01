// 자바스크립트 엄격모드 ON
'use strict';

const express = require('express');
const app = express();
const mysql = require('mysql');
const db_config = require('./config/db.json');
const db = mysql.createConnection(db_config);

// 데이터베이스, 엔진 내보내기
module.exports = { db, app }

// 클라이언트 API 불러오기
require('./clientAPI');

// 엔진 셋팅
app.set('port', 8001);
app.use('/test', express.static(__dirname + '../view'));

// 실행
const { serverStart, dbConnect } = require('./main');
db.connect(dbConnect);
app.listen(app.get('port'), serverStart);

// IP 필터 함수
// const ipFilter = () => {
//   const isTrue = db.query('SELECT (*) AS COUNT FROM hardware_list');
//   return isTrue;
// }

// 현재 날씨 상태 정보 요청 (클라이언트 응답)
// const _getNowWeather = (req, res) => {
//   let x = req.params.x;
//   let y = req.params.y;
//   db.query(`
//     SELECT * FROM now_weather WHERE NX=${x} AND NY=${y}
//   `, (err, result) => {
//     if (err) {
//       console.log(err);
//       log('클라이언트를 통해 초단기실황 데이터 요청에 실패하였습니다.');
//       return;
//     }
//     log('클라이언트를 통해 초단기실황 데이터 요청에 성공하였습니다.');
//     res.send(result);
//   })
// }

// 장비 리스트 조회
// const getHardwareList = (req, res) => {
//   db.query(`
//     SELECT * FROM hardware_list
//   `, (err, result) => {
//     if (err) {
//       console.log(err);
//       log('장비 리스트 조회 요청에 실패하였습니다.');
//       return;
//     }

//     log('장비 리스트 조회에 성공하였습니다.');
//     res.send(result);
//   })
// }

// 장비 등록 (보류)
// const _init = (req, res) => {

//   return;
//   let dong = req.params.dong;
//   log(dong + ' 장비 등록을 요청합니다.');

//   // 등록 여부 파악
//   db.query(`
//     SELECT * FROM hardware_list WHERE PATH3='${dong}';
//   `, (err, result) => {
//     if (err) {
//       log(dong + ' 장비 등록 여부 조회에 실패하였습니다.');
//       res.send({ result: false, info: err, msg: '장비 등록 여부 조회 오류' });
//       return;
//     }

//     if (result.length > 0) {  // 이미 등록된 장비
//       log(dong + ' 장비는 이미 등록된 장비입니다.');
//       res.send({ result: false, info: result[0], msg: dong + ' 장비는 이미 등록된 장비입니다.' });
//       return;

//     } else {  // 신규 장비

//       // DB의 동 정보 조회
//       db.query(`
//         SELECT * FROM location_list WHERE PATH3 LIKE '%${dong}%';
//       `, (err, result) => {
//         if (err) {
//           log('동 위치 조회에 실패하였습니다.');
//           res.send({ result: false, info: err, msg: '동 위치 조회 오류' });
//           return;
//         }

//         if (result.length === 0) {
//           res.send({ result: false, info: null, msg: '정확한 동 이름을 입력해주세요.' });
//           return;
//         }

//         if (result.length > 1) return res.send({
//           result: false, 
//           info: '검색결과 => ' + result.map(item => item.PATH3), 
//           msg: '동 이름을 정확하게 입력해주세요.'
//         });

//         let insertData = result[0];
//         db.query(`
//           INSERT INTO hardware_list (CODE,PATH1,PATH2,PATH3,NX,NY,CREATE_DATE) VALUES (
//             '${insertData.CODE}',
//             '${insertData.PATH1}',
//             '${insertData.PATH2}',
//             '${insertData.PATH3}',
//             ${insertData.NX},
//             ${insertData.NY},
//             '${useNow()}'
//           )
//         `, (err, result) => {
//           if (err) {
//             log(dong + ' 장비 등록에 실패하였습니다.');
//             res.send({ result: false, info: err, msg: '장비 등록 오류' });
//             return;
//           }
          
//           log(dong + ' 장비 등록에 성공하였습니다.');
//           res.send({ 
//             result: true, 
//             info: {
//               ID: insertData.ID,
//               CODE: insertData.CODE,
//               PATH1: insertData.PATH1,
//               PATH2: insertData.PATH2,
//               PATH3: insertData.PATH3,
//               NX: insertData.NX,
//               NY: insertData.NY,
//             }, 
//             msg: insertData.PATH3 + ' 장비가 등록되었습니다.' 
//           });
//         });
        
//       });
//     }
//   })
// }

// 장비 삭제 (보류)
// const _remove = (req, res) => {
//   return;
  
//   let dong = req.params.dong;
//   log(dong + ' 장비 삭제을 요청합니다.');

//   db.query(`
//     SELECT * FROM hardware_list WHERE PATH3 LIKE '${dong}'
//   `, (err, result) => {
//     if (err) {
//       log(dong + ' 장비 등록 여부 조회에 실패하였습니다.');
//       res.send({ result: false, info: err, msg: '장비 등록 여부 조회 오류' });
//       return;
//     }

//     if (result.length === 0) {
//       res.send({ result: false, info: null, msg: '등록된 장비가 아닙니다.' });
//       return;
//     }

//     if (result.length > 1) return res.send({
//       result: false, 
//       info: '검색결과 => ' + result.map(item => item.PATH3), 
//       msg: '동 이름을 정확하게 입력해주세요.'
//     });
    
//     let deleteData = result[0];
//     db.query(`
//       DELETE FROM hardware_list WHERE ID=${deleteData.ID}
//     `, (err, result) => {
//       if (err) {
//         console.log(err);
//         log(dong + ' 장비 삭제 요청에 실패하였습니다.');
//         return;
//       }
      
//       res.send({ 
//         result: true, 
//         info: deleteData, 
//         msg: deleteData.PATH3 + ' 장비가 삭제되었습니다.' 
//       });
//     });
//   });
// }
