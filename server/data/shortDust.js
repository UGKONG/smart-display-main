const request = require('request');
const config_api = require('../json/api.json');
const { useNow, useQueryString, useDateFormat, log, apiError, useCleanArray } = require('../hook');
const { shortDustGetTimeList } = require('../json/static.json');

module.exports.shortDust = {
  getShortDustSet (lastDataRequest) {
    let dateTime = useNow({ hour: 0, format: false });
    let [date, time] = dateTime.split(' ');
    time = time.slice(0, 2) + '00';

    console.log(date, time);
  },
  getShortDust () {

  },
  newShortDust () {

  }
}
