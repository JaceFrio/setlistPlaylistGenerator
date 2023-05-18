const PORT = 8080
const clientId = '9aaae9b6a54447b9aa486b1f5e3122d9' // Replace with your client ID
const redirectUri = 'http://localhost:8080/generatePlaylist.html'

function generateRandomString(length) {
	let text = ''
	let possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

async function generateCodeChallenge(codeVerifier) {
	function base64encode(string) {
		return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')
	}

	const encoder = new TextEncoder()
	const data = encoder.encode(codeVerifier)
	const digest = await window.crypto.subtle.digest('SHA-256', data)

	return base64encode(digest)
}

async function LogInToSpotify() {
	let codeVerifier = generateRandomString(128)

  console.log('generating code challenge')
	generateCodeChallenge(codeVerifier).then((codeChallenge) => {
		let state = generateRandomString(16)
		let scope = 'playlist-modify-public'

		let args = new URLSearchParams({
			response_type: 'code',
			client_id: clientId,
			scope: scope,
			redirect_uri: redirectUri,
			state: state,
			code_challenge_method: 'S256',
			code_challenge: codeChallenge,
		})

		window.open('https://accounts.spotify.com/authorize?' + args, 'Log In with Spotify', 'width=800, height=600')
	})

	const urlParams = new URLSearchParams(window.location.search)
	let code = urlParams.get('code')

  localStorage.setItem('code_verifier', codeVerifier)


	let body = new URLSearchParams({
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: redirectUri,
		client_id: clientId,
		code_verifier: codeVerifier,
	})

	const response = fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body,
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('HTTP status ' + response.status)
			}
			return response.json()
		})
		.then((data) => {
			localStorage.setItem('access_token', data.access_token)
      console.log('access token obtained: ' + data.access_token)
		})
		.catch((error) => {
			console.error('Error:', error)
		})

	return response
}

async function getProfile() {
  let accessToken = localStorage.getItem('access_token');

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  const data = await response.json();
}

$(document).ready(() => {
  $('.spotifyLoginBtn').click( async () => {
    let res = await LogInToSpotify()
    await getProfile()
  })
  $('#setlistInfo').submit((event) => {
    event.preventDefault()
    $('#setlistInputBtn').prop("disabled", true)
    $('#setlistInputBtn').html(
      `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span class="visually-hidden">Loading...</span>
      `
    )

    let date = `${$('#dayInput').val()}-${$('#monthInput').val()}-${$('#yearInput').val()}`
    let city = $('#cityInput').val()
    let artist = $('#artistInput').val()

    //TODO: Add validation and sanitization function before GET request

    $.ajax({
      url: `http://localhost:${PORT}/setlistInfo/${date}/${city}/${artist}`,
      method: 'GET',
      success: (response) => {
        $('#setlistInputBtn').prop("disabled", false)
        $('#setlistInputBtn').html('GENERATE PLAYLIST')  
        if (response['data'][0] == 'error') {
          // popup saying CIK is bad
          console.log(`No setlist found for ${date} ${city} ${artist}`)
        }
        else if (response['data'][0] == 'OK') {
          //TODO: Start playing ad
          //TODO: Display setlist after ad ends.
        }
        else {
          console.log(response)
        }
      },
      error: (response) => {
        console.log(response)
      }
    })
    $('#companyFactsBtn').prop("disabled", false)
    $('#companyFactsBtn').html('Submit')
  })
})