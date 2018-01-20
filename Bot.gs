function Bot(apiKey, request) {
    this.apiKey = apiKey;
    
    if (request !== undefined) {
        this.init(request);
    }
}

Bot.prototype.pass = function () {
    return this;
}

Bot.prototype.init = function (rawRequest) {
    var request = JSON.parse(rawRequest.postData.contents)
    var message = request.message;

    if (!request.hasOwnProperty('message')) {
        throw "NoMessageError: Field 'message' not found!";
    }
    
    if (message.hasOwnProperty('entities') && message.entities[0].type == 'bot_command') {
        this.text = this.pass;
    } else {
        this.command = this.pass;
    }
    
    this.request = request;
    this.message = message.text;
    this.chatId =  message.chat.id;
    
    return this;
}

Bot.prototype.command = function (name, action) {
    if (action && this.message == name) {
        var result;
        if (action.constructor && action.call && action.apply) {
            result = action(this.request);
        } else {
            result = action;
        }
        this._send(result);
        this.command = this.pass;
    }
    return this;
}

Bot.prototype.text = function (template, answer) {
    var message = this.message;
    if (answer && (template == "*" || template.test(message))) {
        var result;
        if (answer.constructor && answer.call && answer.apply) {
            result = answer(message, this.request);
        } else {
            result = answer;
        }
        
        this._send(result);
        this.text = this.pass;
    }
    return this;
}

Bot.prototype.start = function(action) {
    return this.command('/start', action);
}

Bot.prototype.help = function(action) {
    return this.command('/help', action);
}

Bot.prototype.channel = function(chatId, name) {
    if ((name in this)) {
        throw new "PropertyError: Property with name " + name + " already exists!";
    }

    this[name] = function(parameter) {
        var text;
        if (typeof parameter == "function") {
            text = parameter();
        } else {
            text = String(parameter);
        }

        this._sendMessage(text, chatId);
        return this;
    }

    return this;
}

Bot.prototype._send = function(message) {
    var text;
    if (typeof message == "string") {
        text = message;
    } else {
        text = message.text;
    }

    var payload = {
        'method': 'sendMessage',
        'chat_id': String(this.chatId),
        'text': text,
        'parse_mode': 'HTML'
    }

    if (message.reply_markup !== undefined) {
        payload['reply_markup'] = JSON.stringify(message.reply_markup);
    }

    var data = {
        'method': 'post',
        'payload': payload
    }

    return UrlFetchApp.fetch('https://api.telegram.org/bot' + this.apiKey + '/', data);
}


Bot.prototype.webhook = function() {
    var url = ScriptApp.getService().getUrl();
    return UrlFetchApp.fetch('https://api.telegram.org/bot' + this.apiKey + '/setWebHook?url=' + url);
}
