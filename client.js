// 클라이언트
const requestIp = require('request-ip');
const { db } = require('./web');

module.exports = { dbIsConnect };

const welcomeHTML = ({ ipAddress, result }) => {
  const stateStyle = `background-color: ${result ? '#33db33' : '#ff4b4b'}`;
  const tag = `
    <style>
      * { list-style: none; padding: 0; }
      html, body { width: 100%; height: 100%; font-family: monospace; }
      body { color: #fff; background-color: #333; display: flex; align-items: center; justify-content: center; flex-flow: column; }
      img { width: 300px; } h1 { font-size: 30px; } h2 {  text-align: center; }
      li { margin-bottom: 4px; }
      span { display: inline-block; width: 60px; }
      span.type { width: 80px; font-size: 14px; }
      span.dot { width: 8px; height: 8px; border-radius: 100%; }
    </style>
    <body>
      <img src='/logo.png' /><h1>Node Server</h1><h2>Access IP: ${ipAddress}</h2><h2 style='margin-bottom: 0;'>Connect State</h2>
      <ul>
        <li><span class='type'>Server</span><span class='dot' style='${stateStyle}'></span></li>
        <li><span class='type'>MySQL</span><span class='dot' style='${stateStyle}'></span></li>
      </ul>
    </body>
  `;
  return tag;
}

function dbIsConnect (req, res) {
  db.query('SELECT * FROM test', (err) => {
    const ipAddress = requestIp.getClientIp(req);
    let result = err ? false : true;
    res.send(welcomeHTML({ ipAddress, result }));
  })
}