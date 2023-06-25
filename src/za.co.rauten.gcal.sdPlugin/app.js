/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

const myAction = new Action('za.co.rauten.gcal.action');

// dirty globals
let pluginSettings = null;
//


myAction.onWillAppear(({context, payload}) => {
	pluginSettings = payload.settings;
	$SD.logMessage('Settings: ' + JSON.stringify(pluginSettings));

});


myAction.onKeyUp(({ action, context, device, event, payload }) => {
	console.log('Key pressed.');

});
