let RtmClient = require('@slack/client').RtmClient;
let CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
let moment = require('moment');
let request = require('request');

let botConfig = require('./config.js');
let reactions = require('./reactions.js');

let bot_token = botConfig.getToken() || '';
let myUserKey = 'U7QS9E8RY';

let rtm = new RtmClient(bot_token);

let meows = reactions.getReactions();
let numberOfMeows = 0;
let channel;
let generalChannelId = 'C4RUQDECW'; // ID:t för #general
let jpUtvecklingChannelId = 'C7RGH9LN5';

let postedFridayFrog = false;

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
      if (c.is_member && c.name ==='general') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
//   rtm.sendMessage('Autodeployed! Eller, jag har i alla fall startats om. Mjao.', jpUtvecklingChannelId);
  console.log('channel opened', channel);
});

rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, (event) => {
    event = JSON.parse(event);

    // Om ett meddelande skickas, oavsett kanal.
    if (event.type === 'message') {
        if (event.text && (event.text.includes(`<@${myUserKey}>`) || event.text.includes(`JP`))) {
            // let targetUser = '<@' +message.user+ '>';
            let meow = meows[Math.floor(Math.random()*meows.length)];
            let msg = meow;
            rtm.sendMessage(msg, event.channel);
        }
        else if (event.text.includes('bitcoin')) {
            request('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=SEK&apikey=ZBFWZJJKL5WA9XD0', (error, response, sekBody) => {
                if (response.statusCode === 200) {
                    let bitcoinSEK = JSON.parse(sekBody)['Realtime Currency Exchange Rate']['5. Exchange Rate'];
                    
                    request('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=ZBFWZJJKL5WA9XD0', (error, response, usdBody) => {
                        if (response.statusCode === 200) {
                            let bitcoinUSD = JSON.parse(usdBody)['Realtime Currency Exchange Rate']['5. Exchange Rate'];
                            // console.log('bitcoinSEK', bitcoinSEK['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                            rtm.sendMessage(`Bitcoin ligger just nu på *${numberParser(parseFloat(bitcoinSEK).toFixed(0))} kr*, eller *$${numberParser(parseFloat(bitcoinUSD).toFixed(2))}* om man är en Amerikatt. Ehm... mjao.`, event.channel);
                        }
                    });
                }
            });
        }
    }

    // Om "away" eller "active" (online) ändras
    if (event.type === 'presence_change') {

        // Messa #general ifall någon går online, med ett random mjao
        if (event.presence === 'active' && event.user != myUserKey) {
            if (numberOfMeows > 5) {
                let meow = meows[Math.floor(Math.random()*meows.length)];
                let msg = meow;
                rtm.sendMessage(msg, generalChannelId);
                numberOfMeows = 0;
            }
            else {
                numberOfMeows++;
            }
        }
    }

    // En slags ping/pong mellan server och bot. Kommer drygt varje sekund, men kan missas utifall andra event pågår.
    if (event.type === 'pong') {

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
});

// Lägg till tusen-separatorer, så det blir 160 000 istället för 160000.
function numberParser(nummer){
    var nummerRegex = /(\d+)(\d{3})/;
    return String(nummer).replace(/^\d+/, (w) => {
        while(nummerRegex.test(w)){
            w = w.replace(nummerRegex, '$1 $2');
        }
        return w;
    });
}

rtm.start();
