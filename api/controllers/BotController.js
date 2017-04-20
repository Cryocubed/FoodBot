/**
 * BotController
 *
 * @description :: Server-side logic for managing bots
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request');
var HTTPS = require('https');

module.exports = {

	'callBot': function(req, res) {
		// This function wraps together all parts of the food bot. Calls each subprocess.
		
		// Packages data to send to subprocesses
		var msgData = req.body;
		
		// Each process goes here
		// TODO: Convert to Ajax requests
		returnServeryInfo(msgData);
		
		
		res.status()
	}
};

function returnServeryInfo(msgData) {
	// Settings:
	// -----------------
	var formatStyle = 1; // 0=paragraph, 1=bullet
	var botIdentifier = "!"; // Character to have bot process info
	// -----------------
	
	// Process incoming message
	var msg = msgData.text;

	// Initialize vars
	var requestedServeries = {
		south: {
			apiListing: "South",
			identifier: ["south"],
			requested: false
		},
		north: {
			apiListing: "North",
			identifier: ["north"],
			requested: false
		},
		west: {
			apiListing: "West",
			identifier: ["west"],
			requested: false
		},
		baker: {
			apiListing: "Baker",
			identifier: ["baker"],
			requested: false
		},
		seibel: {
			apiListing: "Seibel",
			identifier: ["seibel", "soybell"],
			requested: false
		},
		sid: {
			apiListing: "SidRich",
			identifier: ["sid"],
			requested: false
		}
	};
	var sendMessage = false;

	// Only process request if not from food bot, and includes !
	if (!msgData.name.toLowerCase().includes("food bot") && msg.toLowerCase().includes(botIdentifier)) {

		// For each servery in list, scan the message for the identifiers. If an identifier matches, log and update requested
		for (var currServ in requestedServeries) {
			for (i = 0; i < requestedServeries[currServ].identifier.length; i++) {
				if (msg.toLowerCase().includes(requestedServeries[currServ].identifier[i])) {
					requestedServeries[currServ].requested = true;
					sendMessage = true;
				}
			}
		}
	}

	if (sendMessage) {
		// Contact FoodController, asking for api data
		sails.request("/fetchData", function(error, response, html) {

			// Initialize vars
			var fullMessage = "";

			// Set foodData to received json
			foodData = response.body;

			// Paragraph style
			if (formatStyle === 0) {
				// Run through every servery, and if it was requested, add data to message
				for (var currServ in requestedServeries) {
					if (requestedServeries[currServ].requested) {

						// Generate message to send for this servery
						fullMessage = fullMessage + "At " + capitalizeFirstLetter(requestedServeries[currServ].identifier[0]) + ", there is "

						// Add every menu item in
						for (i = 0; i < foodData[requestedServeries[currServ].apiListing].length; i++) {
							fullMessage = fullMessage + foodData[requestedServeries[currServ].apiListing][i] + ", "
						}

						// Add in seperater
						fullMessage = fullMessage + ". \n--------\n";
					}
				}
				// Regex cleanup
				fullMessage = fullMessage.replace(RegExp(/, \./, 'g'), "."); // Remove , . instances
				fullMessage = fullMessage.slice(0, -9); // Get rid of last ----
				fullMessage = fullMessage.replace(RegExp(/(, )(?=[^,]+\.)/, 'g'), ", and "); // Add an and after the last comma
			}

			// Bullet style
			if (formatStyle === 1) {
				for (var currServ in requestedServeries) {
					if (requestedServeries[currServ].requested) {

						// Generate message to send for this servery
						fullMessage = fullMessage + capitalizeFirstLetter(requestedServeries[currServ].identifier[0]) + ":\n"

						// Add every menu item in
						for (i = 0; i < foodData[requestedServeries[currServ].apiListing].length; i++) {
							fullMessage = fullMessage + "-" + foodData[requestedServeries[currServ].apiListing][i]
							if (i !== (foodData[requestedServeries[currServ].apiListing].length - 1)) {
								fullMessage = fullMessage + "\n";
							}
						}

						// Add in seperater
						fullMessage = fullMessage + "\n--------\n";

					}
				}
				// Regex cleanup
				fullMessage = fullMessage.slice(0, -9); // Get rid of last ----
			}

			// Build and send message
			sendBotMessage(fullMessage);
		})
	}
}

function sendBotMessage(textToSend) {
	var options, body, botReq;
	options = {
		hostname: 'api.groupme.com',
		path: '/v3/bots/post',
		method: 'POST'
	};
	body = {
		"bot_id": sails.config.groupme.botID,
		"text": textToSend
	};
	botReq = HTTPS.request(options, function(res) {
		if (res.statusCode == 202) {
			//Complete
		} else {
			console.log('rejecting bad status code ' + res.statusCode);
		}
	});
	botReq.on('error', function(err) {
		console.log('error posting message ' + JSON.stringify(err));
	});
	botReq.on('timeout', function(err) {
		console.log('timeout posting message ' + JSON.stringify(err));
	});
	botReq.end(JSON.stringify(body));
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}