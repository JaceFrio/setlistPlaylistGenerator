const express = require('express')
const router = express.Router()

module.exports = router

async function getSetlist(date, city, artist) {
	let isValidJSON = true
	let setlistJSON
	let url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${artist}&cityName=${city}&p=1&date=${date}`
	console.log(url)
	setlistResponse = await fetch(url, {
		method: 'GET',
		headers: {
			'x-api-key': 'eiZlosyUB5On056wyvTski_uhqv1_dtCHx3_',
			Accept: 'application/json',
		},
	}).catch((err) => console.log('Error while fetching:', err))
	try {
		setlistJSON = await setlistResponse.json()
	} catch {
		console.log(`No setlist found for ${date} ${city} ${artist}`)
		isValidJSON = false
	}
	if (isValidJSON) {
		artistName = setlistJSON.setlist[0].artist.name
		setlistSongs = setlistJSON.setlist[0].sets.set[0].song
    let setlist = {artistName: artistName, setlistSongs: setlistSongs}

		return ['OK', setlist]
	} else {
		//TODO: Add option to call api again with only the artist and year given if no return
		return ['error', `No setlist found for ${date} ${city} ${artist}`]
	}
}

async function createPlaylist(setlist, playlistName, access_token, user) {
  if (setlist[0] == 'OK') {
    let result = await fetch(`https://api.spotify.com/v1/users/${user}/playlists`, {
      method: "POST", 
      body: JSON.stringify({ 'name': playlistName }),
      headers: { 
        Authorization: `Bearer ${access_token}`, 
        "Content-Type": 'application/json'
      }
    }).catch((err) => {
      console.log(err)
      return ['error creating playlist']
    })
    let playlistData = await result.json()
    let playlistId = playlistData.id
    let playlistUrl = playlistData["external_urls"]["spotify"]

    for (let song of setlist[1].setlistSongs) {
      let url = `https://api.spotify.com/v1/search?q=remaster%2520track:${encodeURI(song.name)}%2520artist:${encodeURI(setlist[1].artistName)}&type=track&limit=10&offset=0`
      let songResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`, 
          "Content-Type": 'application/json'
        }
      }).catch((err) => {
        console.log(err)
      })
      let songData = await songResponse.json()

      try {
      //FIXME: Need to compare using better method
      let songId = ''
      for (let trackItem of songData.tracks.items) {
        if (trackItem.name.includes(song.name) && trackItem.artists[0].name.includes(setlist[1].artistName)) {
          songId = trackItem.id
        }
      }
        if (songId == '') {
          songId = songData.tracks.items[0].id
        }

        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: "POST", 
          body: JSON.stringify({ 'uris': [`spotify:track:${songId}`] }),
          headers: { 
            Authorization: `Bearer ${access_token}`, 
            "Content-Type": 'application/json'
          }
        }).catch((err) => {
          console.log(err)
        })
      }
      catch {
        console.log('skipping ' + song.name)
      }
    }

    return ['playlist created', playlistUrl]
  }
  else {
    return ['an error occurred when getting setlist']
  }
}

router.get(`/setlistInfo/:date/:city/:artist/:access_token/:user`, async (req, res) => {
	let date = req.params.date
	let city = req.params.city.replaceAll(' ', '%20')
	let artist = req.params.artist.replaceAll(' ', '%20')
  let access_token = req.params.access_token
  let user = req.params.user
  let playlistName = `${req.params.artist} Concert at ${req.params.city} ${req.params.date}`
	console.log(playlistName)
	
  let setlist = await getSetlist(date, city, artist)
  let message = await createPlaylist(setlist, playlistName, access_token, user)

	res.send(message)
})