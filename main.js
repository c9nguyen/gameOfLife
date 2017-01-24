var AM = new AssetManager();
var canvasWidth = 0;
var canvasHeight = 0;
var characters = [];
var food = [];

const WALK = 0;
const JUMP = 1;
const STAND = 2;

const characterFrameInfo = [
    {sheetWidth: 4, frames: 4},    //walk
    {sheetWidth: 1, frames: 1},    //jump
    {sheetWidth: 1, frames: 1}    //stand
]

function Animation(spriteSheet, frameWidth, frameHeight, sheetWidth, frameDuration, frames, loop, scale) {
    this.spriteSheet = spriteSheet;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.sheetWidth = sheetWidth;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.scale = scale;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y) {
    this.elapsedTime += tick;
    if (this.isDone()) {
        if (this.loop) this.elapsedTime = 0;
    }
    var frame = this.currentFrame();
    var xindex = 0;
    var yindex = 0;
    xindex = frame % this.sheetWidth;
    yindex = Math.floor(frame / this.sheetWidth);

    ctx.drawImage(this.spriteSheet,
                 xindex * this.frameWidth, yindex * this.frameHeight,  // source from sheet
                 this.frameWidth, this.frameHeight,
                 x, y,
                 this.frameWidth * this.scale,
                 this.frameHeight * this.scale);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

/*===============================================================*/

/**
 * The image object can be in a spritesheet or a normal image (which is a spritesheet with 1 frame)
 */
function NonAnimatedObject(game, spritesheet, x = 0, y = 0,
                frameWidth = spritesheet.width, frameHeight = spritesheet.height,
                sheetWidth = 1, frames = 1, frameIndex = 0, //If frameIndex = -1, pick a random frame
                scale = 1, width = frameWidth, height = frameHeight) { //default orignal size
    this.game = game; 
    this.ctx = game.ctx;
    this.spritesheet = spritesheet;
    this.x = x;
    this.y = y;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.width = width;
    this.height = height;
    this.scale = scale;

    var frame = frameIndex > 0 ? frameIndex : Math.floor(Math.random() * (frames));

    this.xindex = frame % sheetWidth;
    this.yindex = Math.floor(frame / sheetWidth);

    Entity.call(this, game, this.x, this.y);
};

NonAnimatedObject.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}

NonAnimatedObject.prototype.draw = function() {
    this.ctx.drawImage(this.spritesheet,
                 this.xindex * this.frameWidth, this.yindex * this.frameHeight,  // source from sheet
                 this.frameWidth, this.frameHeight,
                 this.x, this.y,
                 this.width * this.scale, this.height * this.scale);
}

NonAnimatedObject.prototype.update = function () {
};

/*===============================================================*/

/**
 * Object with animation
 */
function AnimatedObject(game, spritesheet, x = 0, y = 0,
                frameWidth, frameHeight,
                sheetWidth, frameDuration, frames, loop, 
                scale = 1, width = frameWidth, height = frameHeight) { //default orignal size

    this.game = game;
    this.animation = new Animation(spritesheet, frameWidth, frameHeight, sheetWidth, frameDuration, frames, loop, scale);                
    this.ctx = game.ctx;
    this.x = x;
    this.y = y;
    this.speed = 0;
    this.width = width;
    this.height = height;
    this.direction = 1;
    

    Entity.call(this, game, this.x, this.y);
};

AnimatedObject.prototype = Object.create(Entity.prototype);
AnimatedObject.prototype.constructor = AnimatedObject;

/**
 * Update the spritesheet for the animation
 */
AnimatedObject.prototype.updateFrameStat = function(spritesheet, frameWidth, frameHeight, sheetWidth, frameDuration, frames, loop) {
    this.animation = new Animation(spritesheet, frameWidth, frameHeight, sheetWidth, frameDuration, frames, loop, this.animation.scale);
    this.width = frameWidth;
    this.height = frameHeight; 
}

AnimatedObject.prototype.setSpeed = function(speed, direction = 1) {
    this.direction = direction;
    this.speed = speed;
}

AnimatedObject.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}

AnimatedObject.prototype.draw = function() {
    this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    Entity.prototype.draw.call(this);
}

AnimatedObject.prototype.update = function () {
    this.x += this.game.clockTick * this.speed * this.direction;
    if (this.x > canvasWidth) 
        this.x = -this.width;
    else if (this.x < -this.width)
        this.x = canvasWidth;
    Entity.prototype.update.call(this);
}

/*===============================================================*/

function Person(game, spritesheet = -1, x = 0, y = 0, //spritesheet = -1 will random a character
                frameDuration, scale = 1) { //default orignal size
    this.status = STAND;
    this.life = 15;
    this.frameInfo = characterFrameInfo[this.status];
    if (spritesheet > -1) this.personSpriteSheetDirections = characters[spritesheet];
    else this.personSpriteSheetDirections = characters[Math.floor(Math.random() * characters.length)];
    
    this.personSpritesheet = this.personSpriteSheetDirections.right;
    
    //calculating frames since each character has different frame dimension
    var frameWith = this.personSpritesheet[this.status].width / this.frameInfo.sheetWidth;
    var frameHeight = this.personSpritesheet[this.status].height;

    AnimatedObject.call(this, game, this.personSpritesheet[this.status], x, y,
                        frameWith, frameHeight,
                        this.frameInfo.sheetWidth, frameDuration, this.frameInfo.frames, true, 
                        scale, frameWith, frameHeight); 
    
    //gravity default true
    this.gravity = true;
};

Person.prototype = Object.create(AnimatedObject.prototype);
Person.prototype.constructor = Person;

/**
 * Change status action of character
 */
Person.prototype.changeStatus = function (status) {
    if (characterFrameInfo[status] !== undefined && this.status !== status) {
        this.status = status;
        this.frameInfo = characterFrameInfo[this.status];
        var spritesheet = this.personSpritesheet[this.status];
        var frameWith = spritesheet.width / this.frameInfo.sheetWidth;
        var frameHeight = spritesheet.height;

        this.updateFrameStat(spritesheet, frameWith, frameHeight,
                        this.frameInfo.sheetWidth, this.animation.frameDuration, this.frameInfo.frames, true);
    }
}

/**
 * Turn arround
 */
Person.prototype.flip = function () {
    if (this.direction === 1) {
        this.personSpritesheet = this.personSpriteSheetDirections.left;
        this.direction = -1;       
    } else {
        this.personSpritesheet = this.personSpriteSheetDirections.right;
        this.direction = 1;
    }
    this.animation.spriteSheet = this.personSpritesheet[this.status];
}

Person.prototype.update = function () {
    AnimatedObject.prototype.update.call(this);
    if (this.life > 0) this.life -= this.game.clockTick;
    if (this.life < 0) {
        this.removeFromWorld = true; //die
        this.game.addEntity(new Tomb(this.game, this.x, this.y));
    } 
    //ground hit box
    this.groundHitBox = {x: this.x, y: this.y + this.height - 5, width: this.width, height: 7};
    this.colliseBox = {x: this.x, y: this.y, width: this.width, height: this.height};

    //Got food
    for (var i in this.game.food) {
        if (this.game.food[i].active && collise(this.colliseBox, this.game.food[i].colliseBox)) {
            this.game.food[i].deactivate();
            this.life = 15;

            if (this.life >= 8) {   //preproduce only health is above 8
                var person = new Person(this.game, -1, this.x, this.y, 0.1, 1);
                person.changeStatus(WALK);
                person.setSpeed(200, this.direction);
                person.flip();
                this.game.addEntity(person);
                break;
            }
        }
    }

    for (var i in this.game.portals) {
        if (collise(this.colliseBox, this.game.portals[i].colliseBox)) {
            this.yVelocity = -Math.floor(Math.random() * 1000 + 500);
            var random = Math.floor(Math.random());
            if (random == 0) this.flip();
        }
    }

    var groundCollisionBox = this.game.collisionBox.ground;
    if (this.yVelocity >= 0) {
        for (var box in groundCollisionBox) {
            if (collise(this.groundHitBox, groundCollisionBox[box])) {
                this.y = groundCollisionBox[box].y - this.height;
                this.changeStatus(WALK);
                this.gravity = false;
                return;
            }
        }
    }
    this.changeStatus(JUMP);
    this.gravity = true;
}

Person.prototype.draw = function() {
    AnimatedObject.prototype.draw.call(this);
//    this.ctx.fillRect(this.colliseBox.x, this.colliseBox.y, this.colliseBox.width, this.colliseBox.height);
}

/*===============================================================*/

function Portal(game, spritesheet, x = 0, y = 0, //spritesheet = -1 will random a character
                sheetWidth, frameDuration, frames, loop, scale = 1) { //default orignal size
    
    //calculating frames since each character has different frame dimension
    var frameWith = spritesheet.width / sheetWidth;
    var frameHeight = spritesheet.height / Math.ceil(frames/sheetWidth);

    AnimatedObject.call(this, game, spritesheet, x, y,
                        frameWith, frameHeight,
                        sheetWidth, frameDuration, frames, loop, 
                        scale, frameWith, frameHeight); 
    // console.log(y);
    // console.log(frameHeight / 2 + y);
    
    this.colliseBox = {x: frameWith / 3 + x, y: frameHeight / 1.5 + y, width: frameWith / 4, height: frameHeight / 3}; 
};

Portal.prototype = Object.create(AnimatedObject.prototype);
Portal.prototype.constructor = Portal;

Portal.prototype.draw = function() {
    AnimatedObject.prototype.draw.call(this);
//    this.ctx.fillRect(this.colliseBox.x, this.colliseBox.y, this.colliseBox.width, this.colliseBox.height);
}

/*===============================================================*/

function Food(game, x, y) {
    this.active = true;
    this.cooldown = 0;
    Entity.call(this, game, x, y);

    this.activate();
    this.colliseBox = {x: x, y: y, width: 30, height: 30};
}

Food.prototype = Object.create(Entity.prototype);
Food.prototype.constructor = Food;

Food.prototype.activate = function() {
    this.active = true;
    var ran = Math.floor(Math.random() * 4);

    this.nonAnimatedObject = new NonAnimatedObject(this.game, AM.getAsset("./img/food/spritesheet.png"), this.x, this.y,
                                                    33, 34, 4, 4, -1, 1);
}

Food.prototype.deactivate = function() {
    this.active = false;
    this.cooldown = 5;
}

Food.prototype.draw = function() {
    if (this.active) this.nonAnimatedObject.draw();
}

Food.prototype.update = function() {
    if (this.cooldown > 0) this.cooldown -= this.game.clockTick;
    if (this.cooldown < 0)  this.cooldown = 0;
    if (this.cooldown <= 0 && !this.active) this.activate();
}

/*===============================================================*/

function Tomb(game, x, y) {
    NonAnimatedObject.call(this, game, AM.getAsset("./img/tomb.png"), x, y);
    this.gravity = true;
    this.yVelocity = -400;
    this.colliseBox = {x: x, y: y + 33, width: 40, height: 10}; 
}

Tomb.prototype = Object.create(NonAnimatedObject.prototype);
Tomb.prototype = Tomb;

Tomb.prototype.update = function() {
    if (this.gravity === true) {
        this.colliseBox = {x: this.x, y: this.y + 33, width: 40, height: 5};

        if (this.yVelocity >= 0) {
            for (var box in this.game.collisionBox.ground) {
                if (collise(this.colliseBox, this.game.collisionBox.ground[box])) {
                    this.y = this.game.collisionBox.ground[box].y - this.height;
                    this.gravity = false;
                    return;
                }
            }
        }
    }

}

Tomb.prototype.draw = function() {
    NonAnimatedObject.prototype.draw.call(this);
}

/*===============================================================*/

AM.queueDownload("./img/back/cloud.png");
AM.queueDownload("./img/back/sky.png");
AM.queueDownload("./img/back/back.png");
AM.queueDownload("./img/back/1.png");
AM.queueDownload("./img/back/2.png");

AM.queueDownload("./img/tiles/en_spritesheet.png");
AM.queueDownload("./img/tiles/en1_spritesheet.png");
AM.queueDownload("./img/tiles/bsc_spritesheet.png");

AM.queueDownload("./img/character/person1_walk1_left.png");
AM.queueDownload("./img/character/person1_walk1_right.png");
AM.queueDownload("./img/character/person1_jump_left.png");
AM.queueDownload("./img/character/person1_jump_right.png");
AM.queueDownload("./img/character/person1_stand_left.png");
AM.queueDownload("./img/character/person1_stand_right.png");

AM.queueDownload("./img/character/person2_walk1_left.png");
AM.queueDownload("./img/character/person2_walk1_right.png");
AM.queueDownload("./img/character/person2_jump_left.png");
AM.queueDownload("./img/character/person2_jump_right.png");
AM.queueDownload("./img/character/person2_stand_left.png");
AM.queueDownload("./img/character/person2_stand_right.png");

AM.queueDownload("./img/character/person3_walk1_left.png");
AM.queueDownload("./img/character/person3_walk1_right.png");
AM.queueDownload("./img/character/person3_jump_left.png");
AM.queueDownload("./img/character/person3_jump_right.png");
AM.queueDownload("./img/character/person3_stand_left.png");
AM.queueDownload("./img/character/person3_stand_right.png");

AM.queueDownload("./img/character/person4_walk1_left.png");
AM.queueDownload("./img/character/person4_walk1_right.png");
AM.queueDownload("./img/character/person4_jump_left.png");
AM.queueDownload("./img/character/person4_jump_right.png");
AM.queueDownload("./img/character/person4_stand_left.png");
AM.queueDownload("./img/character/person4_stand_right.png");

AM.queueDownload("./img/back/portal.png");
AM.queueDownload("./img/food/spritesheet.png");
AM.queueDownload("./img/tomb.png");

AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

 

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();
    loadCharacter();

    buildingBackground(gameEngine);
    buildTiles(gameEngine);

    var person = new Person(gameEngine, -1, 400, 50, 0.1, 1);
    person.changeStatus(WALK);
    person.setSpeed(200, 1);
    gameEngine.addEntity(person);

    person = new Person(gameEngine, -1, 400, 500, 0.1, 1);
    person.yVelocity = - 1500;
    person.changeStatus(WALK);
    person.setSpeed(200, 1);
    gameEngine.addEntity(person);

    person = new Person(gameEngine, -1, 400, 500, 0.1, 1);
    person.yVelocity = - 1000;
    person.changeStatus(WALK);
    person.setSpeed(200, 1);
    gameEngine.addEntity(person);

    person = new Person(gameEngine, -1, 400, 500, 0.1, 1);
    person.yVelocity = - 1000;
    person.changeStatus(WALK);
    person.setSpeed(200, 1);
    gameEngine.addEntity(person);

    var food = new Food(gameEngine, 450, 80);
    gameEngine.addEntity(food);
    gameEngine.food.push(food);

    food = new Food(gameEngine, 750, 80);
    gameEngine.addEntity(food);
    gameEngine.food.push(food);
    
    food = new Food(gameEngine, 370, 200);
    gameEngine.addEntity(food);
    gameEngine.food.push(food);

    food = new Food(gameEngine, 780, 200);
    gameEngine.addEntity(food);
    gameEngine.food.push(food);

    placePortals(gameEngine);
});

function buildingBackground(gameEngine) {
    var back = new NonAnimatedObject(gameEngine, AM.getAsset("./img/back/sky.png"),0, 0);
    back.setSize(canvasWidth, canvasHeight);
    gameEngine.addEntity(back);

    back = new NonAnimatedObject(gameEngine, AM.getAsset("./img/back/cloud.png"),0, 0);
    gameEngine.addEntity(back);

    back = new NonAnimatedObject(gameEngine, AM.getAsset("./img/back/back.png"), 0, 250);
    gameEngine.addEntity(back);

    back = new AnimatedObject(gameEngine, AM.getAsset("./img/back/1.png"), 100, 50,
                            72, 168,6, 0.1, 6,true,1);
    gameEngine.addEntity(back);

    back = new AnimatedObject(gameEngine, AM.getAsset("./img/back/2.png"), 900, 50,
                            267, 147, 2, 0.3, 6, true, 1);
    gameEngine.addEntity(back);
}

function loadCharacter() {
    for (var i = 1 ; i <= 4; i++) {
        characters[i - 1] = {
            left:[
                AM.getAsset("./img/character/person" + i + "_walk1_left.png"),  //walk
                AM.getAsset("./img/character/person" + i + "_jump_left.png"),   //jump
                AM.getAsset("./img/character/person" + i + "_stand_left.png")   //stand
            ], 
            right:[
                AM.getAsset("./img/character/person" + i + "_walk1_right.png"),
                AM.getAsset("./img/character/person" + i + "_jump_right.png"),
                AM.getAsset("./img/character/person" + i + "_stand_right.png")            
            ]
        }
    }
}

function buildTiles(gameEngine) {
    var gameEngine = gameEngine;
    var groundCollisionBox = gameEngine.collisionBox.ground;


    var numOfTile = Math.ceil(canvasWidth / 90) + 2;
    var groundX = -97;
    
    for (var i = 0; i < numOfTile; i++) {
        //Building the bottom ground
        groundCollisionBox.push({x: groundX, y: canvasHeight - 87, width: 90, height: 20});
        gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en_spritesheet.png"), 
                                                    groundX, canvasHeight - 97,
                                                    90, 37, 2, 3, -1, 1));
        gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/bsc_spritesheet.png"), 
                                                    groundX, canvasHeight - 60,
                                                    90, 60, 2, 6, -1, 1));

        //Building second floor     
        if (i !== 1 && i !== numOfTile / 2 && i !== numOfTile / 2 - 1 && i < numOfTile - 3) {
            groundCollisionBox.push({x: groundX, y: canvasHeight - 222, width: 90, height: 20});
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en_spritesheet.png"), 
                                                        groundX, canvasHeight - 232,
                                                        90, 37, 2, 3, -1, 1));
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en1_spritesheet.png"), 
                                                        groundX, canvasHeight - 200,
                                                        90, 32, 2, 3, -1, 1));
        }

        //Building third floor       
        if ((i < numOfTile / 2 - 3) || (i === numOfTile / 2) || (i === numOfTile / 2 - 1) || (i > numOfTile / 2 + 2))  {
            groundCollisionBox.push({x: groundX, y: canvasHeight - 342, width: 90, height: 20});
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en_spritesheet.png"), 
                                                        groundX, canvasHeight - 352,
                                                        90, 37, 2, 3, -1, 1));
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en1_spritesheet.png"), 
                                                        groundX, canvasHeight - 320,
                                                        90, 32, 2, 3, -1, 1));
        }

        //Building fourth floor
        if (i !== 1 && i !== numOfTile / 2 && i !== numOfTile / 2 - 1 && i < numOfTile - 2) {
            groundCollisionBox.push({x: groundX, y: canvasHeight - 462, width: 90, height: 20});
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en_spritesheet.png"), 
                                                        groundX, canvasHeight - 472,
                                                        90, 37, 2, 3, -1, 1));
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en1_spritesheet.png"), 
                                                        groundX, canvasHeight - 440,
                                                        90, 32, 2, 3, -1, 1));
        }

        //Building fifth floor
        if (i < numOfTile / 2 + 3 && i > numOfTile / 2 - 4) {
            groundCollisionBox.push({x: groundX, y: canvasHeight - 582, width: 90, height: 20});
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en_spritesheet.png"), 
                                                        groundX, canvasHeight - 592,
                                                        90, 37, 2, 3, -1, 1));
            gameEngine.addEntity(new NonAnimatedObject(gameEngine, AM.getAsset("./img/tiles/en1_spritesheet.png"), 
                                                        groundX, canvasHeight - 560,
                                                        90, 32, 2, 3, -1, 1));
        }

        groundX += 90;
    }
}

function placePortals(gameEngine) {
    var canvas = canvas;
    var gameEngine = gameEngine;

    var dist = 370;
    
    for (var i = 0; i < 4; i++) {
        var portal = new Portal(gameEngine, AM.getAsset("./img/back/portal.png"), dist * i, canvasHeight - 219, 4, 0.1, 8, true, 1);
        gameEngine.addEntity(portal);
        gameEngine.portals.push(portal);
    } 
}