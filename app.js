const express = require('express')
const expressHandelbars = require('express-handlebars')

const app = express()

app.engine(".hbs", expressHandelbars({
    defaultLayout: "main.hbs"
}))

app.get("/", function(request, response){
    response.render("start.hbs")
})

app.get("/about", function(request, response){
    response.render("about.hbs")
})

app.listen(8080)