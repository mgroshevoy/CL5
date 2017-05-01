const idCollection  = requireNode('../lib/idcollection.js');
const _ = requireNode('lodash');

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

Promise.all([idsAmazon.getItems(), idsWalmart.getItems()]).then(() => {
    printOut(idsAmazon);
    printOut(idsWalmart);
    document.getElementsByClassName('modal')[0].style.display = 'none';
});

/**
 * Output to HTML page
 * @param self
 */
function printOut(self) {
    let i, textHTML;

    let n, arrayOfBrands = idCollection.readProperty('brandlist', '').split(',');

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