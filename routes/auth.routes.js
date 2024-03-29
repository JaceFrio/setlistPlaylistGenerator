const express = require('express')
const querystring = require('querystring')
const request = require('request')
const config = require('../config/config')

const router = express.Router()

module.exports = router

var client_id = config.CLIENT_ID
var client_secret = config.CLIENT_SECRET
var redirect_uri = config.REDIRECTURI

function generateRandomString(length) {
	var text = ''
	var possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

var stateKey = 'spotify_auth_state'

router.get('/login', function (req, res) {
	var state = generateRandomString(16)
	res.cookie(stateKey, state)

	// your application requests authorization
	const scope = `user-top-read
                 user-read-private
                 playlist-modify-public`

	res.redirect(
		'https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: client_id,
				scope: scope,
				redirect_uri: redirect_uri,
				state: state,
				show_dialog: true,
			})
	)
})

router.get('/refresh_token', function (req, res) {
	// requesting access token from refresh token
	var refresh_token = req.query.refresh_token
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: {
			Authorization:
				'Basic ' +
				new Buffer(client_id + ':' + client_secret).toString('base64'),
		},
		form: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token,
		},
		json: true,
	}

	request.post(authOptions, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token
			res.send({
				access_token: access_token,
			})
		}
	})
})

router.get('/callback', function (req, res) {
	// your application requests refresh and access tokens
	// after checking the state parameter

	var code = req.query.code || null
	var state = req.query.state || null
	var storedState = req.cookies ? req.cookies[stateKey] : null

	if (state === null || state !== storedState) {
		res.redirect(
			'/#' +
				querystring.stringify({
					error: 'state_mismatch',
				})
		)
	} else {
		res.clearCookie(stateKey)
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code',
			},
			headers: {
				Authorization:
					'Basic ' +
					new Buffer(client_id + ':' + client_secret).toString('base64'),
			},
			json: true,
		}

		request.post(authOptions, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				var access_token = body.access_token,
					refresh_token = body.refresh_token

				var options = {
					url: 'https://api.spotify.com/v1/me',
					headers: { Authorization: 'Bearer ' + access_token },
					json: true,
				}

				// use the access token to access the Spotify Web API
				request.get(options, function (error, response, body) {
					console.log(body)
				})

				// we can also pass the token to the browser to make requests from there
				res.redirect(
					'http://localhost:8080/generatePlaylist.html#' +
						querystring.stringify({
							access_token: access_token,
							refresh_token: refresh_token,
						})
				)
			} else {
				res.redirect(
					'http://localhost:8080/generatePlaylist.html#' +
						querystring.stringify({
							error: 'invalid_token',
						})
				)
			}
		})
	}
})
