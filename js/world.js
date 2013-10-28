/*
 * Describes the world in which cells live in. Responsible for management and drawing of cells
 */

function World(rows, cols, cellRadius){
	this.rows = rows || 50;
	this.cols = cols || 50;
	this.radius = cellRadius || 10;
	//Used to measure canvas size and compute how large cell drawings should be
	//Use the rows, cols and cell radius to compute appropriate width/height of the svg
	this.width = this.cols * 2 * this.radius;
	this.height = this.rows * 2 * this.radius;

	this.grid = [];
	this.svg;
	
};

World.prototype.init = function(seeder, SVGContainer){
	this.initializeGrid();
	this.seedGrid(seeder);
	this.setupSVG(SVGContainer);
};

World.prototype.initializeGrid = function(){
	this.grid = [];
	for(var r=0; r < this.rows; r++){
		this.grid[r] = [];
		for(var c=0; c < this.cols; c++){
			this.grid[r][c] = new Cell();
		}
	}
};

World.prototype.seedGrid = function(seeder){
	//Provide an interface to input a custom seeder and default
	//to a simple mechanism for seeding the initial grid 
	if(typeof seeder === 'undefined') {
		seeder = function(){
			return (Math.floor(Math.random()*100) < 40);
		}
	}

	for(var r=0; r < this.rows; r++){
		for(var c=0; c < this.cols; c++){
			if(seeder(r,c)){
				this.grid[r][c].spawn();
			} else {
				this.grid[r][c].kill();
			}
		}
	}
};

World.prototype.seedFromTupleList = function(tuples){
	//Allow seeding from a preconfigured list of points. Useful
	//for seeding the map with common conway shapes (gliders, etc)
	for(var tuple in tuples){
		var point = tuples[tuple];
		console.log(point);
		this.grid[point[0]][point[1]].spawn();
	}
};

/*
 * Drawing functions
 */

World.prototype.printGridToConsole = function(){
	//Utility method for when the SVG doesn't work
	var textGrid = '';
	for(var r=0; r < this.rows; r++){
		var row = '';
		for(var c=0; c < this.cols; c++){
			row += this.grid[r][c].isAlive() ? 'o' : ' ';
		}
		textGrid += row + '\n';
	}
	console.clear();
	console.log(textGrid);
};

World.prototype.setupSVG = function(container){
	container = container || "body";
	this.svg = d3.select(container).append("svg")
		.attr("width", this.width)
		.attr("height", this.height);
};

World.prototype.createSVGData = function(){
	var data = [];
	var currRowLen = 0;
	var currColLen = 0;

	for(var r = 0; r < this.rows; r++){
		var rowOffset = (r === 0) ? this.radius : 2 * this.radius;
		currRowLen += rowOffset;
		for(var c = 0; c < this.cols; c++){
			var colOffset = (c === 0) ? this.radius : 2 * this.radius;
			currColLen += colOffset;
			var currCell = this.grid[r][c];
			if(currCell.isAlive()){
				//Load the current, living cells attributes along with 
				//positioning information so that D3 can properly render
				//the set to SVG
				data.push({
					x: currColLen,
					y: currRowLen,
					r: this.radius,
					//Unique "vector" notation 
				 	v: currColLen + "i + " + currRowLen + "j", 
					lifeSpan: currCell.getLifespan()	
				});
			}
		}
		currColLen = 0;
	}
	
	return data;
};

World.prototype.draw = function(data){
	var colors = ["blue", "green", "red", "pink", "orange", "purple"];
	//D3 operates by joining sets of data as they're recomputed. By binding
	//all circles to the data set, providing a unique key to identify them
	//(d.v + d.lifeSpan), and finally defining enter and exit selections, D3
	//will appropriately render each cell into the SVG--blazingly fast!
	var circle = this.svg.selectAll("circle")
			.data(data, function(d) { return d.v + d.lifeSpan; });

	circle.enter()
		.append("circle")
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
		.attr("class", ".enter")
		//.attr("r", 0)
	//.transition()
		.style("fill", function(d){ return colors[d.lifeSpan] || 'black' })
		.attr("r", function(d) { return d.r; });

	circle.exit()
		.attr("r", 0)
		.remove();
};


World.prototype.update = function(metric){
	var worldData = this.getWorldData(metric);

	for(var r = 0; r < this.rows; r++){
		for(var c = 0; c < this.cols; c++){
			var currentCell = this.grid[r][c];
			this.applyRules(currentCell, worldData[r][c].livingNeighbors);
		}
	}
	this.draw(this.createSVGData());
	
	//Send back the worldData for further use with auxillary functions
	//to compute average age, etc..
	return worldData;
};

World.prototype.getWorldData = function(metric){
	var census = [];
	
	for(var r = 0; r < this.rows; r++){
		census[r] = [];
		for(var c = 0; c < this.cols; c++){
			census[r][c] = {};
			census[r][c].livingNeighbors = this.findLivingNeighbors(r,c);
			//Later to be used to gather other stats on cells within the world
			if(typeof metric === 'function'){
				metric.apply(this, [census[r][c]]);
			}
		}
	}

	return census;
}


World.prototype.run = function(speed, metric){
	var self = this;
	speed = speed || 1;
	this.update(metric);
	this.scenario = setTimeout(function(){
		self.run(speed);
	}, speed);
};

World.prototype.halt = function(){
	clearTimeout(this.scenario);
	this.scenario = undefined;
};

World.prototype.findLivingNeighbors = function(currRow, currCol){
	var livingNeighbors = 0;

	for(var r = currRow - 1; r <= currRow + 1; r++){
		for(var c = currCol - 1; c <= currCol + 1; c++){
			if((r >= 0 && r < this.rows) && (c >= 0 && c < this.cols) && !(r === currRow && c === currCol)){
				if(this.grid[r][c].isAlive()){
					livingNeighbors++;
				}
			}
		}
	}
	return livingNeighbors;
};

World.prototype.applyRules = function(currentCell, livingNeighbors){
	if(currentCell.isAlive() && livingNeighbors < 2){
		//Underpopulation, dies
		currentCell.kill();
	} else if(currentCell.isAlive() && livingNeighbors > 3){
		//Overpopulation, dies
		currentCell.kill();
	} else if(!currentCell.isAlive() && livingNeighbors === 3){
		//Birth
		currentCell.spawn();
	} else {
		//Survives, increment lifespan
		currentCell.incrementLifespan();
	}
};
