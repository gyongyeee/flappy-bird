var SPEED = 690;
var GRAVITY = 40;
var FLAP = 620;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 134;

if (typeof(console) === 'undefined') {
    function nop(){}
    var console = {
        info: nop,
        log: nop,
        error: nop
    };
}

WebFontConfig = {
    google: { families: [ 'Press+Start+2P::latin-ext' ] },
    active: main
};
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})(); 


function main() {

var state = {
    preload: preload,
    create: create,
    update: update
};

var parent = document.querySelector('#screen');

var game = new Phaser.Game(
    0,
    0,
    Phaser.CANVAS,
    parent,
    state,
    false,
    false
);

function preload() {
    var assets = {
        spritesheet: {
            volumes: ['assets/volumes.png', 40, 32],
            birdie: ['assets/birdie.png', 36, 35],
            clouds: ['assets/clouds.png', 128, 64]
        },
        image: {
            logo: ['assets/Jofogas_logo.png'],
            finger: ['assets/finger.png'],
            fence: ['assets/fence.png']
        },
        audio: {
            background: [['assets/bg_full.mp3', 'assets/bg_full.ogg']],
            flap: [['assets/Zsozso_noise.mp3', 'assets/Zsozso_noise.ogg']],
            score1: [['assets/Zsozso_furo.mp3', 'assets/Zsozso_furo.ogg']],
            score2: [['assets/Zsozso_szemuveg.mp3', 'assets/Zsozso_szemuveg.ogg']],
            score3: [['assets/Zsozso_solyom.mp3', 'assets/Zsozso_solyom.ogg']],
            score4: [['assets/Zsozso_kad.mp3', 'assets/Zsozso_kad.ogg']],
            end: [['assets/Zsozso_neem.mp3', 'assets/Zsozso_neem.ogg']]
        }
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

function Flappy( game ) {
    this.flap = new Phaser.Signal();

}

/**
* @name Flappy#flap
* @property {number} height - Gets or sets the current height of the game world.
*/
Object.defineProperty(Phaser.World.prototype, "height", {

    get: function () {
        return this.bounds.height;
    },

    set: function (value) {
        this.bounds.height = value;
    }

});


    var CookieStorage = {
        set: function setCookie(name, value, days) {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        },

        get: function getCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },

        remove: function removeCookie(name) {
            this.set(name, "", -1);
        }
     },
     LocalStorage = {
        set: window.localStorage.setItem,
        get: window.localStorage.getItem,
        remove: window.localStorage.removeItem
     };

function Storage(defaults) {
    var storage = this;
    function load( key ) {
        return LocalStorage.get( key ) || defaults[ key ];
    }
    function save( key, data ) {
        CookieStorage.set( key, data );
        LocalStorage.set( key, data );
    }
    Object.keys( defaults ).forEach( function( key ) {
        Object.defineProperty(storage, key, {
            get: load.bind(storage, key),
            set: save.bind(storage, key)
        });
    });
}

var settings = new Storage({
    hiscore: 0,
    mute: false
});

var gameStarted,
    gameOver,
    score,
    bg,
    credits,
    clouds,
    fingers,
    invs,
    birdie,
    fence,
    scoreText,
    instText,
    gameOverText,
    flapSnd,
    scoreSnd,
    endSnd,
    BackgroundSnd,
    muteButton,
    logoButton,
    scoreSndCnt,
    fingersTimer,
    cloudsTimer;

    function muteOnClick() {
        muteButton.setFrames(1 - muteButton.frame);
        BackgroundSnd.mute = ! BackgroundSnd.mute;
        return false;
    }

    function createText(xpos, ypos, size) {
        return game.add.text(
            (xpos < 1 ? game.world.width * xpos : xpos),
            (ypos < 1 ? game.world.height * ypos : ypos),
            '',
            {
                font: (size || 8 ) + 'px "Press Start 2P"',
                fill: '#fff',
                stroke: '#430',
                strokeThickness: 4,
                align: 'center'
            }
        );
    }

    function logoOnClick() {
        window.open('http://www.jofogas.hu');
        return false;
    }

    function create() {
    // Set world dimensions
    var screenWidth = parent.clientWidth > window.innerWidth ? window.innerWidth : parent.clientWidth;
    var screenHeight = parent.clientHeight > window.innerHeight ? window.innerHeight : parent.clientHeight;
    game.world.width = screenWidth;
    game.world.height = screenHeight;
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xDDEEFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Credits 'yo
    credits = createText(0.5, 10);
    credits.anchor.x = 0.5;
    // Add clouds group
    clouds = game.add.group();
    // Add fingers
    fingers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add birdie
    birdie = game.add.sprite(0, 0, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.animations.add('fly', [0, 1, 2, 3], 10, true);
    birdie.inputEnabled = true;
    birdie.body.collideWorldBounds = true;
    birdie.body.gravity.y = GRAVITY;
    // Add fence
    fence = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'fence');
    fence.tileScale.setTo(2, 2);
    // Add score text
    scoreText = createText(0.5, 0.25, 16);
    scoreText.anchor.setTo(0.5, 0.5);
    // Add instructions text
    instText = createText(0.5, 0.75);
    instText.anchor.setTo(0.5, 0.5);
    // Add game over text
    gameOverText = createText(0.5, 0.5, 16);
    gameOverText.anchor.setTo(0.5, 0.5);
    gameOverText.scale.setTo(2, 2);
    // Add sounds
    flapSnd = game.add.audio('flap');
    scoreSnd = [
        game.add.audio('score1'),
        game.add.audio('score2'),
        game.add.audio('score3'),
        game.add.audio('score4')
    ];
    scoreSndCnt = parseInt(Math.random() * scoreSnd.length, 10);
    endSnd = game.add.audio('end');
    // Add controls
    muteButton = game.add.button(game.world.width - 10 - 40, 10, 'volumes');
    muteButton.onInputDown.add(muteOnClick);

    logoButton = game.add.button(10, 10, 'logo');
    logoButton.onInputDown.add(logoOnClick);

    game.input.onDown.add(flap);
    // Start clouds timer
    cloudsTimer = new Phaser.Timer(game);
    cloudsTimer.onEvent.add(spawnCloud);
    cloudsTimer.start();
    cloudsTimer.add(Math.random());

    BackgroundSnd = game.add.audio('background', 1, true);
    BackgroundSnd.volume = 0.5;
    BackgroundSnd.play('', 0, 1, true);

    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    credits.renderable = true;
    scoreText.setText("FLAPPY\nZSOZSÓ");
    instText.setText("KATTINTS A KEZDÉSHEZ...");
    gameOverText.renderable = false;
    birdie.body.allowGravity = false;
    birdie.angle = 0;
    birdie.reset(game.world.width / 4, game.world.height / 2);
    birdie.scale.setTo(2, 2);
    birdie.animations.play('fly');
    fingers.removeAll();
    invs.removeAll();
}

function start() {
    credits.renderable = false;
    birdie.body.allowGravity = true;
    // SPAWN FINGERS!
    fingersTimer = new Phaser.Timer(game);
    fingersTimer.onEvent.add(spawnFingers);
    fingersTimer.start();
    fingersTimer.add(2);
    // Show score
    scoreText.setText("PONTSZÁMOD: " + score);
    instText.renderable = false;
    // START!
    gameStarted = true;
}

function flap() {
    if (muteButton.body.sprite.bounds.contains(game.input.x, game.input.y)) {
        return;
    }
    if (!gameStarted) {
        start();
    }
    if (!gameOver) {
        birdie.body.velocity.y = -FLAP;
        flapSnd.play();
    }
}

function spawnCloud() {
    cloudsTimer.stop();

    var cloudY = Math.random() * game.height / 2;
    var cloud = clouds.create(
        game.width,
        cloudY,
        'clouds',
        Math.floor(4 * Math.random())
    );
    var cloudScale = 2 + 2 * Math.random();
    cloud.alpha = 2 / cloudScale;
    cloud.scale.setTo(cloudScale, cloudScale);
    cloud.body.allowGravity = false;
    cloud.body.velocity.x = -SPEED / cloudScale;
    cloud.anchor.y = 0;

    cloudsTimer.start();
    cloudsTimer.add(4 * Math.random());
}

function spawnFingers() {
    function o() {
        return OPENING + 60 * ((score > 50 ? 50 : 50 - score) / 50);
    }
    function spawnFinger(fingerY, flipped) {
        var finger = fingers.create(
            game.width,
            fingerY + (flipped ? -o() : o()) / 2,
            'finger'
        );
        finger.body.allowGravity = false;

        // Flip finger! *GASP*
        finger.scale.setTo(2, flipped ? -2 : 2);
        finger.body.offset.y = flipped ? -finger.body.height * 2 : 0;

        // Move to the left
        finger.body.velocity.x = -SPEED;

        return finger;
    }
    fingersTimer.stop();

    var fingerY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom finger
    var botFinger = spawnFinger(fingerY, false);
    // Top finger (flipped)
    var topFinger = spawnFinger(fingerY, true);

    // Add invisible thingy
    var inv = invs.create(topFinger.x + topFinger.width, 0);
    inv.width = 2;
    inv.height = game.world.height;
    inv.body.allowGravity = false;
    inv.body.velocity.x = -SPEED;

    fingersTimer.start();
    fingersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    invs.remove(inv);
    score += 1;
    scoreText.setText("PONTSZÁMOD: " + score);
    scoreSndCnt = (scoreSndCnt + 1) % scoreSnd.length;
    scoreSnd[scoreSndCnt].play();
}

function setGameOver() {
    gameOver = true;
    instText.setText("KATTINTS\nÉS JÁTSSZ ÚJRA!");
    instText.renderable = true;
    var hiscore = window.localStorage.getItem('hiscore');
    hiscore = hiscore ? hiscore : score;
    hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
    window.localStorage.setItem('hiscore', hiscore);
    gameOverText.setText("AZ ESZEMET NEEEM!!!\n\nCSÚCS: " + hiscore);
    gameOverText.renderable = true;
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
    // Make birdie reset the game
    birdie.events.onInputDown.addOnce(reset);
    endSnd.play();
}

function update() {
    if (gameStarted) {
        // Make birdie dive
        var dvy = FLAP + birdie.body.velocity.y;
        birdie.angle = (90 * dvy / FLAP) - 180;
        if (birdie.angle < -30) {
            birdie.angle = -30;
        }
        if (
            gameOver ||
            birdie.angle > 90 ||
            birdie.angle < -90
        ) {
            birdie.angle = 90;
            birdie.animations.stop();
            birdie.frame = 3;
        } else {
            birdie.animations.play('fly');
        }
        // Birdie is DEAD!
        if (gameOver) {
            if (birdie.scale.x < 4) {
                birdie.scale.setTo(
                    birdie.scale.x * 1.2,
                    birdie.scale.y * 1.2
                );
            }
            // Shake game over text
            gameOverText.angle = Math.random() * 5 * Math.cos(game.time.now / 100);
        } else {
            // Check game over
            game.physics.overlap(birdie, fingers, setGameOver);
            if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                setGameOver();
            }
            // Add score
            game.physics.overlap(birdie, invs, addScore);
        }
        // Remove offscreen fingers
        fingers.forEachAlive(function(finger) {
            if (finger.x + finger.width < game.world.bounds.left) {
                finger.kill();
            }
        });
        // Update finger timer
        fingersTimer.update();
    } else {
        birdie.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
    if (!gameStarted || gameOver) {
        // Shake instructions text
        instText.scale.setTo(
            2 + 0.1 * Math.sin(game.time.now / 100),
            2 + 0.1 * Math.cos(game.time.now / 100)
        );
    }
    // Shake score text
    scoreText.scale.setTo(
        2 + 0.1 * Math.cos(game.time.now / 100),
        2 + 0.1 * Math.sin(game.time.now / 100)
    );
    // Update clouds timer
    cloudsTimer.update();
    // Remove offscreen clouds
    clouds.forEachAlive(function(cloud) {
        if (cloud.x + cloud.width < game.world.bounds.left) {
            cloud.kill();
        }
    });
    // Scroll fence
    if (!gameOver) {
        fence.tilePosition.x -= game.time.physicsElapsed * SPEED / 2;
    }
}

}
