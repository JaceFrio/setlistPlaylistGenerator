const express = require('express')
const cors = require('cors')
const logger = require('morgan') 
const fetch = require('node-fetch')
const { Console } = require('console')
const app = express()
const PORT = 8080 

app.use(logger('dev'))
app.use(express.json())
app.use(cors())

require('./routes/setlist.routes')(app)

app.use(express.static('public'))

async function getSetlist(date, city, artist) {
  let isValidJSON = true
  let setlistJSON
  let url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${artist}&cityName=${city}&p=1&date=${date}`
  console.log(url)
	setlistResponse = await fetch(
		url,
		{
			method: 'GET',
      headers: {
        'x-api-key': 'eiZlosyUB5On056wyvTski_uhqv1_dtCHx3_',
        'Accept': 'application/json'
      }
		}
	).catch((err) => console.log('Error while fetching:', err))
  try {
    setlistJSON = await setlistResponse.json()
  }
  catch {
    console.log(`No setlist found for ${date} ${city} ${artist}`)
    isValidJSON = false
  }
    if (isValidJSON) {
      artistName = setlistJSON.setlist[0].artist.name
      setlistSongs = setlistJSON.setlist[0].sets.set[0].song
      console.log('Artist Name: ' + artistName)
      console.log('Setlist Songs:')
      for (setlistSong of setlistSongs) {
        console.log(setlistSong.name)
      }
      return ['OK', setlistJSON]
  }
  else {
    //TODO: Add option to call api again with only the year given if no return
    return ['error', `No setlist found for ${date} ${city} ${artist}`]
  }
}

app.get(`/setlistInfo/:date/:city/:artist`, async (req, res) => {
  let date = req.params.date
  let city = req.params.city.replaceAll(' ', '%20')
  let artist = req.params.artist.replaceAll(' ', '%20')
  console.log(`date: ${date} city: ${city} artist: ${artist}`)
  let setlist = await getSetlist(date, city, artist)
  res.send({'data': setlist})
})

app.get('/', (req, res) => {

})

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})

///////////////////////////////////////////////////////////////////////////////

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
///////////////////////////////////////////////////////////////////////////////////////