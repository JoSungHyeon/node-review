// 기본 셋팅
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser'); // 쿠키
const { MongoClient, ObjectId } = require('mongodb'); // 몽고디비
const methoddOverride = require('method-override'); // PUT메소드같은거 쓰는거
const bcrypt = require('bcrypt');

// 사용하겠다~~
app.use(methoddOverride('_method'));
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// 회원가입시 필요한거
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo'); // 세션 몽고디비에 저장하기
app.use(passport.initialize())
app.use(session({
    secret: '암호화에 쓸 비번',
    resave : false,
    saveUninitialized : false,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://izzang1230i:qwer1234@cluster0.gxwas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      dbName: 'myProject1'
    })

}));

app.use(passport.session());



// 몽고디비 불러오기
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



// 홈
app.get('/', (req, res) => {
  const isLoggedIn = req.cookies['connect.sid'] ? true : false;
  res.render('index.ejs', { login: isLoggedIn });
});

// 페이지 이동(파일 보여주기)
app.get('/about', (req, res) => {
    res.sendFile(__dirname + "/myinfo.html")
});

// 페이지 이동(직접 띄우기)
app.get('/news', (req, res) => {
    res.send("오늘 비옴");
});

// 페이지 이동(직접 띄우기)
app.get('/shop', (req, res) => {
    res.send("쇼핑페이지 입니다.");
});

// 페이지 이동(ejs파일로 데이터 이동하고 보여주기) 
app.get('/list', async (req, res) => {
    const isLoggedIn = req.cookies['connect.sid'] ? true : false;
    let result = await db.collection('post').find().toArray();
    res.render('list.ejs', { 글목록: result, login: isLoggedIn });
});

// 페이지 이동(ejs파일로 현재날짜 보여주기)
app.get('/time', (req, res) => {
  res.render('time.ejs', { data: new Date() })
});

// 페이지 이동(글작성ejs)
app.get('/write', (req, res) => {
  res.render('write.ejs')
});

// 글작성ejs에서 post방식으로 데이터베이스에 데이터 추가(예외처리)
app.post('/add', async (req, res) => {
  try {
    if(req.body.title == '') {
      res.send("제목을 입력해 주세요.");
    } else {
      await db.collection('post').insertOne({title: req.body.title, content: req.body.content});
      res.redirect('/list/1');
    }
  } catch(e) {
      console.log(e);
      res.status(500).send("서버 에러입니다.");
  }
});

// 상세보기 페이지 이동 /:id <<이건 파라미터값임 (예외처리)
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

// 수정하기 페이지 이동 /:id <<이건 파라미터값임 (예외처리)
app.get('/edit/:id', async (req, res) => {
  try {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id)});
    if(result == null) {
      res.status(404).send("존재하지 않는 아이템입니다.")  
    } else {
      res.render('edit.ejs', {result: result});
    }
  } catch(e) {
    res.status(404).send("존재하지 않는 아이템입니다.");
  }
});

// 수정하기ejs에서 methoddOverride을 활용해
// put 방식으로 데이터베이스에 데이터 수정 (예외처리)
app.put('/edit', async (req, res) => {
  try {
    if(req.body.title == '') {
      res.send("제목을 입력해 주세요.");
    } else {
      await db.collection('post').updateOne( {_id: new ObjectId(req.body.id)}, {$set: { title: req.body.title, content: req.body.content }});
      res.redirect('/list');
    }
  
  } catch(e) {
      res.status(500).send("서버 에러입니다.");
  }
});

// 삭제하기 기능
app.delete('/delete', async (req, res) => {
  await db.collection('post').deleteOne({_id: new ObjectId(req.query.docid)});
  res.send("삭제완료");
});

// 페이지(페이지네이션) 구분하기 skip은 몇개 건너뛸지, limit은 몇개 보여줄지
// 속도가 조금 느림
// 1에서 3이상으로 바로 이동 가능
app.get('/list/:id', async (req, res) => {
  const isLoggedIn = req.cookies['connect.sid'] ? true : false;
  let result = await db.collection('post').find().skip((req.params.id-1) * 5).limit(5).toArray();
  res.render('list.ejs', { 글목록: result, login: isLoggedIn });
});

// 페이지(이전/다음) 구분하기 skip은 몇개 건너뛸지, limit은 몇개 보여줄지
// 속도 빠름
// 1에서 3이상으로 바로 이동 불가능
// app.get('/list/next/:id', async (req, res) => {
//   let result = await db.collection('post').find({_id: {$gt : new ObjectId(req.params.id)}}).limit(5).toArray();
//   res.render('list.ejs', { 글목록: result });
// });

// 회원로그인페이지
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }

  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

passport.serializeUser((user, done) => {
  // console.log(user)
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username })
  })
})

passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({_id: new ObjectId(user.id)})
  delete result.password
  process.nextTick(() => {
    done(null, result)
  })
})

app.get('/login', async (req, res) => {
  res.render('login.ejs')
})

app.post('/login', async (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if(error) return res.status(500).json(error)
    if(!user) return res.status(401).json(info.message)
    req.logIn(user, (err) => {
      console.log(req.user)
      if(err) return next(err)
      res.redirect('/')
    })
  })(req, res, next)
})

app.get('/mypage', (req, res) => {
  res.render('mypage.ejs', {result: req.user})
})

// 가입하기 페이지 이동
app.get('/register', (req, res) => {
  res.render('register.ejs')
})

// 암호 해싱해야함
app.post('/register', async (req, res) => {
  let hash = await bcrypt.hash(req.body.password, 10);

  let result = await db.collection('user').findOne({username: req.body.username});
  console.log(result)

  try {
    if(result == null) {
      if(req.body.password == req.body.confirm) {
        await db.collection('user').insertOne({
          username: req.body.username,
          password: hash
        })
        console.log(req.user)
        res.redirect('/')
      } else {
        res.status(401).send("비밀번호를 확인해 주세요.");
      }
    } else {
      res.status(401).send("중복된 아이디입니다.");
    }
  } catch(e) {
    res.status(500).send("서버 에러입니다.");
  }
  

})