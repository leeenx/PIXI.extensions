// PIXI 的扩展
PIXI.DisplayObject.prototype.set = function(arg) {
	for(let key in arg) {
		this[key] = arg[key]; 
	}
}

// scale 属性拍平
Object.defineProperties(PIXI.DisplayObject.prototype, {
	scaleX: {
		set: function(value) {
			this.scale.x = value; 
		}, 
		get: function() {
			return this.scale.x; 
		}
	}, 
	scaleY: {
		set: function(value) {
			this.scale.y = value; 
		}, 
		get: function() {
			return this.scale.y; 
		}
	}
}); 
