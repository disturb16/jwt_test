const express = require('express')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const router = express.Router()

router.post('/user/login', (req, res)=>{
  const email = req.body.email
  const password = req.body.password

  if(!email || !password){
    return res.status(400).json({
      success: false,
      error: "Parameters username or password not provided"
    })
  }

  if (email !== 't@t.com' || password !== '1234'){
    return res.status(200).json({
      success: false,
      msg: 'Incorrect username or password'
    })
  }

  const cert = fs.readFileSync('./private.pem')

  const jwtOptions = {
    expiresIn: "30m",
    algorithm: "RS256"
  }

  const token = jwt.sign({
      id: 0001,
      email
    },
    cert,
    jwtOptions
  )

  return res.status(200).json({success: true, token})

})

router.get('/test', (req, res)=>{
  return res.status(200).json({result: "is working"})
})


module.exports = router