/*
 * File describing the cell object. The world is filled with new instances of cells
 */

function Cell(alive){
	this.living = alive || false;
	this.lifespan = 0;
};

Cell.prototype.isAlive = function(){
	return this.living;
};

Cell.prototype.getLifespan = function(){
	return this.lifespan;
};

Cell.prototype.incrementLifespan = function(){
	this.lifespan += 1;
	return this.lifespan;
};

Cell.prototype.toggleLiving = function(){
	this.living = !this.living;
	return this.living;
};

Cell.prototype.kill = function(){
	this.living = false;
	return this.living;
};

Cell.prototype.spawn = function(){
	//Reset the lifespan to track this new cell
	this.lifespan = 0;
	this.living = true;
	return this.living;
};
