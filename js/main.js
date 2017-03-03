if (typeof process.mainModule.exports.itemLinks === 'undefined') {
    process.mainModule.exports.itemLinks = [];
}

let gui = requireNode('nw.gui');
let win = gui.Window.get();

win.maximize();

//win.showDevTools();

let menubar = new gui.Menu({
    type: 'menubar'
});

menubar.append(new gui.MenuItem({
    label: '<=back',
    click: function () {
        window.top.document.getElementById('mainframe').contentWindow.history.back();
    }
}));

menubar.append(new gui.MenuItem({
    label: 'forward=>',
    click: function () {
        window.top.document.getElementById('mainframe').contentWindow.history.forward();
    }
}));

menubar.append(new gui.MenuItem({
    label: 'amazon.com',
    click: function () {
        window.top.document.getElementById('mainframe').src = "https://amazon.com/";
    }
}));

menubar.append(new gui.MenuItem({
    label: 'walmart.com',
    click: function () {
        window.top.document.getElementById('mainframe').src = "https://walmart.com/";
    }
}));

menubar.append(new gui.MenuItem({
    label: 'Options',
    click: function () {
        window.top.document.getElementById('mainframe').src = "options.html";
    }
}));

menubar.append(new gui.MenuItem({
    label: 'Collect!',
    click: function () {
        window.top.document.getElementById('mainframe').src = "result.html";
    }
}));

menubar.append(new gui.MenuItem({
    label: 'Terapeak',
    click: function () {
        //window.top.document.getElementById('mainframe').src = "terapeak.html";
        window.top.document.getElementById('mainframe').src = "terapeak.html";
    }
}));


gui.Window.get().menu = menubar;


process.mainModule.exports.init();
