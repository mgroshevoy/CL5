requireNode('dotenv').config();
let idCollection = requireNode('../lib/idcollection.js');
let _ = requireNode('lodash');
let axios = requireNode('axios');
let vo = requireNode('vo');
let gui = requireNode('nw.gui');
//let win = gui.Window.get();

document.getElementsByClassName('modal')[0].style.display = 'block';

let idsAmazon = new idCollection('amazon.com', /\/B\w{9}/, 10);
let idsWalmart = new idCollection('walmart.com', /\/\d{5,9}/, 20);
let token = process.env.TERA_TOKEN;

process.mainModule.exports.itemLinks.forEach(function (itemLink) {
    if (idsAmazon.searchStoreURL(itemLink)) {
        idsAmazon.searchItemId(itemLink);
    } else if (idsWalmart.searchStoreURL(itemLink)) {
        idsWalmart.searchItemId(itemLink);
    }
});

document.getElementById('buttonAmazon').onclick = function () {
    outputToCSV(idsAmazon.arrayOfIds, 'amazonteraitems.csv', [1, 6]);
};

document.getElementById('buttonWalmart').onclick = function () {
    outputToCSV(idsWalmart.arrayOfIds, 'walmartteraitems.csv', [1]);
};


Promise.all([idsAmazon.getItems(), idsWalmart.getItems()]).then(() => {
    vo(function*() {
        let i, arrayTera, teraInfo, page, teraSites;
        let startDate = moment().subtract(1, 'months').startOf('month').valueOf();
        let endDate = moment().subtract(1, 'months').endOf('month').valueOf();
        teraSites = yield axios.get('https://sell.terapeak.com/services/research/sites?token=' + token)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                alert(error);
                document.getElementsByClassName('modal')[0].style.display = 'none';
                console.error(error);
            });
        if (teraSites.sites['ebay.com'].endDate < endDate) endDate = teraSites.sites['ebay.com'].endDate;
        for (i = 0; i < idsAmazon.arrayOfIds.length; i++) {
            arrayTera = [];
            page = 1;
            do {
                teraInfo = yield getTeraInfo(checkMPN(idsAmazon.arrayOfIds[i]), page, startDate, endDate);
                arrayTera = _.concat(arrayTera, teraInfo.data.listings);
                page++;
            } while (!teraInfo.data.lastPage);
            calcTera(idsAmazon, arrayTera, i);
        }
        for (i = 0; i < idsWalmart.arrayOfIds.length; i++) {
            arrayTera = [];
            page = 1;
            do {
                teraInfo = yield getTeraInfo(checkMPN(idsWalmart.arrayOfIds[i]), page, startDate, endDate);
                arrayTera = _.concat(arrayTera, teraInfo.data.listings);
            } while (!teraInfo.data.lastPage);
            calcTera(idsWalmart, arrayTera, i);
        }
        return arrayTera;
    })((error, result) => {
        if (error) {
            alert(error);
            console.error(error);
            throw new Error(error);
        }
        printOut(idsAmazon);
        printOut(idsWalmart);
        document.getElementsByClassName('modal')[0].style.display = 'none';
    });
});

/**
 * Calculate TeraPeak values
 * @param self
 * @param arrayTera
 * @param i
 */
function calcTera(self, arrayTera, i) {
    let totalItemsSold = 0, averagePrice = 0, monopolization = '', profitPotential = 0;

    for (let j = 0; j < arrayTera.length; j++) {
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

    if (!item[4] || item[4].length < 4 || (item[4].length < 6 && item[4].split(/\d/).length - 1 === item[4].length)) {
        console.log(item);
        let strTitle = item[3].split(' ', 5).join(' ');
        return {
            MPN: encodeURIComponent(strTitle),
            isTitle: true
        };
    }
    else {
        return {MPN: item[4], isTitle: false}
    }
}

/**
 * Get TeraPeak item info
 * @param MPN (MPN or title)
 * @param isTitle
 * @param page (number of page)
 * @param startDate
 * @param endDate
 * @returns {Promise<R>|Promise.<T>}
 */
function getTeraInfo({MPN: MPN, isTitle: isTitle = false}, page = 1, startDate, endDate) {

    let url = "https://sell.terapeak.com/services/research/listings?token=" + token +
        "&buyerCountryCodes=US&categoryId=&fromPrice=" +
        "&listingConditions=New&listingTypes=FixedPrice%2CStoresFixedPrice" +
        "&pageSize=50&sellerCountryCodes=&site=ebay.com" +
        "&sortBy=totalSalesUsd&sortDirection=desc" +
        "&toPrice=&transactionSite=ebay.com";

    if (isTitle) {
        url += '&productIdentifier=productIdentifiersAndTitles';
    } else {
        url += '&productIdentifier=productIdentifiersOnly';
    }

    url += '&startDate=' + startDate;
    url += '&endDate=' + endDate;
    url += '&keywords=' + MPN;
    url += '&pageNumber=' + page;
    return axios.get(url)
        .then(response => {
            return response;
        })
        .catch(error => {
            alert(error);
            document.getElementsByClassName('modal')[0].style.display = 'none';
            console.error(error);
        });
}

/**
 * Export to CSV
 * @param arrayItems - array of values to export
 * @param nameOfFile - name of exported file
 * @param arrayOfIndexes - indexes to exclude from export file
 */
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
    let n, arrayOfBrands = idCollection.readProperty('brandlist', '').split(',');

    n = self.arrayOfIds.length;
    textHTML = '<div class="o-grid__cell">';
    for (i = 0; i < n; i++) {

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

