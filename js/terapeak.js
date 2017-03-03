let idCollection = requireNode('../lib/idcollection.js');
let _ = requireNode('lodash');
let axios = requireNode('axios');
let vo = requireNode('vo');
let gui = requireNode('nw.gui');
let win = gui.Window.get();

//win.showDevTools();

document.getElementsByClassName('modal')[0].style.display = 'block';

let idsAmazon = new idCollection('amazon.com', /\/B\w{9}/, 10);
let idsWalmart = new idCollection('walmart.com', /\/\d{5,9}/, 20);

process.mainModule.exports.itemLinks.forEach(function (itemLink) {
    if (idsAmazon.searchStoreURL(itemLink)) {
        idsAmazon.searchItemId(itemLink);
    } else if (idsWalmart.searchStoreURL(itemLink)) {
        idsWalmart.searchItemId(itemLink);
    }
});


// var terapeak = gui.Window.open('https://sell.terapeak.com/?page=productGallery#/research', function (win) {
//     win.on('loaded', function () {
//         var document = win.window.document;
//         console.log(document);
//         var email = document.getElementById('email');
//         console.log(email);
//         var flag = document.getElementById('tppWrapper');
//         console.log(flag);
//         var url = "https://sell.terapeak.com/?page=productGallery#/research?buyerCountryCodes&categoryId&endDate=1485644399999&fromPrice&groupByListings=false&keywords=" + "DP75SDI" + "&listingConditions=New&listingTypes=FixedPrice%2CStoresFixedPrice%2CPersonalOffer&pageNumber=1&pageSize=10&productIdentifier=productIdentifiersOnly&sellerCountryCodes&site=ebay.com&sortBy&sortDirection&startDate=1483052400000&toPrice&transactionSite";
//         if (email !== null) {
//             console.log('Show!');
//             win.show();
//             win.focus();
//             win.requestAttention(10);
//         } else if ( flag !== null) {
//             console.log('Hide!');
//             win.close();
//             var getInfo = gui.Window.open(url, {show: true}, function (winsearch) {
//                 winsearch.window.onload = function () {
//                   console.log('Hurray!');
//                 };
//                 winsearch.on('loaded', function () {
//                     var document = winsearch.window.document;
//                     var flag = document.getElementById('content-wrapperr');
//                     console.log (flag);
//                     if (flag !== null) {
//                         var value = document.getElementsByClassName('value');
//                         var i, strContent = [];
//                         for(i=0;i<value.length;i++) {
//                             strContent.push(value[i]);
//                         }
//                         console.log(value);
//                         console.log(strContent);
//                     }
//                     //debugger;
//                 });
//             });
//         }
//     });
// });

document.getElementById('buttonAmazon').onclick = function () {
    outputToCSV(idsAmazon.arrayOfIds, 'amazonteraitems.csv', [1, 6]);
};

document.getElementById('buttonWalmart').onclick = function () {
    outputToCSV(idsWalmart.arrayOfIds, 'walmartteraitems.csv', [1]);
};


Promise.all([idsAmazon.getItems(), idsWalmart.getItems()]).then(() => {
    vo(function*() {
        let i, j, arrayTera, teraInfo, page;
        for (i = 0; i < idsAmazon.arrayOfIds.length; i++) {
            arrayTera = [];
            page = 1;
            do {
                teraInfo = yield getTeraInfo(checkMPN(idsAmazon.arrayOfIds[i]), page);
                arrayTera = _.concat(arrayTera, teraInfo.data.listings);
                page++;
            } while (!teraInfo.data.lastPage);
            calcTera(idsAmazon, arrayTera, i);
        }
        for (i = 0; i < idsWalmart.arrayOfIds.length; i++) {
            arrayTera = [];
            page = 1;
            do {
                teraInfo = yield getTeraInfo(checkMPN(idsWalmart.arrayOfIds[i]), page);
                arrayTera = _.concat(arrayTera, teraInfo.data.listings);
            } while (!teraInfo.data.lastPage);
            calcTera(idsWalmart, arrayTera, i);
        }
        return arrayTera;
    })((error, result) => {
        if (error) {
            console.error(error);
            throw new Error(error);
        }
        printOut(idsAmazon);
        printOut(idsWalmart);
        document.getElementsByClassName('modal')[0].style.display = 'none';
    });
});

function calcTera(self, arrayTera, i) {
    let totalItemsSold = 0, averagePrice = 0, monopolization = '', profitPotential = 0;

    for (j = 0; j < arrayTera.length; j++) {
        totalItemsSold += arrayTera[j].totalItemsSold;
    }

    if (arrayTera[0]) averagePrice = arrayTera[0].averageItemPriceUsd;

    if (averagePrice) {
        //        averagePrice = (averagePrice/arrayTera.length);
        profitPotential = averagePrice - Number(self.arrayOfIds[i][5].substr(1)) * 1.17;
        averagePrice = '$' + averagePrice.toFixed(2);
        profitPotential = '$' + profitPotential.toFixed(2);
    }
    if (arrayTera[0]) {
        monopolization += arrayTera[0].totalItemsSold;
        if (arrayTera[1]) {
            monopolization += ';' + arrayTera[1].totalItemsSold;
            if (arrayTera[2]) {
                monopolization += ';' + arrayTera[2].totalItemsSold;
            }
        }
    }
    self.arrayOfIds[i]['tera'] = {
        totalItemsSold: totalItemsSold,
        averagePrice: averagePrice,
        monopolization: monopolization,
        profitPotential: profitPotential
    };
}


/**
 * Check item's MPN for validity
 * @param item
 * @returns {{MPN: *, isTitle: boolean}}
 */
function checkMPN(item) {

    if (item[4].length < 4 || (item[4].length < 6 && item[4].split(/\d/).length - 1 === item[4].length)) return {
        MPN: encodeURIComponent(item[3]),
        isTitle: true
    };
    else return {MPN: item[4], isTitle: false}
}

/**
 * Get TeraPeak item info
 * @param MPN (MPN or title)
 * @param isTitle
 * @param page (number of page)
 * @returns {Promise<R>|Promise.<T>}
 */
function getTeraInfo({MPN: MPN, isTitle: isTitle = false}, page = 1) {
    url = "https://sell.terapeak.com/services/research/listings?token=c7c69b1f9adbb81e23f5af1d6764fc6cd7b5b46ba0d4f6dbbb242b83f14f22d2&buyerCountryCodes=US&categoryId=&fromPrice=&listingConditions=New&listingTypes=FixedPrice%2CStoresFixedPrice%2CPersonalOffer&pageSize=50&sellerCountryCodes=&site=ebay.com&sortBy=totalSalesUsd&sortDirection=desc&toPrice=&transactionSite=ebay.com";
    if (isTitle) {
        url += '&productIdentifier=productIdentifiersAndTitles';
    } else {
        url += '&productIdentifier=productIdentifiersOnly';
    }
    // url += '&endDate=' + Date.now();
    // url += '&startDate=' + (Date.now() - 30 * 24 * 60 * 60 * 1000);
    url += '&startDate=' + moment().subtract(1, 'months').startOf('month').valueOf();
    url += '&endDate=' + moment().subtract(1, 'months').endOf('month').valueOf();
    url += '&keywords=' + MPN;
    url += '&pageNumber=' + page;
    return axios.get(url)
        .then(response => {
            return response;
        })
        .catch(error => {
            console.error(error);
        });
}

function outputToCSV(arrayItems, nameOfFile, arrayOfIndexes) {
    let array = arrayItems.slice();
    // remove unwanted columns from export
    array.forEach(function (item, i) {
        _.pullAt(item, arrayOfIndexes);
        item.push(array[i].tera.totalItemsSold);
        item.push(array[i].tera.averagePrice);
        item.push(array[i].tera.monopolization);
        item.push(array[i].tera.profitPotential);
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
 * Print arrayOfIds
 * @param self
 */
function printOut(self) {
    let i, textHTML;
    let n, arrayOfBrands = readProperty('brandlist', '').split(',');

    n = self.arrayOfIds.length;
    textHTML = '<div class="o-grid__cell">';
    for (i = 0; i < n; i++) {
        // if (typeof self.arrayOfIds[i][2] === 'undefined') {
        //     self.arrayOfIds[i][2] = 'Unavailable';
        //     self.arrayOfIds[i][3] = 'This item is not accessible through the Product Advertising API.';
        //     self.arrayOfIds[i][4] = 'Unavailable';
        //     self.arrayOfIds[i][5] = 0;
        // }

        arrayOfBrands.push(self.arrayOfIds[i][2]);
        self.arrayOfIds[i][3] = replaceBrandInString(self.arrayOfIds[i][3], arrayOfBrands);

        // Output ASIN/WMID => [0] :Url => [1] :Brand => [2]:Title => [3]:Model => [4]:Price => [5]
        textHTML += '<div class="o-grid">' +
            '<div class="o-grid__cell o-grid__cell--width-10">' +
            '<a class="c-link" href="' + self.arrayOfIds[i][1] + '" target="_blank">' + self.arrayOfIds[i][0] + '</a>' + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i][2] + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-20">' + self.arrayOfIds[i][3] + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i][4] + '</div>' +
            '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i][5] + '</div>';
        if (self.arrayOfIds[i]['tera']) {
            textHTML += '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i]['tera'].totalItemsSold + '</div>' +
                '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i]['tera'].averagePrice + '</div>' +
                '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i]['tera'].monopolization + '</div>' +
                '<div class="o-grid__cell o-grid__cell--width-10">' + self.arrayOfIds[i]['tera'].profitPotential + '</div>';
        }
        textHTML += '</div><hr>';
    }
    textHTML += '</div>';
    document.getElementById(self.strStoreURL.match(/\w+(?=\.com)/).join()).innerHTML = textHTML;
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

