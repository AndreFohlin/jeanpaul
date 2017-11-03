let moment = require('moment');
let request = require('request');
let jpFunctions = require('./functions.js'); // Jepp, jag kan nog inte tillräckligt mycket om node. Men denna importerar sig själv :D

let postedFridayFrog = false;

let lastBitcoinPrice = 0;
let lastBitcoinPriceCheck = moment();

exports.configureMoment = function() {
    moment.updateLocale('en', {
        relativeTime : {
            future: "om %s",
            past: "%s sedan",
            s: 'ett par sekunder',
            ss: '%d sekunder',
            m:  "en minut",
            mm: "%d minuter",
            h:  "en timme",
            hh: "%d timmar",
            d:  "en dag",
            dd: "%d dagar",
            M:  "en månad",
            MM: "%d månader",
            y:  "ett år",
            yy: "%d år"
        }
    });
}

exports.getReactions = function() {
	return [
		'Meow',
		'Mjaeowo',
		'..............',
		'Mjawwarw',
		'Rrrrrrrrrrrr',
		'* Attacks random body part *',
		':jpa:',
		':scream_cat:',
		':doge::gun:',
		':cat:',
		':cat2:',
		':kan:',
		'mjao?',
		'MJAO!',
		'Mjaoooo :heart_eyes_cat:',
		':pouting_cat: :fish:',
		'<3',
		'Mrroau',
		':smiley_cat:',
		'Meow meoew meOW maow',
		':tongue:',
		':tiger:',
		':tiger2:',
		':sparkling_heart:',
		':bill:',
		'Wubba lubba meow meow!'
	];
};

exports.meow = function(rtm, channelId) {
    let meows = jpFunctions.getReactions();
    let meow = meows[Math.floor(Math.random()*meows.length)];
    rtm.sendMessage(meow, channelId);
}

// Lägg till tusen-separatorer, så det blir 160 000 istället för 160000.
exports.numberParser = function(nummer) {
    var nummerRegex = /(\d+)(\d{3})/;
    return String(nummer).replace(/^\d+/, (w) => {
        while(nummerRegex.test(w)){
            w = w.replace(nummerRegex, '$1 $2');
        }
        return w;
    });
}

exports.getBitcoinPrice = function(event, rtm) {
    request('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=SEK&apikey=ZBFWZJJKL5WA9XD0', (error, response, sekBody) => {
        if (response.statusCode === 200) {
            let bitcoinSEK = JSON.parse(sekBody)['Realtime Currency Exchange Rate']['5. Exchange Rate'];
            
            request('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=ZBFWZJJKL5WA9XD0', (error, response, usdBody) => {
                if (response.statusCode === 200) {
                    let bitcoinUSD = JSON.parse(usdBody)['Realtime Currency Exchange Rate']['5. Exchange Rate'];

                    // Visar även den procentuella ändringen, utifall JP har kollat kurserna tidigare.
                    if (lastBitcoinPrice) {
                        let bitcoinDifference = bitcoinUSD / lastBitcoinPrice - 1;
                        let bitcoinTimePassed = lastBitcoinPriceCheck.fromNow();
                        rtm.sendMessage(`Bitcoin har ändrats med *${(bitcoinDifference * 100).toFixed(2)}%* sedan jag kollade för ${bitcoinTimePassed} och kostar nu *${jpFunctions.numberParser(parseFloat(bitcoinSEK).toFixed(0))} kr*, eller *$${jpFunctions.numberParser(parseFloat(bitcoinUSD).toFixed(2))}* om man är en Amerikatt.`, event.channel);
                    }
                    else {
                        rtm.sendMessage(`Bitcoin kostar just nu *${jpFunctions.numberParser(parseFloat(bitcoinSEK).toFixed(0))} kr*, eller *$${jpFunctions.numberParser(parseFloat(bitcoinUSD).toFixed(2))}* om man är en Amerikatt. Ehm... mjao.`, event.channel);
                    }

                    lastBitcoinPrice = bitcoinUSD;
                    lastBitcoinPriceCheck = moment();
                }
                else {
                    rtm.sendMessage('Det gick inte att hämta bitcoin-kurserna... Meow :(', event.channel);
                }

            });
        }
        else {
            rtm.sendMessage('Det gick inte att hämta bitcoin-kurserna... Meow :(', event.channel);
        }
    });
}

exports.searchStock = function(event, rtm, aktie) {
    request(`https://finansportalen.services.six.se/finansportalen-web/rest/equity/quote/search?query=${aktie}`, (error, response, body) => {
        if (response.statusCode === 200) {
            body = JSON.parse(body);
            if(!body.instruments.length) {
                rtm.sendMessage('Jag hittade ingen aktie med det namnet.', event.channel)
            }
            else if(body.instruments.length > 1) {
                let stocksFound = ''; 
                body.instruments.forEach(stock => {
                    stocksFound += `*${stock.longName.formatted}*, `;
                });
                rtm.sendMessage(`Jag hittade dessa: ${stocksFound}vilka av dem menade du?`, event.channel);
            }
            else if (body.instruments.length === 1) {
                let stock = body.instruments[0];
                rtm.sendMessage(`*${stock.longName.formatted}* - Senaste pris: *${stock.latestPrice.formatted}kr*, ${stock.percentageChangeToday.data > 0 ? '+' + stock.percentageChangeToday.formatted : stock.percentageChangeToday.formatted}%`, event.channel);
            }
            else {
                rtm.sendMessage(`Noooo, nåt gick fel. Kalla på min skötare! Meow.`, event.channel);
            }
        }
    });
}

exports.postFrog = function(rtm, generalChannelId) {
    // Posta fredagsgrodan, exakt klockan 08:07 på fredagar
    if (!postedFridayFrog) {
        if (moment().format('dddd HH:mm') === 'Friday 08:07') { 
            rtm.sendMessage('https://i.imgur.com/ORDvwi9.jpg', generalChannelId);
            postedFridayFrog = true;
        }
    }
    else {
        if (moment().format('dddd') !== 'Friday') {
            postedFridayFrog = false; // Reset fridayfrog
        }
    }
}
