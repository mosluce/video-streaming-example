/**
 * Created by mosluce on 2014/6/28.
 */
var express = require('express'), fs = require('fs');
var app = express();

//使用EJS
app.set('view engine', 'ejs');

//首頁
app.get('/', function (req, res) {
    res.render('index');
});

//影片列表
app.get('/videos', function (req, res) {
    var dir = req.param("dir");

    fs.readdir(__dirname + '/videos/' + (dir ? dir + "/" : ""), function (err, files) {
        var ids = [];

        for(var k in files) {
            var file = files[k];
            var split = file.split(/\./);
            var formats = /mp4/i;

            if(split[1] && formats.test(split[1])) {
                ids.push(split[0]);
            }
        }

        res.json({
            prefix: '/watch/',
            ids: ids
        })
    });
});

//讀取影片
app.get('/watch/:vid', function (req, res) {
    //TODO: 依照傳入的 vid 取得指定的檔案
    var path = __dirname + '/videos/NGNL/' + req.param("vid") + '.mp4';

    //開始處理串流
    var stat = fs.statSync(path);
    var total = stat.size;
    if (req.headers['range']) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total - 1;
        var chunksize = (end - start) + 1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        var file = fs.createReadStream(path, {start: start, end: end});
        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(res);
    } else {
        console.log('ALL: ' + total);
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        fs.createReadStream(path).pipe(res);
    }

});

//靜態內容
app.use(express.static(__dirname + '/public'));

app.listen(9000);