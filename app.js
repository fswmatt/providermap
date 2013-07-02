
/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes')
	, user = require('./routes/user')
	, http = require('http')
	, path = require('path')
	, test = require('./tests/test')
	, api = require('./scripts/api')
	;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/', routes.index);
app.get('/', function(req, res) {
	res.sendfile("./public/html/location.html");
});
app.get('/test', test.test);

// the api
app.get('/api/v0.1/getRegions', api.getRegionList);
app.get('/api/v0.1/getProvidersInRegion/:region', api.getProvidersInRegion);
app.get('/api/v0.1/getProvidersInState/:state', api.getProvidersInState);
app.get('/api/v0.1/getProvidersInBox/:north/:west/:south/:east', api.getProvidersInBox);
app.get('/api/v0.1/getProviderData/:provider', api.getProviderData);
app.get('/api/v0.1/getProviderPricingInfo/:provider', api.getProviderPricingInfo);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
