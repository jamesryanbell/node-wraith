var system = require('system');
var page = require('webpage').create();
var fs = require('fs');

var url = system.args[1],
    view_port_width = system.args[2],
    image_name = system.args[3],
    useragent = system.args[4],
    current_requests = 0,
    last_request_timeout = null,
    final_timeout = null;

page.viewportSize = { width: view_port_width, height: 2000};
page.settings = { loadImages: true, javascriptEnabled: true };

// If you want to use additional phantomjs commands, place them here
if( useragent !== '' ) {
  page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.17';
}

// You can place custom headers here, example below.
// page.customHeaders = {

//      'X-Candy-OVERRIDE': 'https://api.live.bbc.co.uk/'

//  };

// If you want to set a cookie, just add your details below in the following way.

// phantom.addCookie({
//     'name': 'ckns_policy',
//     'value': '111',
//     'domain': '.bbc.co.uk'
// });
// phantom.addCookie({
//     'name': 'locserv',
//     'value': '1#l1#i=6691484:n=Oxford+Circus:h=e@w1#i=8:p=London@d1#1=l:2=e:3=e:4=2@n1#r=40',
//     'domain': '.bbc.co.uk'
// });

page.onResourceRequested = function(req) {
  current_requests += 1;
};

//TrifleJS doesn't support onResourceRequested and onResourceReceived yet so we can only fire based on onLoadFinished
page.onLoadFinished = function(status) {
  if (status == 'success') {
    current_requests -= 1;
    debounced_render();
  }
};

//SlimerJS or PhantomJS
page.onResourceReceived = function(res) {
  if (res.stage === 'end') {
    current_requests -= 1;
    debounced_render();
  }
};

page.open(url, function(status) {
  if (status !== 'success') {
    console.log('Error with page ' + url);
    phantom.exit();
  }
});


function debounced_render() {
  clearTimeout(last_request_timeout);
  clearTimeout(final_timeout);

  // If there's no more ongoing resource requests, wait for 1 second before
  // rendering, just in case the page kicks off another request
  if (current_requests < 1) {
      clearTimeout(final_timeout);
      last_request_timeout = setTimeout(function() {
          console.log('Snapping ' + url + ' at width ' + view_port_width);
          page.render(image_name);
          phantom.exit();
      }, 1000);
  }

  // Sometimes, straggling requests never make it back, in which
  // case, timeout after 5 seconds and render the page anyway
  final_timeout = setTimeout(function() {
    console.log('Snapping ' + url + ' at width ' + view_port_width);
    page.render(image_name);
    phantom.exit();
  }, 5000);
}