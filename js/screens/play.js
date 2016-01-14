game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {

        //fazer load do nivel
        //me.levelDirector.loadLevel("");

        // reset the score
        game.data.score = 0;

        // add our HUD to the game world
        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD);

        game.HUD = game.HUD || {};


        game.HUD.Container = me.Container.extend({

            init: function() {
                // call the constructor
                this._super(me.Container, 'init');

                // persistent across level change
                this.isPersistent = true;

                // make sure we use screen coordinates
                this.floating = true;

                // make sure our object is always draw first
                this.z = Infinity;

                // give a name
                this.name = "HUD";

                // add our child score object at the right-bottom position
                this.addChild(new game.HUD.ScoreItem(630, 440));
            }
        });

        /**
         * a basic HUD item to display score
         */

        game.HUD.ScoreItem = me.Renderable.extend({

            /**
             * constructor
             */
            init: function(x, y) {

                // call the parent constructor
                // (size does not matter here)
                this._super(me.Renderable, 'init', [x, y, 10, 10]);


                // local copy of the global score
                this.score = -1;
            },

            /**
             * update function
             */
            update : function (dt) {
                // we don't do anything fancy here, so just
                // return true if the score has been updated
                if (this.score !== game.data.score) {
                    this.score = game.data.score;
                    return true;
                }
                return false;
            },

            /**
             * draw
             */
            draw : function (renderer) {
            }
        });
    },


    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        // remove the HUD from the game world
        me.game.world.removeChild(this.HUD);
    }
});
