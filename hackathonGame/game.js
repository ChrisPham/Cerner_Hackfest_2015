window.onload = function() {	
	var innerWidth = window.innerWidth;
	var innerHeight = window.innerHeight;
	var gameRatio = innerWidth/innerHeight;	
	var game = new Phaser.Game(Math.ceil(480*gameRatio), 480, Phaser.CANVAS);	
	var ninja;
	var ninjaGravity = 800;
	var ninjaJumpPower;    
	var score=0;
	var scoreText;
     var topScore;
     var powerBar;
     var powerTween;
     var placedPoles;
	var poleGroup; 
	var platforms;
     var minPoleGap = 100;
     var maxPoleGap = 300; 
     var ninjaJumping;
     var ninjaFallingDown;     
     var play = function(game){}     
     play.prototype = {
		preload:function(){
			game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			game.scale.setScreenSize(true);
			game.load.image("ninja", "ninja.png"); 
			game.load.image("pole", "pole.png");
			game.load.image("ground","floor.png");
            game.load.image("powerbar", "powerbar.png");
            game.load.image('ground', 'assets/platform.png');
    		game.load.image('star', 'assets/star.png');
    		game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
		},
		create:function(){
			ninjaJumping = false;
			ninjaFallingDown = false;
			score = 0;
			placedPoles = 0;
			poleGroup = game.add.group();
			topScore = localStorage.getItem("topFlappyScore")==null?0:localStorage.getItem("topFlappyScore");
			scoreText = game.add.text(10,10,"-",{
				font:"bold 16px Arial"
			});
			updateScore();
			game.stage.backgroundColor = "#87CEEB";
			game.physics.startSystem(Phaser.Physics.ARCADE);
			ninja = game.add.sprite(game.width/2,0,"dude");
			ninja.anchor.set(0.5);
			ninja.lastPole = 1;
			game.physics.arcade.enable(ninja);              
			ninja.body.gravity.y = ninjaGravity;
			//game.input.onDown.add(prepareToJump, this);
			ninja.body.collideWorldBounds = true;
			//  Our two animations, walking left and right.
		    ninja.animations.add('left', [0, 1, 2, 3], 10, true);
		    ninja.animations.add('right', [5, 6, 7, 8], 10, true);
			addPole(80);
			
			platforms = game.add.group();
			//  We will enable physics for any object that is created in this group
			platforms.enableBody = true;
			// Here we create the ground.
			var ground = platforms.create(0, game.world.height - 64, 'ground');
			//  Scale it to fit the width of the game (the original sprite is 400x32 in size)
			ground.scale.setTo(2, 3);
			//  This stops it from falling away when you jump on it
			ground.body.immovable = true;
		},
		update:function(){
			game.physics.arcade.collide(ninja, poleGroup, checkLanding);
			game.physics.arcade.collide(ninja, platforms, onGround);
			if(ninja.y>game.height){
				die();
			}
			ninja.body.velocity.x = 0;

			cursors = game.input.keyboard.createCursorKeys();
			if (cursors.left.isDown)
		    {
		        //  Move to the left
		        ninja.body.velocity.x = -200;

		        ninja.animations.play('left');
		    }
		    else if (cursors.right.isDown)
		    {
		        //  Move to the right
		        ninja.body.velocity.x = 200;

		        ninja.animations.play('right');
		    }
		    else
		    {
		        //  Stand still
		        ninja.animations.stop();

		        ninja.frame = 4;
		    }

		    //  Allow the player to jump if they are touching the ground.
		    if (cursors.up.isDown && ninja.body.touching.down)
		    {
		        ninja.body.velocity.y = -600;
		    }
		}
	}     
     game.state.add("Play",play);
     game.state.start("Play");
	function updateScore(){
		scoreText.text = "Score: "+score+"\nBest: "+topScore;	
	}     
	  
     function addNewPoles(){
     	var maxPoleX = 0;
		poleGroup.forEach(function(item) {
			maxPoleX = Math.max(item.x,maxPoleX)			
		});
		var nextPolePosition = maxPoleX + game.rnd.between(minPoleGap,maxPoleGap);
		addPole(nextPolePosition);			
	}
	function addPole(poleX){
		if(poleX<game.width*2){
			placedPoles++;
			var pole = new Pole(game,poleX,game.rnd.between(250,380));
			game.add.existing(pole);
	          pole.anchor.set(0.5,0);
			poleGroup.add(pole);
			var nextPolePosition = poleX + game.rnd.between(minPoleGap,maxPoleGap);
			addPole(nextPolePosition);
		}
	}	
	function die(){
		localStorage.setItem("topFlappyScore",Math.max(score,topScore));	
		game.state.start("Play");
	}
	function onGround(n,g) {
		if(n.y <= g.y + n.y/2) {
			if(Math.abs(border)>20){
				var border = n.x-g.x
				n.body.velocity.x=border*2;
				n.body.velocity.y=-200;	
			}
			if(ninjaJumping){
               	ninjaJumping = false;              
               	game.input.onDown.add(prepareToJump, this);
          	}
		}
	}
	function checkLanding(n,p){
		if(p.y>=n.y+n.height/2){
			var border = n.x-p.x
			if(Math.abs(border)>20){
				n.body.velocity.x=border*2;
				n.body.velocity.y=-200;	
			}
			var poleDiff = p.poleNumber-n.lastPole;
			if(poleDiff>0){
				score+= Math.pow(2,poleDiff);
				updateScore();	
				n.lastPole= p.poleNumber;
			}
			if(ninjaJumping){
               	ninjaJumping = false;              
               	game.input.onDown.add(prepareToJump, this);
          	}
		}
		else{
			ninjaFallingDown = true;
			poleGroup.forEach(function(item) {
				item.body.velocity.x = 0;			
			});
		}			
	}
	Pole = function (game, x, y) {
		Phaser.Sprite.call(this, game, x, y, "pole");
		game.physics.enable(this, Phaser.Physics.ARCADE);
          this.body.immovable = true;
          this.poleNumber = placedPoles;
	};
	Pole.prototype = Object.create(Phaser.Sprite.prototype);
	Pole.prototype.constructor = Pole;
	Pole.prototype.update = function() {
          // if(ninjaJumping && !ninjaFallingDown){
        this.body.velocity.x = -175;
          // }
          // else{
          //      this.body.velocity.x = 0
          // }
		if(this.x<-this.width){
			this.destroy();
			addNewPoles();
		}
	}	
}