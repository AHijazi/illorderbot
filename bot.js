
var restify = require('restify');
var builder = require('botbuilder');

server = restify.new
var connector = new builder.ChatConnector();

var bot = new builder.UniversalBot(connector);


// bot.dialog('/', function(session){
//     session.send('Hello');
//     var userMessage = session.message.text;
//     session.send('you said: ' + userMessage);
// });

bot.dialog('/',[
    function(session){
        builder.Prompts.text(session, 'please enter your name: dfsdf');
    
    },
    function(session, result){
        session.send('Hello, ' + result.response)
    }
    
]);

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());
