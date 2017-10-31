let moment = require('moment');

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
        ':pouting_cat: :fish:'
	];
};

exports.configureMoment = function() {
    moment.updateLocale('en', {
        relativeTime : {
            future: "om %s",
            past:   "%s sedan",
            s  : 'ett par sekunder',
            ss : '%d sekunder',
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