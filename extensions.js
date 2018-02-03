// 扩展
// DisplayObject 的原型
var proto = PIXI.DisplayObject.prototype; 
proto.set = function(arg) {
	for(let key in arg) {
		this[key] = arg[key]; 
	}
}

Object.defineProperties(proto, {
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
	}, 
	pivotX: {
		set: function(value) {
			this.pivot.x = value; 
		}, 
		get: function() {
			return this.pivot.x; 
		}
	}, 
	pivotY: {
		set: function(value) {
			this.pivot.y = value
		}, 
		get: function() {
			return this.pivot.y; 
		}
	}, 
	anchorX: {
		set: function(value) {
			this.anchor.x = value; 
		}, 
		get: function() {
			return this.anchor.x; 
		}
	}, 
	anchorY: {
		set: function(value) {
			this.anchor.y = value
		}, 
		get: function() {
			return this.anchor.y; 
		}
	}, 
	origin: {
		get: function() { 
			return [this.pivot.x, this.pivot.y]; 
		}, 
		set: function(coord) { 
			this.pivot.set(coord[0], coord[1]); 
			this.updatePosition(); 
		}
	}, 
	left: { 
		get: function() {
			return this._left === undefined ? this.x - this.pivot.x : this._left; 
		}, 
		set: function(value) {
			this._left = value; 
			this.x = value + this.pivot.x; 
		}
	}, 
	right: {
		get: function() {
			return this._right === undefined ? this._right : this.x - this.pivot.x; 
		}, 
		set: function(value) { 
			if(value === undefined) return ; 
			this._right = value; 
			if(this.parent !== null) { 
				this.x = this.parent.width - this.width - value; 
			}
			else {
				this.x = 0; 
			} 
		}
	}, 
	top: { 
		get: function() {
			return this._top === undefined ? this.y - this.pivot.y : this._top; 
		}, 
		set: function(value) {
			this._top = value; 
			this.y = value + this.pivot.y; 
		}
	}, 
	bottom: {
		get: function() {
			return this._bottom === undefined ? this._bottom : this.y - this.pivot.y; 
		}, 
		set: function(value) { 
			if(value === undefined) return ; 
			this._bottom = value; 
			if(this.parent !== null) {
				this.y = this.parent.height - this.height - value; 
			}
			else {
				this.y = 0; 
			} 
		}
	}, 
	// 运动时间
	time: {
		set: function(t) { 
			let elapsed = t - this._t || t; 
			this._t = t; 
			let {velocityX, velocityY, accelerationX, accelerationY} = this; 
			// 当前速度 
			this.velocityX += elapsed * accelerationX; 
			this.velocityY += elapsed * accelerationY; 
			// 当前位置
			this.x += (this.velocityX + velocityX) * elapsed / 2; 
			this.y += (this.velocityY + velocityY) * elapsed / 2; 
		}, 
		get: function() {return this._t}
	}, 
	index: {
		set: function(value) {
			if(this._index !== value) {
				this._index = value; 
				this.parent.setChildIndex(this, value); 
			}
		}, 
		get: () => this._index
	}
}); 

// 为原型添加速度与加速度属性等
Object.assign(
	proto, 
	{
		velocityX: 0, 
		velocityY: 0, 
		accelerationX: 0, 
		accelerationY: 0, 
		_top: 0, 
		_left: 0
	}
); 

// 更新 position
proto.updatePosition = function() { 
	this.top = this._top; 
	this.right = this._right; 
	this.bottom = this._bottom; 
	this.left = this._left; 
}

// 监听 addChild
var _addChild = PIXI.Container.prototype.addChild; 
PIXI.Container.prototype.addChild = function() { 
	var len = arguments.length; 
	if(len === 0) return ;
	_addChild.apply(this, arguments); 
	// 更新 right & bottom
	for(var i = 0; i < len; ++i) { 
		var child = arguments[i]; 
		child.right = child._right; 
		child.bottom = child._bottom; 
	}
}
var _addChildAt = PIXI.Container.prototype.addChildAt; 
PIXI.Container.prototype.addChildAt = function(child, index) {
	_addChildAt.call(this, child, index); 
	// 更新 right & bottom
	child.right = child._right; 
	child.bottom = child._bottom; 
}

// 获取不带描边的boudary
{
    let dirty = Symbol("dirty"); 
    let getContentBox = function() {
        if(this[dirty] == this.dirty) return ; 
        this[dirty] = this.dirty; // 表示已经更新
        let cp = this.clone(); 
        let graphicsData = cp.graphicsData; 
        for(let graphics of graphicsData) {
            graphics.lineWidth = 0; 
        } 
        this._cwidth = cp.width; 
        this._cheight = cp.height; 
    }
    Object.defineProperties(PIXI.Graphics.prototype, {
        "_cwidth": {writable: true, value: 0}, 
        "_cheight": {writable: true, value: 0}, 
        "cwidth": {
            get: function() {
                getContentBox.call(this); 
                return this._cwidth; 
            }
        }, 
        "cheight": {
            get: function() {
                getContentBox.call(this); 
                return this._cheight; 
            }
        }
    }); 
}

// 动态生成sprite缓存
PIXI.Sprite.prototype.generateCanvasTexture = function({x, y, width, height} = {x: 0, y: 0, width: 0, height: 0}) { 
	width = width || this.width; 
	height = height || this.height; 
	// 缓存 
	let cache = new PIXI.Texture(PIXI.Texture.EMPTY, new PIXI.Rectangle(0, 0, width, height)); 
	let baseTexture = this.texture.baseTexture; 
	let img = baseTexture.source; 
	// 创建缓存 
	let generate = () => { 
		let canvas = document.createElement("canvas"); 
		let ctx = canvas.getContext("2d"); 
		canvas.width = width; 
		canvas.height = height; 
		ctx.drawImage(img, x, y, width, height, 0, 0, width, height); 
		cache.baseTexture = new PIXI.BaseTexture(canvas); 
		// 通知更新
		cache.onBaseTextureLoaded(cache.baseTexture); 
	}
	// 图片未加载成功
	if(baseTexture.hasLoaded !== true) { 
		baseTexture.on("loaded", () => generate()); 
	}
	// 图片加载成功
	else {
		generate(); 
	} 
	return cache; 
}
