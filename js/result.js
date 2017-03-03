let idCollection  = requireNode('../lib/idcollection.js');
let _ = requireNode('lodash');
// let OperationHelper = requireNode('apac').OperationHelper;
// let axios = requireNode('axios');
// let cheerio = requireNode('cheerio');
//
// let opHelper = new OperationHelper({
//     awsId: 'AKIAI5QF6DEWDPP2YSTQ',
//     awsSecret: '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',
//     assocId: 'ivo01-20',
//     maxRequestsPerSecond: 1
// });
// let walmartApiKey = 'n2dwddmdk9bqa2yx6s32whac';


// class idCollection {
//
//     constructor(strStoreURL, matchIdRegExp, numberOfRequests) {
//         this.strStoreURL = strStoreURL;
//         this.objHTMLElement = document.getElementById(strStoreURL.match(/\w+(?=\.com)/).join());
//         this.arrayOfIds = [];
//         this.matchIdRegExp = matchIdRegExp;
//         this.numberOfRequests = numberOfRequests;
//     }
//
//     searchStoreURL(arr) {
//         return arr.indexOf(this.strStoreURL) + 1;
//     }
//
//     searchItemId(itemURL) {
//         let matchedId = itemURL.match(this.matchIdRegExp);
//         let idsLength = this.arrayOfIds.length;
//         if (matchedId && (_.indexOf(_.flatten(this.arrayOfIds), matchedId[0].slice(1)) === -1)) {
//             this.arrayOfIds[idsLength] = [];
//             this.arrayOfIds[idsLength][0] = matchedId[0].slice(1);
//             this.arrayOfIds[idsLength][1] = itemURL;
//         }
//     }
//
//     outputItems() {
//         let self = this;
//         return this.requestData()
//             .then(function () {
//                 let promises = [], i;
//                 if (JSON.parse(readProperty('FBA', false))) {
//
//                     self.arrayOfIds.forEach(function (item, i) {
//                         if (self.arrayOfIds[i][6]) {
//                             let prom = new Promise((resolve, reject) => {
//                                 axios.get('https://www.amazon.com/gp/offer-listing/' + self.arrayOfIds[i][0] + '/ref=olp_sort_tax?ie=UTF8&f_new=true&sort=taxsip')
//                                     .then((response) => {
//                                         let $ = cheerio.load(response.data);
//                                         $('.a-row.a-spacing-mini.olpOffer').each(function (j, element) {
//                                             if ($(element).find('.a-popover-trigger.a-declarative.olpFbaPopoverTrigger').text().trim() == 'Fulfillment by Amazon') {
//                                                 self.arrayOfIds[i][5] = $(element).find('.a-size-large.a-color-price.olpOfferPrice.a-text-bold').text().trim();
//                                                 return false;
//                                             }
//                                         });
//                                         resolve(self.arrayOfIds[i][5]);
//                                     }).catch(function (error) {
//                                     console.log(error);
//                                     reject(error);
//                                 });
//                             });
//                             promises.push(prom);
//                         }
//                     });
//                 }
//                 return Promise.all(promises);
//             })
//             .then(function () {
//                 let i, textHTML;
//                 let n, arrayOfBrands = readProperty('brandlist', '').split(',');
//
//                 n = self.arrayOfIds.length;
//                 textHTML = '<div class="o-grid__cell">';
//                 for (i = 0; i < n; i++) {
//                     if (typeof self.arrayOfIds[i][2] === 'undefined') {
//                         self.arrayOfIds[i][2] = 'Unavailable';
//                         self.arrayOfIds[i][3] = 'Unavailable';
//                         self.arrayOfIds[i][4] = 0;
//                         self.arrayOfIds[i][5] = 0;
//                     }
//
//                     arrayOfBrands.push(self.arrayOfIds[i][2]);
//                     self.arrayOfIds[i][3] = replaceBrandInString(self.arrayOfIds[i][3], arrayOfBrands);
//
//                     // Output ASIN/WMID => [0] :Url => [1] :Brand => [2]:Title => [3]:Model => [4]:Price => [5]
//                     textHTML += '<div class="o-grid">' +
//                         '<div class="o-grid__cell o-grid__cell--width-20">' +
//                         '<a class="c-link" href="' + self.arrayOfIds[i][1] + '" target="_blank">' + self.arrayOfIds[i][0] + '</a>' + '</div>' +
//                         '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][2] + '</div>' +
//                         '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][3] + '</div>' +
//                         '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][4] + '</div>' +
//                         '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][5] + '</div></div><hr>';
//                 }
//                 textHTML += '</div>';
//                 self.objHTMLElement.innerHTML = textHTML;
//             });
//     }
//
//     requestData() {
//         let stringIds, promises = [];
//         let arrayChunked, arrayIds = [];
//         let self = this, i, k;
//
//         arrayChunked = _.chunk(self.arrayOfIds, self.numberOfRequests);
//
//         for (k = 0; k < arrayChunked.length; k++) {
//             arrayIds = [];
//             for (i = 0; i < arrayChunked[k].length; i++) {
//                 arrayIds.push(arrayChunked[k][i][0]);
//             }
//             stringIds = arrayIds.join(',');
//             if (self.strStoreURL === 'walmart.com') {
//
//                 promises.push(axios.get('http://api.walmartlabs.com/v1/items?ids=' + stringIds + '&apiKey=' + walmartApiKey + '&format=json')
//                     .then(response => {
//                         var answer = response.data.items;
//                         var index;
//                         for (i = 0; i < answer.length; i++) {
//                             index = _.findIndex(self.arrayOfIds, [0, String(answer[i].itemId)]);
//                             self.arrayOfIds[index][3] = answer[i].name;
//                             self.arrayOfIds[index][5] = '$' + answer[i].salePrice;
//                             self.arrayOfIds[index][2] = answer[i].brandName;
//                             self.arrayOfIds[index][4] = answer[i].modelNumber;
//                         }
//                     })
//                     .catch(err => {
//                         console.error(err);
//                     }));
//             } else if (self.strStoreURL === 'amazon.com') {
//
//                 promises.push(opHelper.execute('ItemLookup', {
//                     'Condition': 'New',
//                     'MerchantId': 'All',
//                     'ItemId': stringIds,
//                     'ResponseGroup': 'ItemAttributes,Offers'
//                 }).then((response) => {
//                     self.iterateAmazonObj(response.result);
//                 }).catch((err) => {
//                     console.error("Something went wrong! ", err);
//                 }));
//             }
//         }
//         return Promise.all(promises);
//     }
//
//
//     iterateAmazonObj(obj) {
//         let self = this, i;
//         if (!_.isArray(obj.ItemLookupResponse.Items.Item)) {
//             obj.ItemLookupResponse.Items.Item = [obj.ItemLookupResponse.Items.Item];
//         }
//         _.forEach(obj.ItemLookupResponse.Items.Item, function (item) {
//                 i = _.findIndex(self.arrayOfIds, [0, item.ASIN]);
//                 self.arrayOfIds[i][3] = item.ItemAttributes.Title;
//                 if (item.OfferSummary.LowestNewPrice && item.OfferSummary.LowestNewPrice.FormattedPrice != 'Too low to display') {
//                     self.arrayOfIds[i][5] = item.OfferSummary.LowestNewPrice.FormattedPrice;
//                 } else if (item.ItemAttributes.ListPrice) {
//                     self.arrayOfIds[i][5] = item.ItemAttributes.ListPrice.FormattedPrice;
//                 } else {
//                     self.arrayOfIds[i][5] = 0;
//                 }
//                 self.arrayOfIds[i][2] = item.ItemAttributes.Brand;
//                 if (item.ItemAttributes.Model) {
//                     self.arrayOfIds[i][4] = item.ItemAttributes.Model;
//                 } else {
//                     self.arrayOfIds[i][4] = '0';
//                 }
//                 if (JSON.parse(readProperty('FBA', false))) {
//                     self.arrayOfIds[i][6] = item.Offers.MoreOffersUrl.toString();
//                 }
//             }
//         );
//     }
// }

/**
 * Output array to .csv file
 * @param arrayItems
 * @param nameOfFile
 * @param arrayOfIndexes
 */
function outputToCSV(arrayItems, nameOfFile, arrayOfIndexes) {
    let array = arrayItems.slice();

    // remove unwanted columns from export
    array.forEach(function (item) {
        _.pullAt(item, arrayOfIndexes);
    });

    let csv = array.map(function (d) {
        return d.join(':');
    }).join('\n');
    let encodedUri = encodeURI(csv);
    let link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodedUri);
    link.setAttribute("download", nameOfFile);
    link.click();
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

/**
 * Replace name of Brand in string
 * @param str String
 * @param array Array of Brands
 * @param strToPlace String to replace
 * @returns {*}
 */
function replaceBrandInString(str, array, strToPlace = '') {
    if (array && str) {
        _.forEach(array, function (item) {
            str = _.replace(str, new RegExp("^" + item), strToPlace);
        })
    }
    return str;
}

document.getElementById('buttonAmazon').onclick = function () {
    outputToCSV(idsAmazon.arrayOfIds, 'amazonitems.csv', [1, 6]);
};

document.getElementById('buttonWalmart').onclick = function () {
    outputToCSV(idsWalmart.arrayOfIds, 'walmartitems.csv', [1]);
};


let idsAmazon = new idCollection('amazon.com', /\/B\w{9}/, 10);
let idsWalmart = new idCollection('walmart.com', /\/\d{5,9}/, 20);

document.getElementsByClassName('modal')[0].style.display = 'block';


process.mainModule.exports.itemLinks.forEach(function (itemLink) {
    if (idsAmazon.searchStoreURL(itemLink)) {
        idsAmazon.searchItemId(itemLink);
    } else if (idsWalmart.searchStoreURL(itemLink)) {
        idsWalmart.searchItemId(itemLink);
    }
});

// idsAmazon.outputItems().then(function () {
//     document.getElementsByClassName('modal')[0].style.display = 'none';
// });

Promise.all([idsAmazon.getItems(), idsWalmart.getItems()]).then(() => {
    printOut(idsAmazon);
    printOut(idsWalmart);
    document.getElementsByClassName('modal')[0].style.display = 'none';
});

function printOut(self) {
    let i, textHTML;
    let n, arrayOfBrands = readProperty('brandlist', '').split(',');

    n = self.arrayOfIds.length;
    textHTML = '<div class="o-grid__cell">';
    for (i = 0; i < n; i++) {
        if (typeof self.arrayOfIds[i][2] === 'undefined') {
            self.arrayOfIds[i][2] = 'Unavailable';
            self.arrayOfIds[i][3] = 'This item is not accessible through the Product Advertising API.';
            self.arrayOfIds[i][4] = 0;
            self.arrayOfIds[i][5] = 0;
        }

        arrayOfBrands.push(self.arrayOfIds[i][2]);
        self.arrayOfIds[i][3] = replaceBrandInString(self.arrayOfIds[i][3], arrayOfBrands);

        // Output ASIN/WMID => [0] :Url => [1] :Brand => [2]:Title => [3]:Model => [4]:Price => [5]
        textHTML += '<div class="o-grid">' +
            '<div class="o-grid__cell o-grid__cell--width-20">' +
            '<a class="c-link" href="' + self.arrayOfIds[i][1] + '" target="_blank">' + self.arrayOfIds[i][0] + '</a>' + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][2] + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][3] + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][4] + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][5] + '</div></div><hr>';
    }
    textHTML += '</div>';
    document.getElementById(self.strStoreURL.match(/\w+(?=\.com)/).join()).innerHTML = textHTML;
}