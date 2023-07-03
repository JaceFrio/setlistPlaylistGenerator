let access_token
let refresh_token
let userData

(function() {
  function getHashParams() {
    let hashParams = {}
    let e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1)
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2])
    }
    return hashParams
  }

  let params = getHashParams()
  console.log(params)

  access_token = params.access_token
  refresh_token = params.refresh_token

  // TODO: Add token caching for access_token and refresh_token
  if (access_token) {
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          console.log(response)
          userData = response
          $('.welcomeUser').text(`Welcome ${response.display_name}!`)
          $('#spotifyLoginBtn').text('LOG IN TO ANOTHER SPOTIFY ACCOUNT')
        },
        error: (err) => {
          console.log(err)
          $.ajax({
            url: '/refresh_token',
            data: {
              'refresh_token': refresh_token
            }
          }).done(function(data) {
            access_token = data.access_token
          })
        }
    })
  } 
  else {
    $('#spotifyLoginBtn').text('LOG IN TO SPOTIFY ACCOUNT')
  }
})()

function enableGeneratePlaylistBtn() {
  let btnEnabled = true
  if ($('#artistInput').val() == '') {
    btnEnabled = false
  }
  if ($('#cityInput').val() == '') {
    btnEnabled = false
  }
  if ($('#yearInput').val() == '') {
    btnEnabled = false
  }
  if (btnEnabled) {
    $("#setlistInputBtn").attr("disabled", false)
  }
  else {
    $("#setlistInputBtn").attr("disabled", true)
  }
}

$(document).ready(() => {
  $('.spotifyLoginBtn').click( async () => {
    window.location = 'http://localhost:8080/login'
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

    //TODO: Add validation and sanitization function before GET request also disable 
    // the "Generate Playlist" button until logged into Spotify and form is filled.

    $.ajax({
      url: `http://localhost:8080/setlistInfo/${date}/${city}/${artist}/${access_token}/${userData.id}`,
      method: 'GET',
      success: (response) => {
        $('#setlistInputBtn').prop("disabled", false)
        $('#setlistInputBtn').html('GENERATE ANOTHER PLAYLIST')  
        console.log(response[0])
      },
      error: (response) => {
        console.log(response)
      }
    })
    $('#companyFactsBtn').prop("disabled", false)
    $('#companyFactsBtn').html('Submit')
  })

  $('#yearInput').keyup(() => {
    enableGeneratePlaylistBtn()
  })
  $('#cityInput').keyup(() => {
    enableGeneratePlaylistBtn()
  })
  $('#artistInput').keyup(() => {
    enableGeneratePlaylistBtn()
  })
})

////////////////////////////////////////////////////////////////////////////////

// console.log('need to set up refresh_token code')
// $.ajax({
//   url: `http://localhost:8080/refresh_token?refresh_token=${refresh_token}`,
//   method: 'GET',
//   success: (response) => {
//     console.log(response)
//     $('.welcomeUser').text(`Welcome ${response.display_name}!`)
//     localStorage.setItem('access_token', access_token)
//     $('#spotifyLoginBtn').text('LOG IN TO ANOTHER SPOTIFY ACCOUNT')
//   },
//   error: (err) => {
//     console.log(err)
//   }
// })