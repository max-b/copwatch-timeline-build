var $ = require('jquery');

$(function() {
  $('.slideshow-link').on('click', function(event) {
    event.preventDefault();
    var linkId = $(this).data('link');
    if (typeof linkId === 'number') {
      window.location.href = '#' + linkId;

      $('html,body').animate({ scrollTop: $('#timeline-embed').position().top });
    }
  });
});
