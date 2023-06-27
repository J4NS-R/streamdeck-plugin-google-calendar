/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const BLEEDOVER_TIME_MS = 5 * 60 * 1000;  // 5 mins
const REFRESH_TIME_MS = 60 * 1000; // every min

const myAction = new Action('za.co.rauten.gcal.action.nextmeet');

// dirty globals
let pluginSettings = null;
let pluginInterval = null;
//


myAction.onWillAppear(({context, payload}) => {
	pluginSettings = payload.settings;
	console.log('Settings: ' + JSON.stringify(pluginSettings));

	if (pluginInterval === null){
		pluginInterval = setInterval(() => dala(context), REFRESH_TIME_MS);
	}
	dala(context);
});

myAction.onWillDisappear(() => {
	if (pluginInterval !== null){
		clearInterval(pluginInterval);
		pluginInterval = null;
	}
})


myAction.onKeyUp(({ action, context, device, event, payload }) => {
	console.log('Key pressed.');
	dala(context);
});

function dala(context){
	getNextEvent().then(event => {
		displayImageWithText(context, event.eventName, calcTimeLeft(event.startTime));
	});
}

async function getNextEvent(){
	const rightNowMs = new Date().getTime();

	const resp = await new Promise((resolve, reject) => {
		const http = new XMLHttpRequest();
		const target = new URL(pluginSettings.url_events);
		target.search = new URLSearchParams({
			maxResults: 8,
			singleEvents: true,
			orderBy: 'startTime',
			timeMin: new Date().toISOString(),
		});
		// setup onload
		http.onload = () => {
			resolve(JSON.parse(http.responseText));
		};
		http.onerror = (e) => {
			reject({error: e})
		}
		// fire!
		http.open('GET', target.toString());
		http.setRequestHeader("Authorization", "Basic " +
			btoa(pluginSettings.basic_user+":"+pluginSettings.basic_password));
		http.send();
	});
	console.log('resp', resp);

	let startTime = null;
	let eventName = null;
	for (const event of resp['items']){
		if (!event['start'] || !event['start']['dateTime']){ // ignore events that don't have a start.dateTime (eg all day events)
			continue;
		}

		startTime = new Date(event['start']['dateTime']);
		// must be 5 mins in the past or later.
		if (startTime.getTime() < rightNowMs - BLEEDOVER_TIME_MS){
			continue;
		}
		eventName = event['summary'];
		break;
	}
	if (startTime === null || eventName === null){
		console.error("Failed to find a good event in event list!");
		return null;
	}

	console.log('Next event is '+eventName+' at '+startTime.toISOString());
	return {
		startTime,
		eventName,
	};
}

// utils

async function createCanvasFromImage(url) {

	return await new Promise((resolve) => {
		var img = new Image();
		img.setAttribute('crossOrigin', 'anonymous');

		img.onload = function () {
			var canvas = document.createElement("canvas");
			canvas.width =this.width;
			canvas.height =this.height;

			var ctx = canvas.getContext("2d");
			ctx.drawImage(this, 0, 0);

			// var dataURL = canvas.toDataURL("image/png");

			resolve(canvas);
		};

		img.src = url;
	});
}

async function displayImageWithText(sdContext, eventName, timeLeft){
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 256;

	const ctx = canvas.getContext("2d");
	// Write main text
	let textSize = Math.trunc(canvas.height / 5);
	ctx.font = textSize+"px sans-serif";
	ctx.textAlign = "center";
	ctx.fillStyle = 'white';
	const mid_x = Math.trunc(canvas.width / 2);
	const y_step = Math.trunc(canvas.height * 0.2);
	let y = y_step;

	for (const line of splitTextForImg(eventName)){
		ctx.fillText(line, mid_x, y, canvas.width);
		y += y_step;
	}

	// Write label
	textSize = canvas.height / 6;
	ctx.font = "bold "+textSize+"px sans-serif";
	ctx.fillText(timeLeft, mid_x, canvas.height-textSize-2, canvas.width);

	const data = canvas.toDataURL("image/png");
	$SD.setImage(sdContext, data);
}

function splitTextForImg(text){
	const maxCharsPerLine = 14;
	const maxLines = 3;

	// construct list
	let output = [text.substring(0, maxCharsPerLine),];
	for(let i = maxCharsPerLine; i < text.length && output.length < maxLines; i+= maxCharsPerLine){
		output.push(text.substring(i, i+maxCharsPerLine));
	}

	// replace ellipsis if necessary
	const lastLine = output[output.length-1];
	if (lastLine.length === maxCharsPerLine){
		output[output.length-1] = lastLine.substring(0, maxCharsPerLine-1)+ '…';
	}

	return output;
}

function calcTimeLeft(dt){
	const diff_ms = dt.getTime() - new Date().getTime();
	if (diff_ms < 0){
		return "Now";
	}

	const diff_mins = Math.round(diff_ms / 1000 / 60);
	const h = Math.trunc(diff_mins / 60);
	const m = diff_mins % 60;

	let output = '';
	if (h > 0){
		output += h + 'h ';
	}
	return output + m + 'm';
}

