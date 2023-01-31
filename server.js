const express = require('express')
const cors = require('cors')
const logger = require('morgan') 
const helmet = require('helmet')
const fetch = require('node-fetch')
const { Console } = require('console')
const app = express()
const PORT = 8080 

app.use(helmet()) 
app.use(logger('dev'))
app.use(express.json())
app.use(cors())

require('./routes/setlist.routes')(app)

app.use(express.static('public'))

// NOTE: Working
// async function getSetlist() {
//   setlistResponse = await fetch('https://api.setlist.fm/rest/1.0/search/setlists?artistName=Joyce%20Manor&cityName=Salt%20Lake%20City&p=1&year=2022', {
//     method: 'GET',
//     headers: {
//       'x-api-key': 'eiZlosyUB5On056wyvTski_uhqv1_dtCHx3_',
//       'Accept': 'application/json'
//     }
//   })
//   .catch(err => console.log('Error while fetching:', err))
//   setlistJSON = await setlistResponse.json()
//   artistName = setlistJSON.setlist[0].artist.name
//   setlistSongs = setlistJSON.setlist[0].sets.set[0].song
//   console.log('Artist Name: ' + artistName)
//   console.log('Setlist Songs:')
//   for (setlistSong of setlistSongs) {
//     console.log(setlistSong.name)
//   }
// }
// getSetlist()

// app.get('/', (req, res) => {
//   res.json({ message: setlistJSON })
// })

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})
