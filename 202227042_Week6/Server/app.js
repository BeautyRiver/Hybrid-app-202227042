const express = require("express");
const path = require('path');
const app = express();
const port = 8080;

// Client 디렉터리를 정적 파일 디렉터리로 설정
const clientDir = path.resolve(__dirname, '..', 'Client');
app.use(express.static(clientDir));

app.get('/', SendClientHtml);
app.get('/hi',HiDataSend);
app.listen(port,ServerStart);


/* 함수 */
function HiDataSend(req,res) {
    res.send("Hi Data 전송!");
}

function SendClientHtml(req, res) {
    res.sendFile(clientDir + '/client.html');
}

function ServerStart(){
    console.log("서버 시작 : htpp://localhost:${port}/hi");
    console.log(__dirname);
}