"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TextFormatter_1 = require("./TextFormatter");
var AmazonAlexaSsmlFormatter_1 = require("./AmazonAlexaSsmlFormatter");
var AmazonPollySsmlFormatter_1 = require("./AmazonPollySsmlFormatter");
var AmazonPollyNeuralSsmlFormatter_1 = require("./AmazonPollyNeuralSsmlFormatter");
var GoogleAssistantSsmlFormatter_1 = require("./GoogleAssistantSsmlFormatter");
var SamsungBixbySsmlFormatter_1 = require("./SamsungBixbySsmlFormatter");
var MicrosoftAzureSsmlFormatter_1 = require("./MicrosoftAzureSsmlFormatter");
function createFormatter(options) {
    switch (options.platform) {
        case 'amazon-alexa':
            return new AmazonAlexaSsmlFormatter_1.AmazonAlexaSsmlFormatter(options);
        case 'amazon-polly':
            return new AmazonPollySsmlFormatter_1.AmazonPollySsmlFormatter(options);
        case 'amazon-polly-neural':
            return new AmazonPollyNeuralSsmlFormatter_1.AmazonPollyNeuralSsmlFormatter(options);
        case 'google-assistant':
            return new GoogleAssistantSsmlFormatter_1.GoogleAssistantSsmlFormatter(options);
        case 'samsung-bixby':
            return new SamsungBixbySsmlFormatter_1.SamsungBixbySsmlFormatter(options);
        case 'microsoft-azure':
            return new MicrosoftAzureSsmlFormatter_1.MicrosoftAzureSsmlFormatter(options);
        default:
            return new TextFormatter_1.TextFormatter(options);
    }
}
exports.createFormatter = createFormatter;
function createTextFormatter(options) {
    return new TextFormatter_1.TextFormatter(options);
}
exports.createTextFormatter = createTextFormatter;
//# sourceMappingURL=FormatterFactory.js.map