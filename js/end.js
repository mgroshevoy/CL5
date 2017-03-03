document.body.addEventListener('click', function (event) {
    let notification;
    if (event.ctrlKey || event.shiftKey) {
        event.preventDefault();
        event.path.forEach(function (item) {
            if (item.toString().search(/amazon.com/) + 1 || item.toString().search(/walmart.com/) + 1) {
                if (process.mainModule.exports.itemLinks.indexOf(item.toString()) + 1) {
                    notification = new window.top.Notification('Link Already Added!', {
                        body: item.toString(),
                        // icon: 'img/warning.png'
                    });
                } else {
                    process.mainModule.exports.itemLinks.push(item.toString());
                    notification = new window.top.Notification('Link Added', {
                        body: item.toString(),
                        // icon: 'img/added.png'
                    });
                }
                notification.onshow = function () {
                    setTimeout(function () {
                        notification.close();
                    }, 1000);
                };
            }
        });
    }
    return false;
});
