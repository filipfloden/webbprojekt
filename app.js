const express = require('express')
const expressHandelbars = require('express-handlebars')
const sqlite3 = require('sqlite3')
const multer  = require('multer')
const path = require('path')
//var upload = multer({ dest: 'static/img/' })
const bodyParser = require('body-parser')

const storage = multer.diskStorage({
    destination: './img/portfolio/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
}).single('image')

const db = new sqlite3.Database("my-database.db")


db.run(`
    CREATE TABLE IF NOT EXISTS portfolio(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT
    )
`)


const app = express()

app.engine('.hbs', expressHandelbars({
    defaultLayout: 'main.hbs'
}))

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
}));

app.use(express.static('img'))
app.use(express.static('img/portfolio'))

app.use(express.static('static'))
app.get('/main.css')
app.get('/bootstrap.css')

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
    res.render('create-project.hbs')
})

app.post('/create-project', function(req, res){

    upload(req, res, (error) =>{
        if (error) {
            console.log(error)
        }
        else{
            const title = req.body.title    
            const description = req.body.description
            const image = req.file.filename
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
    })
})

app.get('/about', function(req, res){
    res.render('about.hbs')
})

app.get('/contact', function(req, res){
    res.render('contact.hbs')
})

app.get('/faq', function(req, res){
    res.render('faq.hbs')
})

app.listen(8080)