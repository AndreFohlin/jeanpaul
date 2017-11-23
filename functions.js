let moment = require('moment');
let request = require('request');

let jpFunctions = require('./functions.js'); // Jag kan nog inte tillräckligt mycket om node. Men denna importerar sig själv :D

// Allmänna variabler
let postedFridayFrog = false;
let postedGoodMorning = false;

let lastBitcoinPrice = 0;
let lastBitcoinPriceCheck = moment();

let lastTemperature = 0;
let lastTemperatureCheck = moment();

exports.sendHelp = function(event, rtm) {
    let meow = jpFunctions.getMeow();
    rtm.sendMessage(`Detta kan du göra: *!temp* | *!väder* | *!aktie <aktienamn>* | *!bitcoin* | *!prata <#kanal> <meddelande> | *!gif <sökord> | !gifr <sökord> | ${meow}`, event.channel)
}

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
		':heart:',
		'Mrroau',
		':smiley_cat:',
		'Meow meoew MEOW maow',
		':tongue:',
		':tiger:',
		':tiger2:',
		':sparkling_heart:',
		':bill:',
        'Wubba lubba meow meow!',
        'meow',
        'Meow.',
        'Purrrrrrr..',
        'Meowsa!',
        'Mew'
	];
};

exports.getMeow = function() {
    let meows = jpFunctions.getReactions();
    let meow = meows[Math.floor(Math.random()*meows.length)];

    return meow;
}

exports.meow = function(rtm, channelId) {
    let meow = jpFunctions.getMeow();
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

exports.searchStock = function(event, rtm) {
    let aktie = event.text.replace('!aktie ', '');
    request(`https://finansportalen.services.six.se/finansportalen-web/rest/equity/quote/search?query=${aktie}`, (error, response, body) => {
        let meow = jpFunctions.getMeow();
        if (response.statusCode === 200) {
            body = JSON.parse(body);
            if(!body.instruments.length) {
                rtm.sendMessage(`Jag hittade ingen aktie med det namnet. ${meow}`, event.channel)
            }
            else if(body.instruments.length > 1) {
                let stocksFound = ''; 
                body.instruments.forEach(stock => {
                    stocksFound += `*${stock.longName.formatted}*, `;
                });
                rtm.sendMessage(`Jag hittade dessa: ${stocksFound}vilka av dem menade du? ${meow}`, event.channel);
            }
            else if (body.instruments.length === 1) {
                let stock = body.instruments[0];
                rtm.sendMessage(`*${stock.longName.formatted}* - Senaste pris (15 min fördröjt): *${stock.latestPrice.formatted}kr*, ${stock.percentageChangeToday.data > 0 ? '+' + stock.percentageChangeToday.formatted : stock.percentageChangeToday.formatted}%. ${meow}`, event.channel);
            }
            else {
                rtm.sendMessage(`Noooo, nåt gick fel. Kalla på min skötare! ${meow}`, event.channel);
            }
        }
    });
}

exports.timedPost = function(event, rtm, generalChannelId) {
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

    if (!postedGoodMorning) {
        if (moment().format('HH:mm') === '07:30') {
            jpFunctions.getWeather(event, rtm, true, generalChannelId);
            postedGoodMorning = true;
        }
        else {
            if (moment().format('HH:mm') !== '07:30') {
                postedGoodMorning = false;
            }
        }
    }
}

exports.checkTemp = function(event, rtm) {
    request(`http://www.temperatur.nu/internal_sign.php?stad=kungsholmen`, (error, response, body) => {
        let meow = jpFunctions.getMeow();
        let temp = body.split("<temp>").pop();
        temp = temp.split("</temp>").shift();
        if (!isNaN(temp) && !error) {
            if (lastTemperature) {
                let temperatureDifference = +(temp - lastTemperature).toFixed(2);
                let temperatureTimePassed = lastTemperatureCheck.fromNow();
                if (temperatureDifference === 0) {
                    rtm.sendMessage(`Det är just nu *${temp} °C* utomhus, vilket är samma temperatur som när jag kollade för ${temperatureTimePassed}. ${meow}`, event.channel);
                }
                else {
                    rtm.sendMessage(`Det är just nu *${temp} °C* utomhus, och det har ändrats med *${temperatureDifference} °C* sedan jag kollade för ${temperatureTimePassed}. ${meow}`, event.channel);
                }
            }
            else {
                rtm.sendMessage(`Det är just nu *${temp} °C* utomhus. ${meow}`, event.channel);
            }
            lastTemperature = temp;
            lastTemperatureCheck = moment();
        }
        else {
            rtm.sendMessage(`Det gick inte att kolla temperaturen ute just nu :sob: ${meow}`, event.channel);
        }

    });
}

/* Få JP att prata till en specifik kanal. Lämna allt tomt och kör bara !prata för att automatiskt mjaoa till #general.
* 
*  ex: !prata
*  eller
*  ex: !prata <kanal> <meddelande>
*/
exports.speak = function(event, rtm, generalChannelId) {
    
    // Remove with and without the space, to make sure the !prata is gone.
    let speak = event.text.replace('!prata', '');

    // Om man bara vill att JP ska köra sitt mjao-race, i #general
    if (speak === '' || speak === ' ') {
        jpFunctions.meow(rtm, generalChannelId);
    }
    else {
        let words = speak.split(' '); // Delar upp alla orden till en array.
        words.shift(); // Tar bort den första i arrayen, som alltid är ett endast mellanrum.

        // Om man har skrivit in en godkänd kanal, så ser det ut typ så här: <#C765S5ECW|aktier>
        if (words[0].indexOf('<#') > -1) {
            words[0] = words[0].replace('<#', '');
            let channel = words[0].split('|')[0];
            words.shift(); // Ta bort den första delen av arrayen igen, för då försvinner kanalnamnet som vi inte behöver. Eftersom vi extraherat kanal-id:t.

            if (words.length) {
                let sentence = words.join(' ');
                rtm.sendMessage(sentence, channel);
            }
            else {
                jpFunctions.meow(rtm, channel);
            }
        }
        else {
            let meow = jpFunctions.getMeow();
            rtm.sendMessage(`Försök inte lura mig gosse, jag bara riktiga kanaler tål! Försök igen, och glöm inte #. ${meow}`, event.channel);
        }
    }
}

exports.getWeather = function(event, rtm, godmorgon, generalChannelId) {
    let weather;
    let weatherUrl = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.071197/lat/59.32536/data.json`;

    let weatherSymbol = [
        'molnfritt',
        'nästan molnfritt',
        'växlande molnighet',
        'halvklart',
        'mestadels molnigt',
        'molnigt',
        'dimma',
        'lättare regnskurar',
        'regnskurar',
        'rejält med regn',
        'åska',
        'lättare snöblandat regn',
        'snöblandat regn',
        'rejält med snöblandat regn',
        'lättare snö',
        'snöfall',
        'rejält med snö',
        'lättare regnskurar',
        'regnskurar',
        'rejält med regn',
        'åska',
        'lättare snöblandat regn',
        'snöblandat regn',
        'rejält med snöblandat regn',
        'lättare snöfall',
        'snöfall',
        'rejält med snö'
    ];

    // First check current temperature
    request(`http://www.temperatur.nu/internal_sign.php?stad=kungsholmen`, (tempError, response, body) => {
        let meow = jpFunctions.getMeow();
        let temp = body.split("<temp>").pop();
        temp = temp.split("</temp>").shift();
        
        // Then check the weather prognosis.
        request(weatherUrl, (smhiError, response, body) => {
            let meow = jpFunctions.getMeow();
            let message = '';
            let temperatureMessage = '';
            let symbols = [];
            let nextSymbols = [];
            let temperature = [];
            let nextTemperature = [];
            let symbolMedian
            let nextSymbolMedian;

            if (smhiError) {
                rtm.sendMessage(`Nåt gick åt skogen när jag försökte hämta väderdata. ${meow}`, event.channel);
                return;
            }
            body = JSON.parse(body);
    
            for (i = 0; i < 12; i++) {
                // Get all the temperatures and push it into an array.
                let upcomingTemperature = body.timeSeries[i].parameters.find(parameter => {
                    return parameter.name === 't';
                });

                if (i < 6) {
                    symbols.push(body.timeSeries[i].parameters[18].values[0]);
                    temperature.push(upcomingTemperature.values[0]);
                }
                else {
                    nextSymbols.push(body.timeSeries[i].parameters[18].values[0]);
                    nextTemperature.push(upcomingTemperature.values[0]);
                }
            }
            // Sort temperatures so we can get the highest and lowest.
            temperature.sort((a, b) => a - b);
            nextTemperature.sort((a, b) => a - b);
            symbolMedian = findMedian(symbols);
            nextSymbolMedian = findMedian(nextSymbols);

            // Can has current temperature?
            if (!isNaN(temp)) {
                temperatureMessage = `Just nu är det *${temp} °C* ute.`;
                lastTemperature = temp;
                lastTemperatureCheck = moment();
            }

            if (godmorgon) {
                message += `God morgon mina bekanta! ${temperatureMessage} På förmiddagen blir det mellan *${temperature[0]} °C* till *${temperature[temperature.length - 1]} °C* och överlag *${weatherSymbol[symbolMedian - 1]}*. På eftermiddagen blir det *${nextTemperature[0]} °C* till *${nextTemperature[nextTemperature.length - 1]} °C* och *${weatherSymbol[nextSymbolMedian - 1]}*. ${meow}`;
                rtm.sendMessage(message, generalChannelId);
            }
            else {
                message += `${temperatureMessage} De kommande 6 timmarna blir det mellan *${temperature[0]} °C* till *${temperature[temperature.length - 1]} °C* och överlag *${weatherSymbol[symbolMedian - 1]}*. Sen blir det *${nextTemperature[0]} °C* till *${nextTemperature[nextTemperature.length - 1]} °C* och *${weatherSymbol[nextSymbolMedian - 1]}*. ${meow}`;
                rtm.sendMessage(message, event.channel);
            }

        });
    });    
}

exports.getGif = function(event, rtm, getRandom) {
    let url = 'http://api.giphy.com/v1/gifs';
    let key = 'mcARlUwzVuaAZ9d0SNRLLnLlp4aVIHHQ';
    if (getRandom) {
        let gif = event.text.replace('!gifr', '');
        gif = encodeURI(gif);
        request(`${url}/random?tag=${gif}&api_key=${key}`, (error, response, body) => {
            if (error) {
                rtm.sendMessage('Det där gick åt katten. Meow. Något gick verkligen snett. :( ', event.channel);
                return;
            }
            body = JSON.parse(body);
            rtm.sendMessage(body.data.image_url, event.channel);
        });
    }
    else {
        let gif = event.text.replace('!gif', '');
        gif = encodeURI(gif);
        request(`${url}/search?q=${gif}&api_key=${key}&limit=1`, (error, response, body) => {
            if (error) {
                rtm.sendMessage('Det där gick åt katten. Meow. Något gick verkligen snett. :( ', event.channel);
                return;
            }
            body = JSON.parse(body);
            rtm.sendMessage(body.data[0].images.original.url, event.channel);
        });
    }
}

/*
* Hämta kanal-informationen som ett objekt med hjälp av namnet som en string.
* ex: jpFunctions.getChannelEntity('#general', rtm);
*/
exports.getChannelEntity = function(channel, rtm) {
    channel = channel.replace(/^#/, '');
    return rtm.dataStore.getChannelByName(channel) || rtm.dataStore.getGroupByName(channel);
}

// Hitta medianen av en array av siffror.
function findMedian(values) {
    values.sort((a, b) => {
        return a - b;
    });
    
    let half = Math.floor(values.length/2);

    if(values.length % 2) {
        return values[half];
    }
    else {
        return (values[half - 1] + values[half]) / 2.0;
    }
}
