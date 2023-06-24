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
		console.log('Artist Name: ' + artistName)
		console.log('Setlist Songs:')
		for (setlistSong of setlistSongs) {
			console.log(setlistSong.name)
		}
		return ['OK', setlistJSON]
	} else {
		//TODO: Add option to call api again with only the artist and year given if no return
		return ['error', `No setlist found for ${date} ${city} ${artist}`]
	}
}

router.get(`/setlistInfo/:date/:city/:artist`, async (req, res) => {
	let date = req.params.date
	let city = req.params.city.replaceAll(' ', '%20')
	let artist = req.params.artist.replaceAll(' ', '%20')
	console.log(`date: ${date} city: ${city} artist: ${artist}`)
	let setlist = await getSetlist(date, city, artist)
	res.send({ data: setlist })
})
