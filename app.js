const express = require('express')
const bodyParser = require('body-parser')
const router = require('./router')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : true}))

const port = 5000

app.listen(port, ()=>{
  console.log('server started...')

  app.use('/', router)
})