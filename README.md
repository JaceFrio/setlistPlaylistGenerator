# setlistPlaylistGenerator
setlistPlaylistGenerator generates Spotify playlists from existing setlist data on [setlist.fm](https://www.setlist.fm/)

## How It Works
Users log into their Spotify account and then fill out the form with the date, location and artist for their concert that they want to get a playlist from. We check setlist.fm for the concert data and then create an empty playlist for the user. Then we search Spotify for each song on the setlist and try to find the best matching song. Once a match has been found the song is then added to the playlist. Once the playlist is complete we provide the user with a link to their new playlist.

## Technologies Used
- Node.js
- Express.js
- jQuery
- Bootstrap

## APIs
- Spotify API - https://developer.spotify.com/documentation
- setlist.fm API - https://api.setlist.fm/docs/1.0/index.html