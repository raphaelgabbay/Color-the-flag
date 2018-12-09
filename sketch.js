var props = null;
var gui = null;
var playersArray;
var target;
var king;
var paused = false;
var lastColor;

Props = function() {
    this.color = [30, 30, 30, 50];
    this.maxNbPlayers = 100;
    this.playerMaxSpeed = 6.5;
    this.playerMaxForce = 0.226;
    this.playerVariance = 0.0;
    this.kingMaxSpeed = 7.0;
    this.separation = 10;
    this.kingMaxForce = 0.3;
    this.perception = 250;
    this.newPlayers = true;
    this.colorMode = false;
    this.colorBgMode = false;
    this.reset = function() {
        setup();
    };
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    if(props === null) {
        props = new Props();
    }
    if(gui === null) {
        gui = new dat.GUI();
        dat.GUI.toggleHide(); //Hide GUI by default
        gui.addColor(props, 'color').listen();
        gui.add(props, 'reset');
        gui.add(props, 'maxNbPlayers', 0, 1000);
        gui.add(props, 'playerMaxSpeed', 0, 15);
        gui.add(props, 'playerMaxForce', 0, 1.0);
        gui.add(props, 'playerVariance', 0, 10);
        gui.add(props, 'separation', 0, 50);
        gui.add(props, 'kingMaxSpeed', 0, 15);
        gui.add(props, 'kingMaxForce', 0, 1.0);
        gui.add(props, 'newPlayers');
        gui.add(props, 'colorMode');
        gui.add(props, 'colorBgMode');
        gui.add(props, 'perception', 0, max(windowWidth,windowHeight));
    }
    noStroke();
    playersArray = [];
    target = new Target(windowWidth/2, windowHeight/2);
    king = null;
    lastColor = props.color;
}

function draw() {
    let bgColor = lastColor;
    bgColor.push(50);
    background(bgColor);
    for(let i = 0; i < playersArray.length; i++) {
        playersArray[i].display();
    }
    target.display();
    if(king !== null) king.display();
    if(paused) return;
    for(let i = 0; i < playersArray.length; i++) {
        playersArray[i].chase();
        playersArray[i].separate();
        playersArray[i].update();
        if(dist(playersArray[i].pos.x, playersArray[i].pos.y, target.pos.x, target.pos.y) < 10) { //If a player gets to the target
            if(props.colorBgMode && props.colorMode) lastColor = playersArray[i].color;
            king = new King(playersArray[i].pos.x, playersArray[i].pos.y, playersArray[i]);
            king.diam = 15;
            playersArray.splice(i, 1); // Old king dies
            target.pos.x = king.pos.x; target.pos.y = king.pos.y; // Target is put onto the King
            if(props.newPlayers)playersArray.push(new Player(random(0, windowWidth), random(0, windowHeight))); // New player is introduced
            background(255); //Screen flashes
        }
    }
    if(king !== null) {
        king.flee();
        king.update();
    }
}

function doubleClicked() { //Places the target where the user double clicks
    target = new Target(mouseX, mouseY);
    playersArray.pop();playersArray.pop();
    if(king !== null) playersArray.push(new Player(king.pos.x, king.pos.y));
    king = null;
    //Update target for all players
    for(let i = 0; i < playersArray.length; i++) {
        playersArray[i].chasedTarget = target;
    }
}

function mouseDragged() { //Places a new player where the user clicks
    playersArray.push(new Player(mouseX, mouseY));
    if (playersArray.length > props.maxNbPlayers) playersArray.shift();
}

function mouseClicked() { //Places a new player where the user clicks
    playersArray.push(new Player(mouseX, mouseY));
    if (playersArray.length > props.maxNbPlayers) playersArray.shift();
}

class Target {
    constructor(X, Y) {
        this.pos = createVector(X, Y)
    }

    display() {
        push();
        if(props.colorMode) {
            fill('white');
        } else fill('red');
        ellipse(this.pos.x, this.pos.y, 5, 5);
    }
}

class Player {
    constructor(X, Y, oldPlayer) {
        this.pos = createVector(X, Y);
        if (oldPlayer) {
            // oldPlayer was passed and has truthy value
            this.vel = oldPlayer.vel
            this.acc = oldPlayer.acc
        } else {
            this.vel = createVector(0, 0);
            this.acc = createVector(0, 0);
        }
        this.chasedTarget = target;
        this.diam = 10;
        this.maxSpeed = props.playerMaxSpeed + abs(random(-props.playerVariance, props.playerVariance));
        this.maxForce = props.playerMaxForce + abs(random(-(props.playerVariance)/10, (props.playerVariance)/10));
        if(this.maxForce === 0 || this.maxSpeed === 0) {
            this.maxSpeed = props.playerMaxSpeed;
            this.maxForce = props.playerMaxForce;
        }

        if(props.colorMode) {
            this.color = [random(255), random(255), random(255)];
        } else this.color = [255, 255, 255];
    }

    display() {
        push();
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.diam, this.diam);
        pop();
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.wraparound();
    }

    applyForce(force) {
        this.acc.add(force);
    }

    // Wraparound
    wraparound() {
        if (this.pos.x < -(this.diam/2) || this.pos.y < -(this.diam/2) || this.pos.x > width + (this.diam/2) || this.pos.y > height + (this.diam/2)) {// After wraparound
            if(random(0,1) < (1/3)) {// 1 chance out of 3
                this.changeStrategy();
            }
        }

        if (this.pos.x < -this.diam/2) this.pos.x = width + this.diam/2;
        if (this.pos.y < -this.diam/2) this.pos.y = height + this.diam/2;
        if (this.pos.x > width + this.diam/2) this.pos.x = -this.diam/2;
        if (this.pos.y > height + this.diam/2) this.pos.y = -this.diam/2;
    }

    changeStrategy() {
        // this.maxSpeed = -this.maxSpeed;
        this.maxForce = -this.maxForce;
        // this.altStrat = !this.altStrat;
        // this.chasedTarget = new Target(width - target.pos.x, height - target.pos.y);
    }

    chase() {
        var desired = p5.Vector.sub(this.chasedTarget.pos, this.pos); // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxSpeed);
        // Steering = Desired minus Velocity
        var steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce); // Limit to maximum steering force
        this.applyForce(steer);
    }

    separate() {
        var steer = createVector(0, 0);
        var count = 0;
        // For every boid in the system, check if it's too close
        for (var i = 0; i < playersArray.length; i++) {
            var d = p5.Vector.dist(this.pos, playersArray[i].pos);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < props.separation)) {
                // Calculate vector pointing away from neighbor
                var diff = p5.Vector.sub(this.pos, playersArray[i].pos);
                diff.normalize();
                diff.div(d); // Weight by distance
                steer.add(diff);
                count++; // Keep track of how many
            }
        }
        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }

        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(props.playerMaxSpeed);
            steer.sub(this.vel);
            steer.limit(props.playerMaxForce);
        }
        this.applyForce(steer);
    }
}

class King extends Player{

    display() {
        push();
        if(props.colorMode) {
            fill('white');
        } else fill('red');
        ellipse(this.pos.x, this.pos.y, 15, 15);
        pop();
    }

    flee() {
        var steer = createVector(0, 0);
        var perception = props.perception;
        var count = 0;
        // For every boid in the system, check if it's too close
        for (let i = 0; i < playersArray.length; i++) {
            var d = p5.Vector.dist(this.pos, playersArray[i].pos);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < perception)) {
                // Calculate vector pointing away from neighbor
                var diff = p5.Vector.sub(this.pos, playersArray[i].pos);
                diff.normalize();
                diff.div(d); // Weight by distance
                steer.add(diff);
                count++; // Keep track of how many
            }
        }
        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }

        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(props.kingMaxSpeed);
            steer.sub(this.vel);
            steer.limit(props.kingMaxForce);
        }
        this.applyForce(steer);
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.wraparound();
        target.pos = this.pos;
    }

    wraparound() {
        if (this.pos.x < -this.diam/2 || this.pos.y < -this.diam/2 || this.pos.x > width + this.diam/2 || this.pos.y > height + this.diam/2) {// If wraparound
            for(let i = 0; i < playersArray.length; i++) {
                if(random(0,1) < (1/3)) {// 1 chance out of 3
                    playersArray[i].changeStrategy();
                }
            }
        }

        if (this.pos.x < -this.diam/2) this.pos.x = width + this.diam/2;
        if (this.pos.y < -this.diam/2) this.pos.y = height + this.diam/2;
        if (this.pos.x > width + this.diam/2) this.pos.x = -this.diam/2;
        if (this.pos.y > height + this.diam/2) this.pos.y = -this.diam/2;
    }
}

function keyPressed() {
    if (key === 'r') {
        setup();
    }
    if (key === 'p') {
        paused = !paused;
    }
}