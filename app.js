const express = require('express')
const expressHandelbars = require('express-handlebars')
const sqlite3 = require('sqlite3')
var multer  = require('multer')
var upload = multer({ dest: 'static/img/' })
const bodyParser = require('body-parser')

const db = new sqlite3.Database("my-database.db")

/*
db.run(`
    CREATE TABLE portfolio(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT
    )
`)
*/




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

app.get('/', function(request, response){
    response.render('start.hbs')
})

app.get('/portfolioo', function(request, response){

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
            console.log(model)
            response.render('portfolio.hbs', model)
        }
    })
})
app.get('/create-project', function(request, response){
    response.render('create-project.hbs')
})

app.post('/create-project', function(request, response){
    const title = request.body.title
    const description = request.body.description
    const image = request.body.image
    const query = ("INSERT INTO portfolio (title, description, image) VALUES (?, ?, ?)")
    const values = [title, description, image]

    console.log(title, description, image)

    db.run(query, values, function(error){
        if (error) {
            console.log(error)
        }
        else{
            response.redirect('/portfolioo')
        }
    })
})

app.get('/about', function(request, response){
    response.render('about.hbs')
})

app.get('/contact', function(request, response){
    response.render('contact.hbs')
})

app.get('/faq', function(request, response){
    response.render('faq.hbs')
})

app.listen(8080)