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
var Store = require('./store');


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
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/bb0e9c02-97c3-47af-bb97-193288568418?subscription-key=f7b961cc44714f4baca4593cead8b3e6&timezoneOffset=0.0&verbose=true&q=');
bot.recognizer(recognizer);

bot.dialog('PlaceOrder', [
    function (session, args, next) {
        session.send('Hi.. I am I\'ll Order Bot! I am analyzing your message: \'%s\'', session.message.text);

        // try extracting entities
        var itemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Item');
        var storeEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Store');
        if (storeEntity){
        session.dialogData.store = storeEntity.entity;
    }
    
        if (!itemEntity) {
            // airport entity detected, continue to next step
            builder.Prompts.text(session, 'What do you want to order?');
            
        } else {
            // no entities detected, ask user for item
             next({ response: itemEntity.entity });
             
            
        }
    },

     function (session, results, next) {
        session.dialogData.item=results.response;
        session.send('Got it, so you need %s',session.dialogData.item);
        // asking for store
       if (session.dialogData.store === undefined){
          builder.Prompts.choice(session, 'From where you want to order?', "Pizza Hut|Sandella's|McDonalds");
       } else { 
          next({ response: session.dialogData.store });
       }
    },
    function (session, results) {
         if (session.dialogData.store === undefined){
        session.dialogData.store=results.response.entity;
        }
        session.send('Got it, so you need from %s',session.dialogData.store);
        // var message = 'I am ordering';
        // if (session.dialogData.searchType === 'full') {
        //     message += ' near %s airport...';
        // } else {
        //     message += ' in %s...';
        // }

 var msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title('%s', session.dialogData.item)
                    .subtitle("Store: %s | Total Price: AED %s ", session.dialogData.store, Math.floor(Math.random() * 450) + 80)
                    .images([
                        builder.CardImage.create(session, 'https://placeholdit.imgix.net/~text?txtsize=35&txt= Your amazing' + ' ' + session.dialogData.item + '😋&w=500&h=260')
                    ])
                    .tap(builder.CardAction.openUrl(session, "http://google.com"))
            ]);
        session.send(msg);

                builder.Prompts.confirm(session, "Here are the details.. do you want to confirm?");


        // session.send(message, item);

        // // Async search
        // Store
        //     .displayOrder(item)
        //     .then(function (hotels) {
        //         // args
        //         session.send('I found %d hotels:', hotels.length);

        //         var message = new builder.Message()
        //             .attachmentLayout(builder.AttachmentLayout.carousel)
        //             .attachments(hotels.map(hotelAsAttachment));

        //         session.send(message);

        //         // End
        //         session.endDialog();
        //     });
    },
    function (session, results) {
        if (results.response ? 'yes' : 'no' === 'yes'){
        session.send('Thats great! let me contact %s for the confirmation', session.dialogData.store);
        } else {
            session.send('Oh okay nevermind .. I have cancelled the order');
        }
    }
]).triggerAction({
    matches: 'PlaceOrder',
  
});

bot.dialog('SearchStore', function (session, args, next) {
    // retrieve hotel name from matched entities
session.send('Hold on a sec.. I am searching for nearby stores');

    // Async search
        Store
            .displayStores("stores")
            .then(function (stores) {
                // args
                session.send('I found %d stores:', stores.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(stores.map(hotelAsAttachment));

                session.send(message);

             
            });

    // var hotelEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Location');
    // if (hotelEntity) {
    //     Store.searchHotelReviews(hotelEntity.entity)
    //         .then(function (reviews) {
    //             var message = new builder.Message()
    //                 .attachmentLayout(builder.AttachmentLayout.carousel)
    //                 .attachments(reviews.map(reviewAsAttachment));
    //             session.endDialog(message);
    //         });
    // }
    
}
    
    ).triggerAction({
    matches: 'SearchStore'
});

bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking me things like \'Order potatos from ABC Store\', \'search a nearby store\' or \'order from City Taste Cafe\'');
}).triggerAction({
    matches: 'Help'
});

bot.dialog('Cancel', function (session) {
    session.endDialog('Done. I have canceled your order.');
}).triggerAction({
    matches: 'CancelOrder'
});

bot.dialog('Thanks', function (session) {
    session.endDialog(ThanksArr[Math.floor(Math.random() * ThanksArr.length)]);
}).triggerAction({
    matches: 'Thanks'
});

bot.dialog('None', function (session) {
    session.send('Sorry, I didn\'t get that.');
    session.endDialog('Try asking me things like \'Order potatos from ABC Store\', \'search a nearby store\' or \'order from City Taste Cafe\'');
}).triggerAction({
    matches: 'None'
});

// Helpers

var ThanksArr = [
    'I really appriciate it!😊',
    'I can\'t beleive that I am able to do all of that by myself 😅',
    'Appriciate it 😄',
    'Thanks for your support 😇'
]
function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('Near %s ', hotel.location)
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