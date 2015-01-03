# Wraith
A responsive screenshot comparison tool. It can be used for regression testing or cross browser testing

Based on the Ruby version available at [http://github.com/BBC-News/wraith](http://github.com/BBC-News/wraith)

## CLI app

### Install

```
	npm install -g wraith
```

###Usage

	Usage:
	wraith --config <config>

	Options:
	-h, --help				Output help information
	-v, --version			Output version information
	-c, --config [config]	Specify the location of the configuration file
	-q, --quiet				All logging is hidden

	Examples:
	wraith --config ./config/chrome

### Configuration file

Wraith uses a json based configuration file that allows you specify a large number of options. You can create as many configurations files as you need and call them from the cli using the --config flag.

Below is an example configuration file:

	{
		Optional name for the project, if supplied it will be used within the generated gallery only
		"project": "Test",

		Specify one or two domains
		"domains": [
			"http://www.bbc.co.uk",
			"http://live.bbc.co.uk"
		],

		Engines supported are phantomjs and slimerjs but in theory any phantomjs based headless browser can be supported.

		To do cross browser testing specify one domain and two engines or your choice
		"engines": [
			"phantomjs"
		],

		Specify as many sizes as you wish. If no sizes are specified then the most popular sizes will be used based on the information provided by w3counter.com stats
		"sizes": [
			"320",
			"768",
			"1440"
		],

		Output directory within the /shots directory
		"outputDir": "test/chrome/",

		You can specify a list of paths to be used or you can crawl the site.

		Note: If paths are provided they will take precedent and the spider file will be ignored.

		"paths": [
			"/",
			"/news/",
			"/news/local/",
			"/news/england/york_and_north_yorkshire/",
			"/weather/"
		],

		If no paths are specified then a site crawl will take place and the results will be save in the location specified within this option
		"spider": "spider/test.txt",

		Limit the amount of concurrent processes
		"maxConnections": 20
	}

###API
This is very basic at the minute but you can use wraith within your applications. At the minute there is only one option which is to run the application with a given config file and then run a specified callback but I am looking to expand this in the future.

	var wraith = require('wraith');
	var config = require('./config/chrome');

	new Wraith(config, function() {
		console.log('Callback, do something else here!');
	});

	As the config is just an object you can change it at any point before calling the wraith function e.g.

	config.maxConnections = 10;
	config.quiet = true;

	new Wraith(config, function() {
		console.log('Callback, do something else here!');
	});

## License

MIT © [James Bell](http://james-bell.co.uk)
