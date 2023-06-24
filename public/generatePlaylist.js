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

  let access_token = params.access_token
  let refresh_token = params.refresh_token

  if (access_token) {
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          console.log(response)
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
            access_token = data.access_token;
          })
        }
    })
  } 
  else {
    $('#spotifyLoginBtn').text('LOG IN TO SPOTIFY ACCOUNT')
  }
})()

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

    //TODO: Add validation and sanitization function before GET request

    $.ajax({
      url: `http://localhost:8080/setlistInfo/${date}/${city}/${artist}`,
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