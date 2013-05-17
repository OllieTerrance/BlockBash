var board = {
    play: false,
    size: [], // height x width
    items: 0
};
var player = {
    1: {
        coord: [], // (y, x)
        health: {
            life: 5,
            max: 5
        },
        weapon: {
            count: 0,
            max: 1
        },
        turn: 0
    },
    2: {
        coord: [], // (y, x)
        health: {
            life: 5,
            max: 5
        },
        weapon: {
            count: 0,
            max: 1
        },
        turn: 0
    },
};
var keys = {
    wasd: [65, 87, 68, 83], // a, w, d, s
    tfgh: [70, 84, 72, 71], // f, t, h, g
    ijkl: [74, 73, 76, 75], // jj, i, l, k
    arrows: [37, 38, 39, 40], // left, up, right, down
    down: {} // keys being held down
};
var sounds = {
    bgm: 0,
    fire: [1],
    item: [1],
    hit: [1],
    lose: [1],
    step1: [1],
    step2: [1],
    wall: [1]
}
function playSound(name) {
    var sound = sounds[name];
    sound[sound[0]].play();
    sound[0]++;
    if (sound[0] > 5) {
        sound[0] = 1;
    }
}
function buildBoard() {
    var table = $("#board")[0];
    board.size = [Math.floor($(document).height() / 32) - 2, Math.floor($(document).width() / 32)];
    player[1].coord = [1, 1];
    player[2].coord = [board.size[0] - 2, board.size[1] - 2];
    for (var i = 0; i < 2; i++) {
        var row = document.createElement("tr");
        table.appendChild(row);
        for (var j = 0; j < board.size[1] + 2; j++) {
            var cell = document.createElement("td");
            cell.className = "block";
            row.appendChild(cell);
        }
    }
    for (var i = 0; i < board.size[0]; i++) {
        var row = document.createElement("tr");
        row.id = "row_" + i;
        table.appendChild(row);
        for (var j = 0; j < 2; j++) {
            var cell = document.createElement("td");
            cell.className = "block";
            row.appendChild(cell);
        }
        for (var j = 0; j < board.size[1]; j++) {
            var cell = document.createElement("td");
            cell.id = "cell_" + i + "_" + j;
            cell.className = "cell";
            row.appendChild(cell);
        }
        for (var j = 0; j < 2; j++) {
            var cell = document.createElement("td");
            cell.className = "block";
            row.appendChild(cell);
        }
    }
    var row = document.createElement("tr");
    table.appendChild(row);
    for (var j = 0; j < board.size[1] + 2; j++) {
        var cell = document.createElement("td");
        cell.className = "block";
        row.appendChild(cell);
    }
    getCell(1, 1).addClass("player1");
    getCell(board.size[0] - 2, board.size[1] - 2).addClass("player2");
    var row = document.createElement("tr");
    table.appendChild(row);
    for (var c = 0; c < Math.floor((board.size[0] * board.size[1]) / 16);) {
        var coord = getRandomCoord();
        var y = coord[0];
        var x = coord[1];
        if (!is(y, x, ["block", "crate", "item", "player1", "player2"])) {
            var cell = getCell(coord[0], coord[1]);
            cell.addClass("block");
            c++;
        }
    }
}
function start(overlay) {
    overlay.style.display = 'none';
    board.play = true;
    sounds["bgm"].play();
    addCrate();
}
function getCell(y, x) {
    return $("#cell_" + y + "_" + x);
}
function getPlayerCell(pl) {
    return getCell(player[pl].coord[0], player[pl].coord[1]);
}
function is(y, x, types) {
    var cell = getCell(y, x);
    for (var i in types) {
        if (cell.hasClass(types[i])) {
            return true;
        }
    }
    return false;
}
function getRandomCoord() {
    return [Math.floor(Math.random() * board.size[0]), Math.floor(Math.random() * board.size[1])];
}
function movePlayer(pl, dir) {
    var cond = false;
    dir = dir % 4;
    var fwd = Math.floor(dir / 2) ? 1 : -1;
    var axis = (dir + 1) % 2;
    switch (dir) { // left, up, right, down
        case 0:
            cond = player[pl].coord[axis] > 0
                   && !is(player[pl].coord[0], player[pl].coord[1] - 1, ["block", "crate", "player" + (3 - pl), "playerweapon"]);
            break;
        case 1:
            cond = player[pl].coord[axis] > 0
                   && !is(player[pl].coord[0] - 1, player[pl].coord[1], ["block", "crate", "player" + (3 - pl), "playerweapon"]);
            break;
        case 2:
            cond = player[pl].coord[axis] < board.size[axis] - 1
                   && !is(player[pl].coord[0], player[pl].coord[1] + 1, ["block", "crate", "player" + (3 - pl), "playerweapon"]);
            break;
        case 3:
            cond = player[pl].coord[axis] < board.size[axis] - 1
                   && !is(player[pl].coord[0] + 1, player[pl].coord[1], ["block", "crate", "player" + (3 - pl), "playerweapon"]);
            break;
    }
    if (cond) {
        var cell = getPlayerCell(pl);
        cell.removeClass("playerweapon");
        cell.removeClass("player" + pl);
        player[pl].coord[axis] += fwd;
        var cell = getPlayerCell(pl);
        if (cell.hasClass("item")) {
            if (cell.hasClass("itemheal")) {
                if (player[pl].health.life < player[pl].health.max) {
                    player[pl].health.life++;
                }
                cell.removeClass("itemheal");
                $("#player" + pl + "_healthx")[0].innerHTML = player[pl].health.life + " / " + player[pl].health.max;
            } else if (cell.hasClass("itemlife")) {
                player[pl].health.max++;
                cell.removeClass("itemlife");
                $("#player" + pl + "_healthx")[0].innerHTML = player[pl].health.life + " / " + player[pl].health.max;
            } else if (cell.hasClass("itemweapon")) {
                player[pl].weapon.max++;
                cell.removeClass("itemweapon");
            } else if (cell.hasClass("itemturn")) {
                player[3 - pl].turn += 1;
                setTimeout("turnOff(" + (3 - pl) + ")", 10000);
                cell.removeClass("itemturn");
            }
            cell.removeClass("item");
            board.items--;
            playSound("item");
        }
        cell.addClass("player" + pl);
        playSound("step" + pl);
    }
}
function fireWeapon(pl, dir) {
    if (player[pl].weapon.count < player[pl].weapon.max) {
        player[pl].weapon.count++;
        var cell = getPlayerCell(pl);
        cell.removeClass("player" + pl);
        cell.addClass("playerweapon");
        setTimeout("hitPlayer(" + pl + ")", 50);
        setTimeout("stepWeapon(" + pl + ", " + player[pl].coord[0] + ", " + player[pl].coord[1] + ", " + dir + ")", 75);
        playSound("fire");
    }
}
function stepWeapon(pl, y, x, dir) {
    var cond = false;
    dir = dir % 4;
    var fwd = Math.floor(dir / 2) ? 1 : -1;
    var axis = (dir + 1) % 2;
    var newX = x;
    var newY = y;
    switch (dir) { // left, up, right, down
        case 0:
            cond = x > 0 && !is(y, x - 1, ["block"]);
            newX -= 1;
            break;
        case 1:
            cond = y > 0 && !is(y - 1, x, ["block"]);
            newY -= 1;
            break;
        case 2:
            cond = x < board.size[axis] - 1 && !is(y, x + 1, ["block"]);
            newX += 1;
            break;
        case 3:
            cond = y < board.size[axis] - 1 && !is(y + 1, x, ["block"]);
            newY += 1;
            break;
    }
    var cell = getCell(y, x);
    if (is(y, x, ["weapon" + pl])) {
        cell.removeClass("weapon" + pl);
    }
    if (cond) {
        var cell = getCell(newY, newX);
        if (is(newY, newX, ["crate"])) {
            cell.removeClass("crate");
            cell.addClass("item");
            var prob = Math.floor(Math.random() * 10);
            if (prob < 3) {
                cell.addClass("itemheal");
            } else if (prob < 4) {
                cell.addClass("itemlife");
            } else if (prob < 8) {
                cell.addClass("itemweapon");
            } else {
                cell.addClass("itemturn");
            }
            player[pl].weapon.count--;
            playSound("wall");
        } else if (is(newY, newX, ["player" + (3 - pl)])) {
            player[pl].weapon.count--;
            player[3 - pl].health.life--;
            $("#player" + (3 - pl) + "_healthx")[0].innerHTML = player[3 - pl].health.life + " / " + player[3 - pl].health.max;
            cell.removeClass("player" + (3 - pl));
            cell.addClass("playerweapon");
            if (player[3 - pl].health.life === 0) {
                sounds["bgm"].pause();
                playSound("lose");
                alert("Game over: " + (pl === 1 ? "Blue" : "Red") + " wins!");
                location.reload();
            } else {
                setTimeout("hitPlayer(" + (3 - pl) + ")", 100);
                playSound("hit");
            }
        } else {
            cell.addClass("weapon" + pl);
            setTimeout("stepWeapon(" + pl + ", " + newY + ", " + newX + ", " + dir + ")", 75);
        }
    } else {
        player[pl].weapon.count--;
        playSound("wall");
    }
}
function addCrate() {
    if (board.items < 10) {
        var coord = getRandomCoord();
        var y = coord[0];
        var x = coord[1];
        if (is(y, x, ["block", "crate", "item", "player1", "player2"])) {
            return addCrate();
        }
        var cell = getCell(coord[0], coord[1]);
        cell.addClass("crate");
        board.items++;
    }
    setTimeout("addCrate()", Math.floor(Math.random() * 12500) + 2500);
}
function hitPlayer(pl) {
    var cell = getPlayerCell(pl);
    cell.removeClass("playerweapon");
    cell.addClass("player" + pl);
}
function turnOff(pl) {
    player[pl].turn -= 1;
}
$(document).keydown(function(e) {
    if (!keys.down[e.which] && board.play) {
        if ($.inArray(e.which, keys.wasd) >= 0) {
            movePlayer(1, $.inArray(e.which, keys.wasd) + player[1].turn);
        } else if ($.inArray(e.which, keys.tfgh) >= 0) {
            fireWeapon(1, $.inArray(e.which, keys.tfgh) + player[1].turn);
        } else if ($.inArray(e.which, keys.ijkl) >= 0) {
            movePlayer(2, $.inArray(e.which, keys.ijkl) + player[2].turn);
        } else if ($.inArray(e.which, keys.arrows) >= 0) {
            fireWeapon(2, $.inArray(e.which, keys.arrows) + player[2].turn);
        } else {
            return;
        }
        keys.down[e.which] = true;
        e.preventDefault();
    } else if ((e.which === 13 || e.which === 32) && !board.play) {
        start($("#overlay")[0]);
    }
});
$(document).keyup(function(e) {
    if (keys.down[e.which]) {
        delete keys.down[e.which];
        e.preventDefault();
    }
});
$(document).ready(function() {
    buildBoard();
    for (var i in sounds) {
        if (i === "bgm") {
            sounds[i] = document.createElement("audio");
            sounds[i].src = "bgm.mp3";
            sounds[i].loop = true;
        } else {
            for (var j = 0; j < 5; j++) {
                sounds[i].push(document.createElement("audio"));
                sounds[i][j].src = i + ".mp3";
            }
        }
    }
});
