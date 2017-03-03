require('dotenv').config();
let _ = require('lodash');
let OperationHelper = require('apac').OperationHelper;
let axios = require('axios');
let cheerio = require('cheerio');

let opHelper = new OperationHelper({
    awsId: process.env.AMAZON_AWSID,
    awsSecret: process.env.AMAZON_AWSSECRET,
    assocId: process.env.AMAZON_ASSOCID,
    maxRequestsPerSecond: 1
});
let walmartApiKey = process.env.WALMART_APIKEY;

class idCollection {

    constructor(strStoreURL, matchIdRegExp, numberOfRequests) {
        this.strStoreURL = strStoreURL;
        //   this.objHTMLElement = document.getElementById(strStoreURL.match(/\w+(?=\.com)/).join());
        this.arrayOfIds = [];
        this.matchIdRegExp = matchIdRegExp;
        this.numberOfRequests = numberOfRequests;
    }

    searchStoreURL(arr) {
        return arr.indexOf(this.strStoreURL) + 1;
    }

    searchItemId(itemURL) {
        let matchedId = itemURL.match(this.matchIdRegExp);
        let idsLength = this.arrayOfIds.length;
        if (matchedId && (_.indexOf(_.flatten(this.arrayOfIds), matchedId[0].slice(1)) === -1)) {
            this.arrayOfIds[idsLength] = [];
            this.arrayOfIds[idsLength][0] = matchedId[0].slice(1);
            this.arrayOfIds[idsLength][1] = itemURL;
        }
    }

    getItems() {
        let self = this;
        return this.requestData()
            .then(function () {
                let promises = [];
                self.arrayOfIds.forEach(function (item, i) {
                    if (typeof self.arrayOfIds[i][2] === 'undefined') {
                        _.pullAt(self.arrayOfIds, [i]);
                    }
                });
                self.arrayOfIds.forEach(function (item, i) {
                    if (self.arrayOfIds[i][1].indexOf('amazon.com') + 1) {
                        let prom = new Promise((resolve, reject) => {
                            axios.get('https://www.amazon.com/gp/offer-listing/' + self.arrayOfIds[i][0] + '/ref=olp_f_primeEligible?ie=UTF8&f_new=true&f_primeEligible=true')
                                .then((response) => {
                                    let $ = cheerio.load(response.data);
                                    let price = [];
                                    $('.olpOffer').each(function (j, element) {
                                        price.push({
                                            price: $(element).find('.olpOfferPrice').text().trim(),
                                            shipping: $(element).find('.olpShippingPrice').text().trim(),
                                            prime: $(element).find('.a-icon-prime').text().trim(),
                                            FBA: $(element).find('.olpFbaPopoverTrigger').text().trim()
                                        });
                                    });
                                    if (price.length === 0) {
                                        self.arrayOfIds[i][0] = null;
                                        resolve ('OK');
                                    }
                                    if (JSON.parse(readProperty('FBA', false))) {
                                        if (_.find(price, {FBA: 'Fulfillment by Amazon'})) {
                                            for (let j = 0; j < price.length; j++) {
                                                if (price[j].FBA.length > 0) {
                                                    if (j === 0) {
                                                        self.arrayOfIds[i][5] = price[j].price;
                                                        break;
                                                    } else {
                                                        if (Number(price[j].price.substr(1)) - Number(price[0].price.substr(1)) > Number(price[j].price.substr(1)) * 0.04) {
                                                            self.arrayOfIds[i][0] = null;
                                                        } else {
                                                            self.arrayOfIds[i][5] = price[j].price;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        } else {
                                            self.arrayOfIds[i][0] = null;
                                        }
                                    } else {
                                        self.arrayOfIds[i][5] = price[0].price;
                                    }
                                    resolve('OK');
                                }).catch(function (error) {
                                console.error(error);
                                reject(error);
                            });
                        });
                        promises.push(prom);
                    }
                });
                return Promise.all(promises)
                    .then(() => {
                        let indexes = [];
                        for (let i = 0; i < self.arrayOfIds.length; i++) {
                                if(self.arrayOfIds[i][0] === null) {
                                    indexes.push(i);
                                }
                            }
                        _.pullAt(self.arrayOfIds, indexes);
                        }
                    );
            });
    }

    requestData() {
        let stringIds, promises = [];
        let arrayChunked, arrayIds = [];
        let self = this, i, k;

        arrayChunked = _.chunk(self.arrayOfIds, self.numberOfRequests);

        for (k = 0; k < arrayChunked.length; k++) {
            arrayIds = [];
            for (i = 0; i < arrayChunked[k].length; i++) {
                arrayIds.push(arrayChunked[k][i][0]);
            }
            stringIds = arrayIds.join(',');
            if (self.strStoreURL === 'walmart.com') {

                promises.push(axios.get('http://api.walmartlabs.com/v1/items?ids=' + stringIds + '&apiKey=' + walmartApiKey + '&format=json')
                    .then(response => {
                        var answer = response.data.items;
                        var index;
                        for (i = 0; i < answer.length; i++) {
                            index = _.findIndex(self.arrayOfIds, [0, String(answer[i].itemId)]);
                            if (answer[i].name) self.arrayOfIds[index][3] = answer[i].name.trim();
                            else self.arrayOfIds[index][3] = '';
                            if (answer[i].salePrice) self.arrayOfIds[index][5] = '$' + answer[i].salePrice;
                            else self.arrayOfIds[index][5] = 0;
                            if (answer[i].brandName) self.arrayOfIds[index][2] = answer[i].brandName.trim();
                            else self.arrayOfIds[index][2] = '';
                            if (answer[i].modelNumber) self.arrayOfIds[index][4] = answer[i].modelNumber;
                            else self.arrayOfIds[index][4] = '';
                        }
                    })
                    .catch(err => {
                        console.error(err);
                    }));
            } else if (self.strStoreURL === 'amazon.com') {

                promises.push(opHelper.execute('ItemLookup', {
                    'Condition': 'New',
                    'MerchantId': 'All',
                    'ItemId': stringIds,
                    'ResponseGroup': 'ItemAttributes,Offers'
                }).then((response) => {
                    self.iterateAmazonObj(response.result);
                }).catch((err) => {
                    console.error("Something went wrong! ", err);
                }));
            }
        }
        return Promise.all(promises);
    }


    iterateAmazonObj(obj) {
        let self = this, i;
        if (!_.isArray(obj.ItemLookupResponse.Items.Item)) {
            obj.ItemLookupResponse.Items.Item = [obj.ItemLookupResponse.Items.Item];
        }
        _.forEach(obj.ItemLookupResponse.Items.Item, function (item) {
                i = _.findIndex(self.arrayOfIds, [0, item.ASIN]);
                self.arrayOfIds[i][3] = item.ItemAttributes.Title.trim();
                if (item.OfferSummary.LowestNewPrice && item.OfferSummary.LowestNewPrice.FormattedPrice != 'Too low to display') {
                    self.arrayOfIds[i][5] = item.OfferSummary.LowestNewPrice.FormattedPrice;
                } else if (item.ItemAttributes.ListPrice) {
                    self.arrayOfIds[i][5] = item.ItemAttributes.ListPrice.FormattedPrice;
                } else {
                    self.arrayOfIds[i][5] = 0;
                }
                self.arrayOfIds[i][2] = item.ItemAttributes.Brand.trim();
                if (item.ItemAttributes.Model) {
                    self.arrayOfIds[i][4] = item.ItemAttributes.Model;
                } else {
                    self.arrayOfIds[i][4] = '';
                }
                // if (JSON.parse(readProperty('FBA', false))) {
                //     self.arrayOfIds[i][6] = item.Offers.MoreOffersUrl.toString();
                // }
            }
        );
    }
}

/**
 * Read property from Chrome local storage
 * @param property String
 * @param defValue
 * @returns {*}
 */
function readProperty(property, defValue) {
    if (localStorage[property] == null) {
        return defValue;
    }
    return localStorage[property];
}

module.exports = idCollection;