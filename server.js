const express = require('express')
const cors = require('cors')
const logger = require('morgan') 
const fetch = require('node-fetch')
const querystring = require('querystring')
const request = require('request')
var cookieParser = require('cookie-parser');
const config = require('./config/config')
const { Console } = require('console')
const app = express()
const PORT = process.env.PORT || 8080

var client_id = config.CLIENT_ID
var client_secret = config.CLIENT_SECRET
var redirect_uri = config.REDIRECTURI

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use(cors())
app.use(cookieParser())

// const setlistRoutes = require('./routes/setlist.routes')(app)
// const authRoutes = require('./routes/auth.routes.js')
// app.use('/api', cors(), authRoutes)

app.use(express.static('public'))

function generateRandomString(length) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

var stateKey = 'spotify_auth_state';

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const scope = `user-modify-playback-state
  user-read-playback-state
  user-read-currently-playing
  user-library-modify
  user-library-read
  user-top-read
  playlist-read-private
  playlist-modify-public`

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true
    }));
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

// app.get('/refresh', function(req, res) {
//   const scope = `user-modify-playback-state
//                  user-read-playback-state
//                  user-read-currently-playing
//                  user-library-modify
//                  user-library-read
//                  user-top-read
//                  playlist-read-private
//                  playlist-modify-public`

//   res.redirect('https://accounts.spotify.com/authorize?' +
//     querystring.stringify({
//       response_type: 'token',
//       client_id: config.CLIENT_ID,
//       scope: scope,
//       redirect_uri: config.REDIRECTURI,
//       show_dialog: true
//     }))
// })

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('http://localhost:8080/generatePlaylist.html#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('http://localhost:8080/generatePlaylist.html#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

// app.get('/callback', function(req, res) {

//   // your application requests refresh and access tokens
//   // after checking the state parameter

//   var code = req.query.code || null;
//   var state = req.query.state || null;
//   var storedState = req.cookies ? req.cookies[stateKey] : null;

//   if (state === null || state !== storedState) {
//     res.redirect('/#' +
//       querystring.stringify({
//         error: 'state_mismatch'
//       }));
//   } else {
//     res.clearCookie(stateKey);
//     var authOptions = {
//       url: 'https://accounts.spotify.com/api/token',
//       form: {
//         code: code,
//         redirect_uri: redirect_uri,
//         grant_type: 'authorization_code'
//       },
//       headers: {
//         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
//       },
//       json: true
//     };

//     request.post(authOptions, function(error, response, body) {
//       if (!error && response.statusCode === 200) {

//         var access_token = body.access_token,
//             refresh_token = body.refresh_token;

//         var options = {
//           url: 'https://api.spotify.com/v1/me',
//           headers: { 'Authorization': 'Bearer ' + access_token },
//           json: true
//         };

//         // use the access token to access the Spotify Web API
//         request.get(options, function(error, response, body) {
//           console.log(body);
//         });

//         // we can also pass the token to the browser to make requests from there
//         res.redirect('/#' +
//           querystring.stringify({
//             access_token: access_token,
//             refresh_token: refresh_token
//           }));
//       } else {
//         res.redirect('/#' +
//           querystring.stringify({
//             error: 'invalid_token'
//           }));
//       }
//     });
//   }
// });

// app.get('/callback', async function(req, res) {
//   const body = {
//     grant_type: 'authorization_code',
//     code: req.query.code,
//     redirect_uri: config.REDIRECTURI,
//     client_id: config.CLIENT_ID,
//     client_secret: config.CLIENT_SECRET,
//   }

//   await fetch('https://accounts.spotify.com/api/token', {
//     method: 'POST',
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//       "Accept": "application/json"
//     },
//     body: encodeFormData(body)
//   })
//   .then(response => response.json())
//   .then(data => {
//     const query = querystring.stringify(data)
//     res.redirect(`${config.CLIENT_REDIRECTURI}?${query}`)
//   })
// })

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