var request = require('request');
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var Twitter = require('twitter');
var Promise = require('promise');
var twitterCredentials = require('../twitter-credentials.js');

var client = new Twitter(twitterCredentials);

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
                    // console.log(reObj[1]);
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
                    //console.log('resolving...');
                    //console.log(details);
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
                  //console.log('resolving...');
                  //console.log(details);
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

          // console.log('then');
          // console.log(JSON.stringify(dataArr));
          _.each(dataArr, function(details) {
            try {
              // console.log(details);
              if (details.startDate.isValid()) {
                date = {
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
                // console.log('timeline obj:');
                // console.log(timelineObj);
                timelineObj.timeline.date.push(date);
              }
            } catch (e) {
              console.log(e);
            }
          });

          // console.log('returning:');
          // console.log(JSON.stringify(timelineObj));
          globalResolve(timelineObj);
          // fs.writeFile('timeline_data.json', JSON.stringify(timelineObj))
        });
      } else {
        console.log('error?');
      }
    });
  });
};
