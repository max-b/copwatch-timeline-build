var request = require('request');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var Twitter = require('twitter');
var Promise = require('promise');
var twitterCredentials = require('../twitter-credentials.js');

var client = new Twitter(twitterCredentials);

var staticUrl = 'images/';
var imageDir = __dirname + '/../downloaded/images/';

var downloadImage = function(uri, filename, callback, errorCallback){
  request.head(uri, function(err, res, body){
    var r = request(uri).pipe(fs.createWriteStream(filename));
    r.on('clientError', errorCallback);
    r.on('close', callback);
  });
};


module.exports = function(urlRequest) { 
  return new Promise(function(globalResolve, globalReject) {

    var firstPageText = fs.readFileSync('./src/templates/first-page-text.html', {
      encoding: 'utf8'
    });

    // TODO: Use real google api?
    request(urlRequest, function (error, response, body) {

      if (!error && response.statusCode == 200) {
        var responseObj = JSON.parse(body);

        var promises = [];

        _.each(responseObj.feed.entry, function(dateEntry) {
          promises.push(function() {
            return new Promise(function(resolve, reject) {
              try {
                var details = {};
                var event = {};
                var rawLinkString = dateEntry['gsx$link']['$t'];
                details.linkString = rawLinkString;
                var start_date = moment(new Date(dateEntry['gsx$date']['$t'] + ' ' + dateEntry['gsx$time']['$t']));
                if (start_date.isValid()) {
                  details.start_date_obj = start_date;
                  // TimelineJS has weird date requirements...
                  details.start_date = {
                    year: "" + start_date.year(),
                    month: "" + (start_date.month() + 1),
                    day: "" + start_date.day(),
                    hour: "" + start_date.hour(),
                    minute: "" + start_date.minute()
                  }
                }
                details.headline = dateEntry['gsx$title']['$t'];
                details.text = { headline: '<p>' + dateEntry['gsx$text']['$t'] + '</p>'};
                details.media = { caption: dateEntry['gsx$source']['$t'] };
                details.thumbnailUrl = dateEntry['gsx$thumbnail']['$t'];
                details.mediaType = dateEntry['gsx$mediatype']['$t'];

                if (details.mediaType === 'local_annotated') {
                  details.imgUrl = staticUrl + 'documents/' + rawLinkString;
                  details.thumbnailUrl = details.imgUrl;
                  details.linkString = details.imgUrl;
                  resolve(details);

                } else if (details.mediaType === 'image') {
                  details.imgUrl = rawLinkString;
                  details.thumbnailUrl = rawLinkString;
                  resolve(details);
                } else if (rawLinkString.match(/twitter\.com/)) {
                  var twitterPhotoRe = /\/photo\//;

                  if (rawLinkString.match(twitterPhotoRe)) {
                    splitArray = rawLinkString.split(twitterPhotoRe);
                    details.linkString = splitArray[0];
                    var twitterPhotoRe = /\/status\/([0-9a-zA-Z]+)\/photo\//;
                    var reObj = twitterPhotoRe.exec(rawLinkString);
                    thumbnail = 'https://pbs.twimg.com/media/' + reObj[1] + '.jpg';
                    var params = {
                      id: reObj[1]
                    };
                    client.get('statuses/show', params, function(error, tweet, response){
                      if(error) {
                        console.log(error);
                        reject(error);
                      }
                      details.imgUrl = tweet.entities.media[0].media_url;
                      details.text.headline += '<img src="' + details.imgUrl + '">';
                      resolve(details);
                    });
                  } else {
                    resolve(details);
                  }
                } else if (rawLinkString.match(/youtube\.com/)) {
                  var video_id = rawLinkString.split('v=')[1];
                  var ampersandPosition = video_id.indexOf('&');
                  if(ampersandPosition != -1) {
                    video_id = video_id.substring(0, ampersandPosition);
                  }
                  details.thumbnailUrl = 'http://img.youtube.com/vi/' + video_id + '/default.jpg';
                  resolve(details);

                } else {
                  resolve(details);
                }
              } catch (e) {
                console.log('rejecting with error: ' + e.stack);
                reject(e);
              }
            });
          }());
        });

        Promise.all(promises).done(function(dataArr) {
          // TODO: refactor this out into config
          var timelineObj = {
            timeline: {
              headline:"People's Investigation Dec. 6th",
              type:"default",
              events: [],
              title: {
                media: { url: staticUrl + "copwatch_logo.png" },
                text: firstPageText || "<h2>A People's Investigation into the events of the night of December 6th</h2>",
              },
            }
          };

          var imageDownloadPromises = [];
          _.each(dataArr, function(details) {

            imageDownloadPromises.push(function() {
              return new Promise(function(resolve, reject) {
                try {
                  if (typeof details.start_date === 'object') {
                    var event = {
                      start_date: details.start_date,
                      text: details.text,
                      media: { 
                        url: details.linkString || '',
                        caption: "",
                        credit: details.credit || '',
                      }
                    };

                    if (typeof details.mediaType === 'string' &&
                        details.mediaType === 'image' &&
                        typeof details.imgUrl === 'string' &&
                        details.imgUrl.trim() !== '') {

                      var filename = details.start_date_obj.format() + '-' + details.headline;
                      var extRegex = /[#\\?]/g; // regex of illegal extension characters
                      var extension = path.extname(details.imgUrl);
                      var endOfExt = extension.search(extRegex);
                      if (endOfExt > -1) {
                        extension = extname.substring(0, endOfExt);
                      }

                      filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // safe for filename
                      filename += extension;
                      var localFilename = imageDir + filename;
                      var publishFilename = staticUrl + filename;
                      // TODO: Check that we haven't already downloaded it?
                      downloadImage(details.imgUrl, localFilename, function() {
                        event.media = event.media || {};
                        event.media.url = publishFilename;
                        resolve(event);
                      }, function(error) {
                        console.log(error);
                        resolve(event);
                      });
                    } else {
                      resolve(event);
                    }
                  } else {
                    console.log(details.start_date);
                    reject('invalid Date');
                  }
                } catch (e) {
                  console.log('error: ' + e.stack);
                  reject(e);
                }
              });
            }());
          });

          Promise.all(imageDownloadPromises).done(function(events) {
            _.each(events, function(event) {
              timelineObj.timeline.events.push(event);
            });
            globalResolve(timelineObj);
          });
        });
      } else {
        console.log(error);
        console.log(response);
        throw ({error: error,  response: response})
      }
    });
  });
};
