//----------------------------------------------------------------------------------그냥 외워
const { render } = require('ejs')
const express =require('express')                                                   
const app= express()                                                    

app.use(express.static(__dirname +'/public'))                                       //파일을 사용 
app.use(express.json())                                                             //유저 입력 저장용
app.use(express.urlencoded({extended:true}))                                        //유저 입력 저장용
app.set('view engine','ejs')                                                        //ejs 사용

//----------------------------------------------------------------------------------
username=""


//--------------------------------------------------------------------------------싹다 비번생성용 library (걍써) 
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: '알빠노',
  resave : false,                                                                       //갱신여부 (false 추천)
  saveUninitialized : false                                                                       //false 추천
}))

app.use(passport.session()) 
//----------------------------------------------------------------------------------



//----------------------------------------------------------------------------------    mongodb library 기본설정(걍써)
const { MongoClient, ObjectId } = require('mongodb')
let db
const url = 'mongodb+srv://admin:qwer1234@cluster0.e9u1u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
new MongoClient(url).connect().then((client)=>{                                         //위에코드 mongodb에서 받고 admin이랑 qwer1234만 수정
  console.log('DB연결성공')
  db = client.db('forum')
}).catch((err)=>{
  console.log(err)
})
//----------------------------------------------------------------------------------



//----------------------------------------------------------------------------------                              
app.listen(8080,() => {                                                                 //서버열어야지 (포트조정)                        
    console.log('http://localhost:8080 에서 서버 실행중')                
    })
//----------------------------------------------------------------------------------








app.get('/register', async (요청, 응답) => { 
    let result =await db.collection('user').find().toArray()                                                   
    응답.render('register.ejs',{userinfo:result})
    
})

app.post('/register', async (요청, 응답, next) => {  
    await db.collection('user').insertOne({
        username: 요청.body.username,
        password: 요청.body.password                        //나중에 비번 암호화나 해보자 
    })
    await db.createCollection(요청.body.username);

    응답.redirect('/login')
})



app.get('/login', async (요청, 응답) => { 
    응답.render('login.ejs')
    
})
app.post('/login', async (요청, 응답, next) => {  
    passport.authenticate('local', (error, user, info)=>{
        if(error) return 응답.status(500).json(error)
        if(!user) return 응답.status(401).json(info.message)
        요청.login(user, (err)=>{
            응답.redirect('/main')
            username=요청.body.username
        

            

        })
    })(요청, 응답, next)
})

app.get('/main',async(요청, 응답) => {                               
    let result =await db.collection(username).find({ 'datatype': 'memo' }).toArray() 
    응답.render('main.ejs',{글목록:result ,username: username})
       
      
})

app.get('/input',async(요청, 응답) => {                                //쓰기                            
    응답.render('input.ejs',{username: username})                                           //
})

app.post('/input',async(요청, 응답) => {   

    try{                                                            //이거먼저해보고 
        if(요청.body.title==''){                                    //만약 요청.body 제목이 없으면
            응답.send('제목입력이새끼야')
        }
        else if(요청.body.content==''){
            응답.send('본문입력이새끼야')
        }
        else{
            await db.collection(username).insertOne({datatype:"memo", title:요청.body.title,content:요청.body.content})  
            응답.redirect('/main')  

        }   
    }   
    catch(e){                                                       //아니면 얘해라 
        응답.statusCode(500).send('서버가 좆됬어요')
        console.log(e)                                              //e-> 오류 원인
    }






})


app.get('/detail/:id', async (요청, 응답) => { 
try{
                                               
    let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })
    if(result==null)                                        //url 파라미터 detail/:변수    (:과 자유변수)-> 아무문자나 입력
    {
        응답.send('url 건드리지마라')
    }
    else{
        응답.render('detail.ejs', { result : result })
    }
  }
catch(e)
{
    응답.send('url 건드리지마라')
}   
})
                                              
//글마다 수정버튼 수정페이지에는 기존 글이 채워저있음 수정하면 db에 저장, main으로

app.get('/edit/:id', async (요청, 응답) => { 
    let result = await db.collection(username).findOne({ _id : new ObjectId(요청.params.id) })
    console.log(result )
    응답.render('edit.ejs',{result: result})
    
})

app.post('/edit', async (요청, 응답) => {  
     await db.collection(username).updateOne({_id : new ObjectId(요청.body._id)},
        {$set: {title:요청.body.title, content:요청.body.content}})
    응답.redirect('/main')
})



//_id : new ObjectId(요청.params.id)
app.delete('/delete', async (요청, 응답) => {                           //delete, 주소 ,
    await db.collection(username).deleteOne({_id :new ObjectId(요청.query.docid)})
    응답.send('삭제완료')

})
//------------------------------------------------------------------------------------------검사하는 로직 (걍써)
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
    if (result.password == 입력한비번) {    
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }))                                                             // passport.authenticate('local')() 쓰면 알아서 될듯?         console.log(user)
//         done(null, { id: user._id, username: user.username })
//     })
// })

// passport.deserializeUser((user, done) =


//-------------------------------------------------------------------------------------------------
app.get('/aichat', async (요청, 응답) => { 
    let chathistory =await db.collection(username).find({ 'datatype': 'Aichat' }).sort({ _id: 1 })
    .toArray() 
    응답.render('aichat.ejs',{username:username, chathistory:chathistory})
    console.log(chathistory)
    
    
})

app.post('/saveai', async (요청, 응답) => {
    let message = 요청.body.message; // 클라이언트에서 보낸 메시지
    console.log(message)
    await db.collection(username).insertOne({datatype:"Aichat", title:"Ai",content:message})  

})

app.post('/saveuser', async (요청, 응답) => {
    let message = 요청.body.message; // 클라이언트에서 보낸 메시지
    console.log(message)
    await db.collection(username).insertOne({datatype:"Aichat", title:"User",content:message})  

})

app.post('/deleteaichat', async (요청, 응답) => {
    console.log('메세지 삭제좀')
    await db.collection(username).deleteMany({ datatype: 'Aichat' });
    응답.redirect('/aichat')
})

