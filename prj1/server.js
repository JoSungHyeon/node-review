const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb')

app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));


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




app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
});

app.get('/about', (req, res) => {
    res.sendFile(__dirname + "/myinfo.html")
});

app.get('/news', (req, res) => {
    res.send("오늘 비옴");
});

app.get('/shop', (req, res) => {
    res.send("쇼핑페이지 입니다.");
});

app.get('/list', async (req, res) => {
    let result = await db.collection('post').find().toArray();
    res.render('list.ejs', { 글목록: result });
});

app.get('/time', (req, res) => {
  res.render('time.ejs', { data: new Date() })
});

app.get('/write', (req, res) => {
  res.render('write.ejs')
});

app.post('/add', async (req, res) => {
  try {
    if(req.body.title == '') {
      res.send("제목을 입력해 주세요.");
    } else {
      await db.collection('post').insertOne({title: req.body.title, content: req.body.content});
      res.redirect('/list');
    }
  } catch(e) {
      console.log(e);
      res.status(500).send("서버 에러입니다.");
  }

});

app.get('/detail/:id', async (req, res) => {

  try {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id)});
    if(result == null) {
      res.status(404).send("존재하지 않는 아이템입니다.")  
    } else {
      res.render('detail.ejs', {result: result});
    }
  } catch(e) {
    res.status(404).send("존재하지 않는 아이템입니다.")
  }

});