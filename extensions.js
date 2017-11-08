// 扩展
{
	// DisplayObject 的原型
	var proto = PIXI.DisplayObject.prototype; 
	proto.set = function(arg) {
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
		}
	}); 

	// 注册点
	Object.defineProperty(proto, "origin", {
		get: function() { 
			return [this.pivot.x, this.pivot.y]; 
		}, 
		set: function(coord) { 
			this.pivot.set(coord[0], coord[1]); 
			this.updatePosition(); 
		}
	})

	Object.defineProperty(proto, "left", { 
		get: function() {
			return this._left === undefined ? this.x - this.pivot.x : this._left; 
		}, 
		set: function(value) {
			this._left = value; 
			this.x = value + this.pivot.x; 
		}
	}); 

	Object.defineProperty(proto, "right", {
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
	}); 

	Object.defineProperty(proto, "top", { 
		get: function() {
			return this._top === undefined ? this.y - this.pivot.y : this._top; 
		}, 
		set: function(value) {
			this._top = value; 
			this.y = value + this.pivot.y; 
		}
	}); 

	Object.defineProperty(proto, "bottom", {
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
	}); 

	// top & left 初始值是 0
	proto._top = proto._left = 0; 

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
