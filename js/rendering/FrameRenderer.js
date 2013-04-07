(function () {
	var ns = $.namespace("pskl.rendering");

	ns.FrameRenderer = function (container, renderingOptions, className) {
		
		this.defaultRenderingOptions = {
			"hasGrid" : false
		};
		renderingOptions = $.extend(true, {}, this.defaultRenderingOptions, renderingOptions);

		if(container == undefined) {
			throw "Bad FrameRenderer initialization. <container> undefined.";
		}
		
		if(isNaN(renderingOptions.dpi)) {
			throw "Bad FrameRenderer initialization. <dpi> not well defined.";
		}

		this.container = container;
		this.dpi = renderingOptions.dpi;
		this.className = className;
		this.canvas = null;
		this.hasGrid = renderingOptions.hasGrid;
		this.gridStrokeWidth = 0;

		// Flag to know if the config was altered
		this.canvasConfigDirty = true;

		if(this.hasGrid) {
			$.subscribe(Events.GRID_DISPLAY_STATE_CHANGED, $.proxy(this.showGrid, this));	
		}	
	};

	ns.FrameRenderer.prototype.init = function (frame) {
		this.render(frame);
		this.lastRenderedFrame = frame;
	};

	ns.FrameRenderer.prototype.updateDPI = function (newDPI) {
		this.dpi = newDPI;
		this.canvasConfigDirty = true;
	};

	ns.FrameRenderer.prototype.showGrid = function (evt, show) {
		
		this.gridStrokeWidth = 0;
		if(show) {
			this.gridStrokeWidth = Constants.GRID_STROKE_WIDTH;
		}
		
		this.canvasConfigDirty = true;
	};

	ns.FrameRenderer.prototype.render = function (frame) {
		this.clear(frame);
		var context = this.getCanvas_(frame).getContext('2d');
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				var color = frame.getPixel(col, row);
				this.renderPixel_(color, col, row, context);
			}
		}
		this.lastRenderedFrame = frame;
	};

	ns.FrameRenderer.prototype.renderPixel_ = function (color, col, row, context) {
		if(color != Constants.TRANSPARENT_COLOR) {
			context.fillStyle = color;
			context.fillRect(this.getFramePos_(col), this.getFramePos_(row), this.dpi, this.dpi);
		}
	};

	ns.FrameRenderer.prototype.clear = function (frame) {
		var canvas = this.getCanvas_(frame);
		canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
	};

	/**
	 * Transform a screen pixel-based coordinate (relative to the top-left corner of the rendered
	 * frame) into a sprite coordinate in column and row.
     * @public
     */
    ns.FrameRenderer.prototype.convertPixelCoordinatesIntoSpriteCoordinate = function(coords) {
    	var cellSize = this.dpi + this.gridStrokeWidth;
    	return {
    	  "col" : (coords.x - coords.x % cellSize) / cellSize,
          "row" : (coords.y - coords.y % cellSize) / cellSize
    	};
    };

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.getFramePos_ = function(index) {
		return index * this.dpi + ((index - 1) * this.gridStrokeWidth);
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.drawGrid_ = function(canvas, width, height, col, row) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = Constants.GRID_STROKE_WIDTH;
		ctx.strokeStyle = Constants.GRID_STROKE_COLOR;
		for(var c=1; c < col; c++) {			
	        ctx.moveTo(this.getFramePos_(c), 0);
	        ctx.lineTo(this.getFramePos_(c), height);
	        ctx.stroke();
		}
		
		for(var r=1; r < row; r++) {
	        ctx.moveTo(0, this.getFramePos_(r));
	        ctx.lineTo(width, this.getFramePos_(r));
	        ctx.stroke();
		}
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.getCanvas_ = function (frame) {
		if(this.canvasConfigDirty) {
			$(this.canvas).remove();
			
			var col = frame.getWidth(),
				row = frame.getHeight();
			
			var pixelWidth =  col * this.dpi + this.gridStrokeWidth * (col - 1);
			var pixelHeight =  row * this.dpi + this.gridStrokeWidth * (row - 1);
			var canvas = pskl.CanvasUtils.createCanvas(pixelWidth, pixelHeight, ["canvas", this.className]);

			this.container.append(canvas);

			if(this.gridStrokeWidth > 0) {
				this.drawGrid_(canvas, pixelWidth, pixelHeight, col, row);
			}
				
			this.canvas = canvas;
			this.canvasConfigDirty = false;
		}
		return this.canvas;
	};
})();