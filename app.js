const express = require('express')
const expressHandelbars = require('express-handlebars')
const sqlite3 = require('sqlite3')
const multer  = require('multer')
const path = require('path')
//var upload = multer({ dest: 'static/img/' })
const bodyParser = require('body-parser')
const expressSession = require('express-session')

const storage = multer.diskStorage({
    destination: './img/portfolio/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits:{fileSize: 10000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb)
    }
}).single('image')

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    const mimetype = filetypes.test(file.mimetype)

    if (extname && mimetype) {
        return cb(null, true)
    }else{
        cb('Error: Images only')
    }
}

const db = new sqlite3.Database("my-database.db")


db.run(`
    CREATE TABLE IF NOT EXISTS portfolio(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT
    )
`)
db.run(`
    CREATE TABLE IF NOT EXISTS question(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT
    )
`)


const app = express()

app.use(express.static('static'))

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: false
  }));

app.use(expressSession({
    secret: "aswdnawrmawrtam",
    saveUninitialized: false,
    resave: false

}))

app.use(function(req, res, next){
    //const isLoggedIn = req.session.isLoggedIn

    res.locals.isLoggedIn = req.session.isLoggedIn

    next()
})

app.engine('.hbs', expressHandelbars({
    defaultLayout: 'main.hbs'
}))

const adminUser = "admin"
const adminPass = "admin"

app.use(express.static('img'))
app.use(express.static('img/portfolio'))

app.get('/', function(req, res){
    res.render('start.hbs')
})

app.get('/portfolioo', function(req, res){

    const query = ("SELECT * FROM portfolio")

    db.all(query, function(error, projects) {
        if (error) {
            console.log(error)
            const model = {
                dbError: true
            }
        }
        else{
            projects.reverse()
            const model = {
                dbError: false,
                projects
            }
            //console.log(model)
            res.render('portfolio.hbs', model)
        }
    })
})

app.post('/portfolioo', function(req, res){

    const title = req.body.title    
    const description = req.body.description
    const id = req.body.id
    var query;
    var values;

    if (req.body.btnID == "save") {
        query = ("UPDATE portfolio SET title = ?, description = ? WHERE id = ?") 
        values = [title, description, id]
    }
    else if (req.body.btnID == "delete"){
        query = ("DELETE FROM portfolio WHERE id=?")
        values = [id]
    }
    if (query != null) {
        db.run(query, values, function(error){
            if (error) {
                console.log(error)
            }
            else{
                res.redirect('/portfolioo')
            }
        })  
    }else{
        res.redirect('/portfolioo')
    }
})

/* Eventuellt ta bort - Måste kolla */
app.post('/delete', function(req, res){
    const id = req.body.id
    const query = ("DELETE FROM portfolio WHERE id=?")
    const values = [id]

    db.run(query, values, function(error){
        if (error) {
            console.log(error)
        }
        else{
            res.redirect('/portfolioo')
        }
    })
})

app.get('/create-project', function(req, res){
    if (req.session.isLoggedIn) {
        res.render('create-project.hbs')
    }else if (req.session.isLoggedIn) {
        res.redirect('/portfolioo')
    }
})

app.post('/create-project', function(req, res){
    if (req.session.isLoggedIn) {
        upload(req, res, (error) =>{
            if (error) {
                res.render('create-project.hbs',{
                    msg: error
                })
                console.log(error)
            }
            else{
                const title = req.body.title    
                const description = req.body.description
                const image = req.file.filename

                if(title == null || description == null || image == null){res.redirect('/create-project')}
                else{
                    const query = ("INSERT INTO portfolio (title, description, image) VALUES (?, ?, ?)")
                    const values = [title, description, image]

                    db.run(query, values, function(error){
                        if (error) {
                            console.log(error)
                        }
                        else{
                            res.redirect('/portfolioo')
                        }
                    })
                }
            }
        })
    }else if (!req.session.isLoggedIn) {
        res.redirect('/portfolioo')
    }
})

app.get('/about', function(req, res){
    res.render('about.hbs')
})

app.get('/contact', function(req, res){
    res.render('contact.hbs')
})

app.get('/faq', function(req, res){
    const query = ("SELECT * FROM question")

    db.all(query, function(error, questions) {
        if (error) {
            console.log(error)
            const model = {
                dbError: true
            }
        }
        else{
            questions.reverse()
            const model = {
                dbError: false,
                questions
            }
            res.render('faq.hbs', model)
        }
    })
})

app.post('/faq', function(req, res){
    const id = req.body.id
    const query = ("DELETE FROM question WHERE id=?")
    const values = [id]

    db.run(query, values, function(error){
        if (error) {
            console.log(error)
        }
        else{
            res.redirect('/faq')
        }
    })
})

app.get('/ask-question', function(req, res){
    res.render('ask-question.hbs')
})

app.post('/ask-question', function(req, res){

    upload(req, res, (error) =>{
        if (error) {
            console.log(error)
        }
        else{
            const question = req.body.title    

            const query = ("INSERT INTO question (question) VALUES (?)")
            const values = [question]

            db.run(query, values, function(error){
                if (error) {
                    console.log(error)
                }
                else{
                    res.redirect('/faq')
                }
            })
        }
    })
})

app.get('/answer-question', function(req, res){
    if (req.session.isLoggedIn) {
        const query = ("SELECT * FROM question")

        db.all(query, function(error, questions) {
            if (error) {
                console.log(error)
                const model = {
                    dbError: true
                }
            }
            else{
                const model = {
                    dbError: false,
                    questions
                }
                res.render('answer-question.hbs', model)
            }
        })
    }else if (!req.session.isLoggedIn){
        res.redirect('/')
    }
})

app.post('/answer-question', function(req, res){

    if (req.session.isLoggedIn) {
        const answer = req.body.answer
        const id = req.body.id
        
        const query = ("UPDATE question SET answer = ? WHERE id = ?")
        const values = [answer, id]
    
        db.run(query, values, function(error){
            if (error) {
                console.log(error)
            }
            else{
                res.redirect('/faq')
            }
        })
    }else if(!req.session.isLoggedIn){
        res.redirect('/')
    }
})

app.get('/edit-question', function(req, res){
    if (req.session.isLoggedIn) {
        const query = ("SELECT * FROM question")

        db.all(query, function(error, questions) {
            if (error) {
                console.log(error)
                const model = {
                    dbError: true
                }
            }
            else{
                const model = {
                    dbError: false,
                    questions
                }
                res.render('edit-question.hbs', model)
            }
        })
    }else if(!req.session.isLoggedIn){
        res.redirect('/')
    }
})

app.post('/edit-question', function(req, res){
    if (req.session.isLoggedIn) {
        const answer = req.body.answer
        const id = req.body.id
        const query = ("UPDATE question SET answer = ? WHERE id = ?")
        const values = [answer, id]
        
        db.run(query, values, function(error){
            if (error) {
                console.log(error)
            }
            else{
                res.redirect('/faq')
            }
        })
    }else if(!req.session.isLoggedIn){
        res.redirect('/')
    }
})

app.get('/edit-project', function(req, res){
    if (req.session.isLoggedIn) {
        const query = ("SELECT * FROM portfolio")

        db.all(query, function(error, project) {
            if (error) {
                console.log(error)
                const model = {
                    dbError: true
                }
            }
            else{
                const model = {
                    dbError: false,
                    project
                }
                res.render('edit-project.hbs', model)
            }
        })
    }
    else if(!req.session.isLoggedIn) {
        res.redirect('/portfolioo')
    }
})

app.post('/edit-project', function(req, res){
    if (req.session.isLoggedIn) {
        const title = req.body.title
        const description = req.body.description
        const id = req.body.id

        var query
        var values

        if (req.body.btnID == "save") {
            query = ("UPDATE portfolio SET title = ?, description = ? WHERE id = ?")
            values = [title, description, id]
        }
        else if (req.body.btnID == "delete"){
            query = ("DELETE FROM portfolio WHERE id=?")
            values = [id]
        }
        
        if (query != null) {
            db.run(query, values, function(error){
                if (error) {
                    console.log(error)
                }
                else{
                    res.redirect('/portfolioo')
                }
            })
        }
    }
    else if (!req.session.isLoggedIn) {
        res.redirect('/')
    }
})

app.get('/login', function(req, res){
    res.render('login.hbs')
})

app.post('/login', function(req, res){
    var failed = false
    const inputUser = req.body.username
    const inputPass = req.body.password

    if(adminUser == inputUser && adminPass == inputPass){
        //login user
        req.session.isLoggedIn = true
        res.redirect("/")
    }else{
        const model = {
            dbError: true
        }
        res.render("login.hbs", model)
           // todo display error message
    }
})

app.post("/logout", function(req,res){
    req.session.isLoggedIn = false
    res.redirect("/")
})

app.get('*', function(req, res){
    res.render('invalid-directory.hbs')
})

app.listen(3000)