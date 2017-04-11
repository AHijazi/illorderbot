/*-----------------------------------------------------------------------------
This Bot uses the Bot Connector Service but is designed to showcase whats 
possible on Facebook using the framework. The demo shows how to create a looping 
menu how send things like Pictures, Bubbles, Receipts, and use Carousels. It also
shows all of the prompts supported by Bot Builder and how to receive uploaded
photos, videos, and location.
# RUN THE BOT:
    You can run the bot locally using the Bot Framework Emulator but for the best
    experience you should register a new bot on Facebook and bind it to the demo 
    bot. You can run the bot locally using ngrok found at https://ngrok.com/.
    * Install and run ngrok in a console window using "ngrok http 3978".
    * Create a bot on https://dev.botframework.com and follow the steps to setup
      a Facebook channel. The Facebook channel config page will walk you through 
      creating a Facebook page & app for your bot.
    * For the endpoint you setup on dev.botframework.com, copy the https link 
      ngrok setup and set "<ngrok link>/api/messages" as your bots endpoint.
    * Next you need to configure your bots MICROSOFT_APP_ID, and
      MICROSOFT_APP_PASSWORD environment variables. If you're running VSCode you 
      can add these variables to your the bots launch.json file. If you're not 
      using VSCode you'll need to setup these variables in a console window.
      - MICROSOFT_APP_ID: This is the App ID assigned when you created your bot.
      - MICROSOFT_APP_PASSWORD: This was also assigned when you created your bot.
    * Install the bots persistent menus following the instructions outlined in the
      section below.
    * To run the bot you can launch it from VSCode or run "node app.js" from a 
      console window. 
# INSTALL PERSISTENT MENUS
    Facebook supports persistent menus which Bot Builder lets you bind to global 
    actions. These menus must be installed using the page access token assigned 
    when you setup your bot. You can easily install the menus included with the 
    example by running the cURL command below:
        curl -X POST -H "Content-Type: application/json" -d @persistent-menu.json 
        "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN"
    
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: '226b5644-0aec-4b8f-8d3f-80b47c1722d1',
    appPassword: '8u1Wp4c6XcZm7BNBEwEDE20'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


///////////////////////////////////////
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/bb0e9c02-97c3-47af-bb97-193288568418?subscription-key=f7b961cc44714f4baca4593cead8b3e6&verbose=true&timezoneOffset=0.0&spellCheck=true&q=');
bot.recognizer(recognizer);

bot.dialog('PlaceOrder', [
    function (session, args, next) {
        session.send('Hi.. I am I\'ll Order Bot! I am analyzing your message: \'%s\'', session.message.text);

        // try extracting entities
        var itemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Item');
        var storeEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Store');
        session.send('Got it#1 so you need %s', itemEntity.entity);
        if (storeEntity) {
            session.send('Got it#2 so you need %s form %s', itemEntity.entity, storeEntity.entity);
            // city entity detected, continue to next step
            session.dialogData.searchType = 'full';
            session.dialogData.store=storeEntity.entity;
            next({ response: itemEntity.entity });
        } else if (itemEntity) {
            // airport entity detected, continue to next step
            session.dialogData.searchType = 'item';
            next({ response: itemEntity.entity });
        } else {
            // no entities detected, ask user for item
            builder.Prompts.text(session, 'What do you want to order?');
        }
    },

     function (session, results, next) {
        session.dialogData.order=results.response;
        session.send('Got it, so you need %s form %s',session.dialogData.order);
        // asking for store
       if (session.dialogData.searchType == 'full'){
                   session.send('Got it, so you need %s form %s',session.dialogData.store);

        next({ response: session.dialogData.store });
       } else {
         builder.Prompts.choice(session, 'From where you want to order?', "Pizza Hut|Sandella's|McDonalds");
       }
    },
    function (session, results) {
        var item = results.response;

        var message = 'I am ordering';
        if (session.dialogData.searchType === 'full') {
            message += ' near %s airport...';
        } else {
            message += ' in %s...';
        }

        session.send(message, item);

        // Async search
        Store
            .displayOrder(item)
            .then(function (hotels) {
                // args
                session.send('I found %d hotels:', hotels.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
    }
]).triggerAction({
    matches: 'PlaceOrder',
  
});

bot.dialog('ShowHotelsReviews', function (session, args) {
    // retrieve hotel name from matched entities
    var hotelEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Location');
    if (hotelEntity) {
        session.send('Looking for reviews of \'%s\'...', hotelEntity.entity);
        Store.searchHotelReviews(hotelEntity.entity)
            .then(function (reviews) {
                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(reviews.map(reviewAsAttachment));
                session.endDialog(message);
            });
    }
}).triggerAction({
    matches: 'SearchStore'
});

bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\'');
}).triggerAction({
    matches: 'Help'
});



// Helpers
function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('Pricd $%d ', hotel.priceStarting)
        .images([new builder.CardImage().url(hotel.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(hotel.location))
        ]);
}

function reviewAsAttachment(review) {
    return new builder.ThumbnailCard()
        .title(review.title)
        .text(review.text)
        .images([new builder.CardImage().url(review.image)]);
}