exports.getIsUrl = function(rtm) {
    return rtm.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/);
}

exports.getIsYoutubeLink = function(rtm) {
    let youtubeRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;

    return rtm.match(youtubeRegex);
}