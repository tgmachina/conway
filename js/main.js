$(function(){
	var sim = (function(){
		var world = undefined;
		var worldAttrs = {};

		var public = {
			setWorld: function(w){
				world = w;
			},

			getWorld: function(){
				return world;
			},

			getWorldAttrs: function(){
				return worldAttrs;
			}
		};

		return public;
	})();

	function reset(event, numRows, numCols, radius){
		$('#lifeContainer').empty();
		var wAttrs = sim.getWorldAttrs();
		var numRows = numRows || wAttrs.numRows;
		var numCols = numCols || wAttrs.numCols;
		var radius  = radius || wAttrs.radius;
		var w = new World(numRows, numCols, radius);
		sim.setWorld(w);
		w.init(undefined, "#lifeContainer");
		w.draw([]);
		return w;
	}

	function start(){
		var wAttrs = sim.getWorldAttrs();
		var numRows  = parseInt($('#rowInput').val());
		var numCols  = parseInt($('#colInput').val());
		var radius   = parseInt($('#radiusInput').val());
		wAttrs.numRows = numRows;
		wAttrs.numCols = numCols;
		wAttrs.radius = radius;
		
		var w = sim.getWorld();

		if(!w){
			w = reset(null, numRows, numCols, radius);
		}
		if(!w.scenario){
			w.run();
		}
	}

	function stop(){
		var w = sim.getWorld();
		if(w){
			w.halt();
		}
	}
	
	$('#start').on('click', start);

	$('#stop').on('click', stop);

	$('#reset').on('click', reset);
});
