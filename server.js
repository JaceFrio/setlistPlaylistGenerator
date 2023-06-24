const express = require('express')
const cors = require('cors')
const logger = require('morgan') 
var cookieParser = require('cookie-parser')
const app = express()
const PORT = process.env.PORT || 8080

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use(cors())
app.use(cookieParser())

const authRoutes = require('./routes/auth.routes')
app.use(authRoutes)

const setlistRoutes = require('./routes/setlist.routes')
app.use(setlistRoutes)

app.use(express.static('public'))

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})