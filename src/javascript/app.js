var $ = require('jquery');

$(function() {
  $('.summary-jump-button').off('click');
  $('.summary-jump-button').on('click', function(event) {
    $('html,body').animate({ scrollTop: $('.summary').position().top });
  });
  $('.feedback-jump-button').off('click');
  $('.feedback-jump-button').on('click', function(event) {
    $('html,body').animate({ scrollTop: $('#feedback-section').position().top });
  });
  $('.slideshow-link').on('click', function(event) {
    event.preventDefault();
    var linkId = $(this).data('link');
    if (typeof linkId === 'number') {
      window.location.href = '#' + linkId;

      $('html,body').animate({ scrollTop: $('#timeline-embed').position().top });
    }
  });
});
