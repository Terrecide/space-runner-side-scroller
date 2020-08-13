// variables
let starCount = 30;

let meteoriteCount = 5;
let meteoriteSpeed = 2.5;

let spaceShipSpeed = 3;

let destroyerCount = 2;
let destroyerSpeed = 2;
let destroyerFireInterval = 120;
let bulletSpeed = 4;

let counter = 0;
let counterInterval = 120;

let score = 0;
let highestScore = 0;

let app = new PIXI.Application({width: 800, height:600});

let state, spaceShip;

let keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};

// Add ticker
app.ticker.add(() => ticker())

// Movement
window.addEventListener("keydown", KeysDown);
window.addEventListener("keyup", KeysUp);

function KeysDown(e) {
    keys[e.key] = true;
}

function KeysUp(e) {
    keys[e.key] = false;
}

//Adding endScreen replay button
let replayBtn = PIXI.Sprite.from('assets/replay.png');
replayBtn.interactive = true;
replayBtn.buttonMode = true;
replayBtn.width = 100;
replayBtn.height = 100;
replayBtn.position.set(330,330);
replayBtn.on('pointerdown', reset);

// classes
class Star extends PIXI.Sprite {
    constructor(paralax) {
        super(PIXI.Texture.from('assets/star.png'))
        this.x = Math.random() * app.renderer.screen.width - 50;
        this.y = Math.random() * app.renderer.screen.height - 50;
        this.width = 100;
        this.height = 100;
        this.tint = Star.colors[Math.floor(Math.random() * Star.colors.length)]
        this.speed = paralax * 0.5;
    }

    update() {
        this.x -= this.speed;
        if(this.x < -15) {
            this.x += app.renderer.screen.width;
            this.y = Math.random() * app.renderer.screen.height - 50;
        }
    }

    static get colors() {
        return [
            '0xFFA52A',
            '0xE70707',
            '0xFFFF00',
            '0xF5F5F5',
            '0x919DFF',
            '0x4559FF'
        ]
    }
}

class SpaceShip extends PIXI.Sprite {
    constructor() {
        super(PIXI.Texture.from('assets/spaceship.png'))
        this.x = 50;
        this.y = app.renderer.screen.height / 2 - 50;
    }
}

class Meteorite extends PIXI.Sprite {
    constructor() {
        super(PIXI.Texture.from(Meteorite.textures[Math.floor(Math.random() * Meteorite.textures.length)]))
        this.x = app.renderer.screen.width + 50;
        this.y = Math.random() * app.renderer.screen.height;
        this.speed = meteoriteSpeed;
        this.pivot.x = this.width / 2;
        this.pivot.y = this.height / 2;
    }

    update() {
        this.rotation -= 0.008;
        this.x -= this.speed;
        if(this.x < -50) {
            this.x += app.renderer.screen.width + 50;
            this.y = Math.random() * app.renderer.screen.height;
        }
    }

    static get textures() {
        return [
            'assets/meteorite1.png',
            'assets/meteorite2.png',
            'assets/meteorite3.png'
        ]
    }
}

class Destroyer extends PIXI.Sprite {
    constructor() {
        super(PIXI.Texture.from('assets/destroyer.png'))
        this.x = app.renderer.screen.width + 50;
        this.y = Math.random() * app.renderer.screen.height;
        this.speed = destroyerSpeed;
        this.fireInterval = destroyerFireInterval;
    }

    update() {
        this.x -= this.speed;
        this.fireInterval += 1;
        if(this.x < -50) {
            this.x += app.renderer.screen.width + 50;
            this.y = Math.random() * app.renderer.screen.height;
        }
        if (this.fireInterval >= destroyerFireInterval) {
            this.fireInterval = 0;
            this.fireBullet();
        }
    }

    fireBullet() {
        if(state === game) {
            app.stage.addChild(new Bullet(this.x, this.y));
        }
    }
}

class Bullet extends PIXI.Sprite {
    constructor(positionX, positionY) {
        super(PIXI.Texture.from('assets/bullet.png'));
        this.x = positionX;
        this.y = positionY + 20;
        this.speed = bulletSpeed;
    }

    update() {
        this.x -= this.speed;
        if(this.x < -50) {
            app.stage.removeChild(this);
        }
    }
}

class ScoreBoardEntity extends PIXI.Text {
    constructor(value, positionArray, name) {
        super(value, {fontFamily: "Futura", fontSize: 16, fill: "white"});
        this.position.set(...positionArray);
        this.name = name;
    }
}

// Game generate function
function generate() {

    document.body.appendChild(app.view);
    for (let index = 0; index < starCount; index++) {
        app.stage.addChild(new Star(index % 3 + 1));
    }
    for (let index = 0; index < meteoriteCount; index++) {
        setTimeout(()=> {
            if(state === game) {
                app.stage.addChild(new Meteorite());
            }
        }, 1000 * index)
    }
    for (let index = 0; index < destroyerCount; index++) {
        setTimeout(()=> {
            if(state === game) {
                app.stage.addChild(new Destroyer());
            }
        }, 1000 * index + 2);
    }
    spaceShip = new SpaceShip();
    app.stage.addChild(spaceShip);
    app.stage.addChild(new ScoreBoardEntity("Your score: " + score, [10, 25], "score"));
    app.stage.addChild(new ScoreBoardEntity("Highest score: " + highestScore, [10, 10], "high score"));

    state = game;
}

function ticker() { 
    state()
}

// game loop function
function game() {
    ++counter;
    app.stage.children.forEach(child => {
        if(child.update != undefined) {
            child.update();
        }
        if(child instanceof ScoreBoardEntity && child.name === "score" && counter >= counterInterval) {
            ++score
            counter = 0;
            app.stage.removeChild(child);
            app.stage.addChild(new ScoreBoardEntity("Your score: " + score, [10, 25], "score"));
        }
        if((child instanceof Meteorite || child instanceof Destroyer || child instanceof Bullet) && basicCollisionCheck(app.stage.children.find(element => element instanceof SpaceShip), child)) {
            endScreenGenerate();
        }
    })

    if(spaceShip.position.y > 0 && (keys['w'] || keys['ArrowUp'])) {
        spaceShip.position.y -= spaceShipSpeed
    }

    if(spaceShip.position.y < app.renderer.screen.height - spaceShip.height && (keys['s'] || keys['ArrowDown'])) {
        spaceShip.position.y += spaceShipSpeed
    }
}

function gameOver() {
    // end state loop
}

// Basic collision function
function basicCollisionCheck(a, b) {
    let aBox = a.getBounds();
    let bBox = b.getBounds();

    return aBox.x + aBox.width > bBox.x &&
           aBox.x < bBox.x + bBox.width &&
           aBox.y + aBox.height > bBox.y &&
           aBox.y < bBox.y + bBox.height;
}

// Reset Game Function
function reset() {
    app.stage.removeChildren();
    app.renderer.backgroundColor = '0x000000';
    state = game;
    generate();
}

// End Game Function
function endScreenGenerate() {
    app.stage.removeChildren();
    app.renderer.backgroundColor = '0xFF2323';

    if(highestScore < score) {
        highestScore = score;
    }

    let endMessage = new PIXI.Text("You died! :(\n Your score: " + score + "\nHighest score: " + highestScore,{fontFamily: "Futura", fontSize: 32, fill: "black", align: 'center'})
    endMessage.position.set(250, 200);
    
    score = 0;

    app.stage.addChild(endMessage);
    app.stage.addChild(replayBtn);

    state = gameOver;
}

generate()