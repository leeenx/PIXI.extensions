/*
	@ PIXI 扩展
*/
// DisplayObject 的原型
var proto = PIXI.DisplayObject.prototype; 
proto.set = function(arg) {
	for(let key in arg) {
		this[key] = arg[key]; 
	}
}

proto.offsetX = proto.offsetY = 0; 

Object.defineProperties(proto, {
	scaleX: {
		set: function(value) { 
			if(this.scale.x !== value) { 
				this.scale.x = value; 
			}
		}, 
		get: function() {
			return this.scale.x; 
		}
	}, 
	scaleY: {
		set: function(value) { 
			if(this.scale.y !== value) { 
				this.scale.y = value; 
			}
		}, 
		get: function() {
			return this.scale.y; 
		}
	}, 
	skewX: {
		set: function(value) {
			if(this.skew.x !== value) { 
				this.skew.x = value; 
			}
		}, 
		get: function() {
			return this.skew.x; 
		}
	}, 
	skewY: {
		set: function(value) {
			if(this.skew.y !== value) { 
				this.skew.y = value; 
			}
		}, 
		get: function() {
			return this.skew.y; 
		}
	}, 
	rotate: {
		set: function(value) {
			if(this.rotation !== value) { 
				this.rotation = value; 
			}
		}, 
		get: function() {
			return this.rotation; 
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
			this.pivot.y = value; 
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
			// rotation/skew/scale 会影响 pivot 定位
			let parent = this.parent || this._tempDisplayObjectParent; 
			// 未形变的左上角坐标
			let pointA = {x: this._left, y: this._top}; 
			// 形变后的中心坐标
			let pointB = parent.toLocal(new PIXI.Point(coord[0], coord[1]), this); 
			
			// 盒子偏移
			let boxOffsetX = pointB.x - (pointA.x + coord[0]); 
			let boxOffsetY = pointB.y - (pointA.y + coord[1]);

			// 几何中心的偏移量
			this.offsetX = pointB.x - pointA.x - boxOffsetX; 
			this.offsetY = pointB.y - pointA.y - boxOffsetY; 

			this.x = this._left + this.offsetX + boxOffsetX; 
			this.y = this._top + this.offsetY + boxOffsetY; 

			this.pivot.set(coord[0], coord[1]); 
		}
	}, 
	left: { 
		get: function() {
			return this._left; 
		}, 
		set: function(value) {
			this._left = value; 
			this.x = value + this.offsetX; 
		}
	}, 
	right: {
		get: function() {
			return this._right; 
		}, 
		set: function(value) { 
			if(value === undefined) return ; 
			this._right = value; 
			// 由 left 实现 
			this.left = this.parent.width - this.width - value; 
		}
	}, 
	top: { 
		get: function() {
			return this._top; 
		}, 
		set: function(value) { 
			this._top = value; 
			this.y = value + this.offsetY; 
		}
	}, 
	bottom: {
		get: function() {
			return this._bottom; 
		}, 
		set: function(value) { 
			if(value === undefined) return ; 
			this._bottom = value; 
			// 由 top 实现
			this.top = this.parent.height - this.height - value; 
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
