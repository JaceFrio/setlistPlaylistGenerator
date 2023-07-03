const express = require('express')
const router = express.Router()

module.exports = router

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

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
      //NOTE: Trying using Levenshtein Distance to calculate similarity
      //TODO: Skip songs that don't match the artist like covers or wrong matches.
        let songId = ''
        let simScore = 0
        for (let trackItem of songData.tracks.items) {
          let newSimScore = similarity(song.name, trackItem.name)
          if (newSimScore > simScore) {
            simScore = newSimScore
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