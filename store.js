var Promise = require('bluebird');

var ReviewsOptions = [
    '“Very stylish, great stay, great staff”',
    '“good hotel awful meals”',
    '“Need more attention to little things”',
    '“Lovely small hotel ideally situated to explore the area.”',
    '“Positive surprise”',
    '“Beautiful suite and resort”'];

    var StoreOptions = [
    'Circle K Store DMC-1',
    'Pascal Tepper',
    'Party Centre Media City',
    'Bakemart Plus',
    'The Kebab Shop',
    'Aswaaq Sufouh Supermarket',
    'Last Minute Supermarket'
 ];

     var LocationOptions = [
    'Jumeirah ',
    'Dubai Internet City',
    'Dubai Media City',
    'Dubai Internet City',
    'Jumeirah Lake Towers',
    'Marina Mall'
 ];

module.exports = {
    displayStores: function (storess) {
        return new Promise(function (resolve) {

            // Filling the hotels results manually just for demo purposes
            var stores = [];
            for (var i = 1; i <= 5; i++) {
                stores.push({
                    name:  StoreOptions[Math.floor(Math.random() * StoreOptions.length)],
                    priceStarting: Math.floor(Math.random() * 450) + 80,
                    location: LocationOptions[Math.floor(Math.random() * LocationOptions.length)],
                    image: 'https://placeholdit.imgix.net/~text?txtsize=35&txt=Store+' + i + '&w=500&h=260'
                });
            }

            stores.sort(function (a, b) { return a.priceStarting - b.priceStarting; });

            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(stores); }, 1000);
        });
    },
   

    searchHotelReviews: function (hotelName) {
        return new Promise(function (resolve) {

            // Filling the review results manually just for demo purposes
            var reviews = [];
            for (var i = 0; i < 5; i++) {
                reviews.push({
                    title: ReviewsOptions[Math.floor(Math.random() * ReviewsOptions.length)],
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris odio magna, sodales vel ligula sit amet, vulputate vehicula velit. Nulla quis consectetur neque, sed commodo metus.',
                    image: 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif'
                });
            }

            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(reviews); }, 1000);
        });
    }
};