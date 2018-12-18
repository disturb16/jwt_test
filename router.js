const express = require('express')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const router = express.Router()

router.get('/', (req, res)=>{
  res.send('Hello')
})

router.get('/test', (req, res)=>{
  return res.status(200).json({result: "is working"})
})


module.exports = router