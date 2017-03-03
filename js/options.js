let textarea = document.getElementById('brandlist');
let checkboxFBA = document.getElementById('FBA');

textarea.value = readProperty('brandlist', '');
checkboxFBA.checked = JSON.parse(readProperty('FBA', false));

checkboxFBA.onchange = function () {
    localStorage['FBA'] = checkboxFBA.checked;
};
textarea.oninput = function () {
    localStorage['brandlist'] = textarea.value;
};

function readProperty(property, defValue) {
    if (localStorage[property] == null) {
        return defValue;
    }
    return localStorage[property];
}
