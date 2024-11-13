const express = require('express');
const app = express();

app.use(express.static(__dirname + "/public"));

const { MongoClient } = require('mongodb')

let db
const url = 'mongodb+srv://izzang1230i:qwer1234@cluster0.gxwas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('myProject1');
  app.listen(8080, () => {
    console.log("http://localhost:8080 에서 서버 실행중");
  });
}).catch((err)=>{
  console.log(err)
});




app.get('/', (요청, 응답) => {
    응답.sendFile(__dirname + "/index.html")
});

app.get('/about', (요청, 응답) => {
    응답.sendFile(__dirname + "/myinfo.html")
});

app.get('/news', (요청, 응답) => {
    db.collection('post').insertOne({title: '타이틀임'})
    // 응답.send("뉴스임");
});

app.get('/shop', (요청, 응답) => {
    응답.send("쇼핑페이지 입니다.");
});

app.get('/list', async (요청, 응답) => {
    let result = await db.collection('post').find().toArray();
    console.log(result[0]);
    응답.send("디비에 있는 데이터");
});
