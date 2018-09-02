/**********************************
* 各種モジュールの読み込み
**********************************/
const moment = require('moment');
const cronJob = require('cron').CronJob;
const childProcess = require('child_process');

/**********************************
* メイン処理
**********************************/

// cronの設定(土曜日)
const timeSaturday = '0 0 23 * * 5';
const cronSaturday = new cronJob({
    //実行したい日時 or crontab書式
    cronTime: timeSaturday

    //指定時に実行したい関数
    , onTick: function() {
        childProcess.execSync('node scrape_raceinfo.js 0');

        console.log(moment().format('YYYY/MM/DD HH:mm:ss'));
    }

    //ジョブの完了または停止時に実行する関数 
    , onComplete: function() {
        console.log('onComplete!')
    }

    // コンストラクタを終する前にジョブを開始するかどうか
    , start: false

    //タイムゾーン
    , timeZone: "Asia/Tokyo"
})


// cronの設定(日曜日)
const timeSunday = '0 0 23 * * 6';
const cronSunday = new cronJob({
    //実行したい日時 or crontab書式
    cronTime: timeSunday

    //指定時に実行したい関数
    , onTick: function() {
        childProcess.execSync('node scrape_raceinfo.js 1');

        console.log(moment().format('YYYY/MM/DD HH:mm:ss'));
    }

    //ジョブの完了または停止時に実行する関数 
    , onComplete: function() {
        console.log('onComplete!')
    }

    // コンストラクタを終する前にジョブを開始するかどうか
    , start: false

    //タイムゾーン
    , timeZone: "Asia/Tokyo"
})


// cronの設定(土・日曜日)
const timeWeekend = '0 */30 * * * *';
const cronWeekend = new cronJob({
    //実行したい日時 or crontab書式
    cronTime: timeWeekend

    //指定時に実行したい関数
    , onTick: function() {
        childProcess.execSync('node scrape_odds.js');
        childProcess.execSync('node select.js');
        childProcess.execSync('node insert.js');
        childProcess.execSync('node score.js');
        childProcess.execSync('node tweet.js');

        console.log(moment().format('YYYY/MM/DD HH:mm:ss'));
    }

    //ジョブの完了または停止時に実行する関数 
    , onComplete: function() {
        console.log('onComplete!')
    }

    // コンストラクタを終する前にジョブを開始するかどうか
    , start: false

    //タイムゾーン
    , timeZone: "Asia/Tokyo"
})


//ジョブ開始
cronSaturday.start();
cronSunday.start();
cronWeekend.start();
