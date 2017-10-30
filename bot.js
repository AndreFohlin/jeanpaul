var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var botConfig = require('./config.js');
 
var bot_token = botConfig.getToken() || '';
var myUserKey = '<@U7QS9E8RY>';

var rtm = new RtmClient(bot_token);

var meows = ['Meow', 'Mjaeowo', '..............', 'Mjawwarw', 'Rrrrrrrrrrrr', '*Attacks random body part*'];
let channel;
 
// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
      if (c.is_member && c.name ==='general') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});
 
// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  //rtm.sendMessage("Meow!", channel);
  console.log('channel opened', channel);
});

rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, function(message) {
    message = JSON.parse(message);
    if(message.type === 'message') {
        if(message.text && message.text.includes(myUserKey)){
            let targetUser = '<@' +message.user+ '>';
            var meow = meows[Math.floor(Math.random()*meows.length)];
            let msg = meow+' '+targetUser;
            rtm.sendMessage(msg, message.channel);
        }
    }
});
rtm.start();
