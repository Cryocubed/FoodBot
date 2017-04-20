/**
 * FoodController
 *
 * @description :: Server-side logic for managing foods
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

module.exports = {


	// Gets food data from http://dining.rice.edu/ and returns as JSON
	'pullData': function(req, res) {
		//console.log('FoodController: API Data requested')

		var url = 'http://dining.rice.edu/';

		request(url, function(error, response, html) {
			if (!error) {
				var $ = cheerio.load(html);

				var jsonData = {
					"South": [],
					"North": [],
					"West": [],
					"Baker": [],
					"Seibel": [],
					"SidRich": []
				}

				// Iterates through every servery, where currServ is the actual name of the servery, not the ID
				for (var currServ in jsonData) {
					var numItems = $('#' + currServ).parent().find('ul :not(:last-child) .menu-item').length

					// For each servery, use numItems to set array
					for (i = 0; i < numItems; i++) {
						jsonData[currServ][i] = $('#' + currServ).parent().find('ul :not(:last-child) .menu-item').eq(i).text()
					}
				}
				res.json(jsonData)
			}
		})

	},

	'foodWebPage': function(req, res) {
		
		sails.request("/fetchData", function(error, response, html) {
			// Set foodData to received json
			foodData = response.body;
			
			res.view('homepage.ejs',foodData)
		});
		
	}
};