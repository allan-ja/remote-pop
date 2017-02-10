$('#download-button').click(function(e) {
  var pathname = window.location.pathname.split('/');
  var movie = {title : 'Deadpool', pathname: pathname[2]};
  $.ajax({
  type: "POST",
  url: "/download",
  data: movie,
  success: alert("success345" + JSON.stringify(movie)),
  dataType: 'json'
});
});
