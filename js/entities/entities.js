/**
 * Player Entity
 */
game.PlayerEntity = me.Entity.extend({

    /**
     * constructor
     */
    init:function (x, y, settings) {
        // call constructor
        this._super(me.Entity, 'init', [x, y , settings]);

        // set velocidade (accel vector)
        this.body.setVelocity(3, 15);

        // seguir a posição no viewport
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

        // ensure the player is updated even when outside of the viewport
        this.alwaysUpdate = true;

        // define walking animation (all frames)
        this.renderable.addAnimation("walk",  [0, 1, 2, 3, 4, 5, 6, 7]);
        // define standing animation (primeira frame neste caso mas pode ser outra)
        this.renderable.addAnimation("stand",  [0]);
        // escolher qual é a default animation
        this.renderable.setCurrentAnimation("stand");
    },

    /**
     * atualizar entidade
     */
    update : function (dt) {

        if (me.input.isKeyPressed('left')) {
            // flip the sprite on horizontal axis
            this.renderable.flipX(true);
            // entity velocity
            this.body.vel.x -= this.body.accel.x * me.timer.tick;
            // walking animation
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        } else if (me.input.isKeyPressed('right')) {
            // unflip the sprite
            this.renderable.flipX(false);
            // update the entity velocity
            this.body.vel.x += this.body.accel.x * me.timer.tick;
            // change to the walking animation
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        } else {
            this.body.vel.x = 0;
            // change to the standing animation
            this.renderable.setCurrentAnimation("stand");
        }

        if (me.input.isKeyPressed('jump')) {
            // verificação se está a saltar ou cair
            if (!this.body.jumping && !this.body.falling) {
                // set current vel to the maximum defined value
                // gravity will then do the rest
                this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                // estado
                this.body.jumping = true;
            }
        }

        // apply physics to the body (this moves the entity) -- atualizar a entidade
        this.body.update(dt);

        // colisões
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

   /**
     * colision handler
     */
   onCollision : function (response, other) {
       switch (response.b.body.collisionType) {
           //caso colida mundo
           case me.collision.types.WORLD_SHAPE:
               //platform ou o que for usado no tiled--
               if (other.type === "platform") {
                   if (this.body.falling && !me.input.isKeyPressed('down') && (response.overlapV.y > 0) && (~~this.body.vel.y >= ~~response.overlapV.y)) {
                       // desligar colisao x
                       response.overlapV.x = 0;
                       //se for solida
                       return true;
                   }

                   return false;
               }
               break;
           //caso colida inimigo
           case me.collision.types.ENEMY_OBJECT:
               if ((response.overlapV.y>0) && !this.body.jumping) {
                   // forçar salto
                   this.body.falling = false;
                   this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                   // ativar estado salto
                   this.body.jumping = true;
               }
               else {
                   this.renderable.flicker(750);
               }
               return false;
               break;

           default:
               // Do not respond to other objects
               return false;
       }

       // Make the object solid
       return true;
   }
});

/**
 *entidade moeda
 */
game.CoinEntity = me.CollectableEntity.extend({
    // extending the init function is not mandatory
    // unless you need to add some extra initialization
    init: function(x, y, settings) {
        // call the parent constructor
        this._super(me.CollectableEntity, 'init', [x, y , settings]);

    },

    // this function is called by the engine, when
    // an object is touched by something (here collected)
    onCollision : function (response, other) {

        game.data.score+=100;

        // verificar que só é colidido uma vez
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);


        me.game.world.removeChild(this);

        return false
    }
});

/**
 *inimigo
 */
game.EnemyEntity = me.Entity.extend({
    init: function(x, y, settings) {
        // este setting pode ser mudado no tiled também
        settings.image = "wheelie_right";

        // save the area size defined in Tiled
        var width = settings.width;
        var height = settings.height;

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 64;
        settings.frameheight = settings.height = 64;

        // redefine the default shape (used to define path) with a shape matching the renderable
        settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        // call constructor
        this._super(me.Entity, 'init', [x, y , settings]);

        // pos inicial e final baseada na area inicial, not sure if perfect
        x = this.pos.x;
        this.startX = x;
        this.endX   = x + width - settings.framewidth;
        this.pos.x  = x + width - settings.framewidth;

        // guardar o lado
        this.walkLeft = false;

        // velocidade andar e saltar
        this.body.setVelocity(4, 6);

    },

    // movimento
    update: function(dt) {

        if (this.alive) {
            if (this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
            } else if (!this.walkLeft && this.pos.x >= this.endX) {
                this.walkLeft = true;
            }
            // walk
            this.renderable.flipX(this.walkLeft);
            this.body.vel.x += (this.walkLeft) ? -this.body.accel.x * me.timer.tick : this.body.accel.x * me.timer.tick;

        } else {
            this.body.vel.x = 0;
        }

        // atualizar o movimento
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    /**
     * colision handler
     */
    onCollision : function (response, other) {
        if (response.b.body.collisionType !== me.collision.types.WORLD_SHAPE) {
            //quando se salta em cima dá flicker
            if (this.alive && (response.overlapV.y > 0) && response.a.body.falling) {
                this.renderable.flicker(750);
            }
            return false;
        }
        // Make all other objects solid
        return true;
    }
});

me.pool.register("mainPlayer", game.PlayerEntity);
me.pool.register("CoinEntity", game.CoinEntity);
me.pool.register("EnemyEntity", game.EnemyEntity);