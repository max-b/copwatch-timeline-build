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

var downloadImage = function(uri, filename, callback){

  request.head(uri, function(err, res, body){

    var r = request(uri).pipe(fs.createWriteStream(filename));
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

        _.each(responseObj.feed.entry, function(event) {
          promises.push(function() {
            return new Promise(function(resolve, reject) {
              try {
                var details = {};
                var date = {};
                var rawLinkString = event['gsx$link']['$t'];
                details.linkString = rawLinkString;
                details.startDate = moment(new Date(event['gsx$date']['$t'] + ' ' + event['gsx$time']['$t']));
                details.headline = event['gsx$title']['$t'];
                details.text = '<p>' + event['gsx$text']['$t'] + '</p>';
                details.caption = event['gsx$source']['$t'];
                details.thumbnailUrl = event['gsx$thumbnail']['$t'];
                details.mediaType = event['gsx$mediatype']['$t'];

                if (details.mediaType === 'image') {
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
                      details.text += '<img src="' + details.imgUrl + '">';
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

        Promise.all(promises).then(function(dataArr) {
          // TODO: refactor this out into config
          var timelineObj = {
            timeline: {
              headline:"People's Investigation Dec. 6th",
              type:"default",
              text: firstPageText || "<h2>A People's Investigation into the events of the night of December 6th</h2>",
              date: [],
              asset: {
                  media:"images/copwatch_logo.png",
                  credit:"",
                  caption:""
              },
            }
          };

          var imageDownloadPromises = [];
          _.each(dataArr, function(details) {

            imageDownloadPromises.push(function() {
              return new Promise(function(resolve, reject) {
                try {
                  if (details.startDate.isValid()) {
                    var date = {
                      startDate: details.startDate.format(),
                      headline: details.headline,
                      text: details.text,
                      asset: {
                        media: details.linkString || '',
                        thumbnail: details.imgUrl || details.thumbnailUrl || '',
                        credit: details.credit || '',
                        caption: ""
                      }
                    };

                    if (typeof details.mediaType === 'string' &&
                        details.mediaType === 'image' &&
                        typeof details.imgUrl === 'string' &&
                        details.imgUrl.trim() !== '') {

                      var filename = details.startDate.format() + '-' + details.headline;
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
                      downloadImage(details.imgUrl, localFilename, function() {
                        date.asset.media = publishFilename;
                        date.asset.thumbnail = publishFilename;
                        resolve(date);
                      });
                    } else {
                      resolve(date);
                    }
                  }
                } catch (e) {
                  console.log('error: ' + e.stack);
                }
              });
            }());
          });

          Promise.all(imageDownloadPromises).then(function(dates) {
            _.each(dates, function(date) {
              timelineObj.timeline.date.push(date);
            });
            globalResolve(timelineObj);
          });
        });
      } else {
        console.log('error?');
      }
    });
  });
};
