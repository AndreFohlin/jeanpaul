let RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
let CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
let moment = require('moment');

let botConfig = require('./config.js');
let jpFunctions = require('./functions.js');

jpFunctions.configureMoment();

let bot_token = botConfig.getToken() || '';
let myUserKey = 'U7QS9E8RY';

let rtm = new RtmClient(bot_token, { dataStore: new MemoryDataStore() });

let meows = jpFunctions.getReactions();
let numberOfMeows = 0;
let channel;
let generalChannelId = 'C4RUQDECW'; // ID:t för #general
let jpUtvecklingChannelId = 'C7RGH9LN5';

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
      if (c.is_member && c.name ==='general') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
    // rtm.sendMessage('Nu har jag startats om. Mjao.', jpUtvecklingChannelId);
    console.log('channel opened', channel);
});

rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, (event) => {
    event = JSON.parse(event);

    // Om ett meddelande skickas, oavsett kanal.
    if (event.type === 'message') {
        if (event.text && event.text[0] !== '!' && (event.text.includes(`<@${myUserKey}>`) || event.text.includes(`JP`) || event.text.includes(`jp`))) {
            // let targetUser = '<@' +message.user+ '>';
            jpFunctions.meow(rtm, event.channel);
        }
        else if (event.text) {
            if (event.text.includes('!bitcoin')) {
                jpFunctions.getBitcoinPrice(event, rtm);
            }
            else if (event.text.includes('!aktie')) {
                jpFunctions.searchStock(event, rtm);
            }
            else if (event.text.includes('!temp')) {
                jpFunctions.checkTemp(event, rtm);
            }
            else if (event.text.includes('!help')) {
                jpFunctions.sendHelp(event, rtm);
            }
            else if (event.text.includes('!prata')) {
                jpFunctions.speak(event, rtm, generalChannelId);
            }
            else if(event.text.includes('!väder')) {
                jpFunctions.getWeather(event, rtm);
            }
            else if(event.text.includes('!gif')) { // Get regular gif
                jpFunctions.getGif(event, rtm, false);
            }
            else if(event.text.includes('!gifr')) { // Gif Random
                jpFunctions.getGif(event, rtm, true);
            }
        }
    }

    // Om "away" eller "active" (online) ändras
    if (event.type === 'presence_change') {

        // Messa #general ifall någon går online, med ett random mjao
        if (event.presence === 'active' && event.user != myUserKey) {
            if (numberOfMeows > 5) {
                jpFunctions.meow(rtm, generalChannelId);
                numberOfMeows = 0;
            }
            else {
                numberOfMeows++;
            }
        }
    }

    // En slags ping/pong mellan server och bot. Kommer drygt varje sekund, men kan missas utifall andra event pågår.
    if (event.type === 'pong') {
        jpFunctions.timedPost(event, rtm, generalChannelId);
    }
});

rtm.start();
