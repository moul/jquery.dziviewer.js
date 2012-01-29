(function() {
  var $, DeepZoomImageDescriptor, methods,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = $ || jQuery;

  methods = {
    init: function(options) {
      var defaults, dzi;
      defaults = {
        dziUrl: 'tiles/sf.dzi',
        dziXml: '<?xml version="1.0" encoding="UTF-8"?><Image Format="png" Overlap="2" TileSize="128" xmlns="http://schemas.microsoft.com/deepzoom/2008"><Size Height="4716" Width="11709"/></Image>',
        height: 500,
        width: 800,
        magnifier: true,
        showStatus: true,
        emptyColor: '#6F6',
        thumbDepth: 2,
        background: '#222',
        thumbColor: '#f00',
        src: 'tiles/sf.dzi'
      };
      options = $.extend(defaults, options);
      dzi = DeepZoomImageDescriptor.fromXML(options.dziUrl, options.dziXml);
      return this.each(function() {
        var $this, check_needdraw, debug, draw, draw_subtile, draw_tile, draw_tiles, layer, recalc_viewparams, setmode, view;
        $this = $(this);
        setmode = function(mode) {
          $(view.canvas).removeClass("mode_pan");
          $(view.canvas).removeClass("mode_sel2d");
          $(view.canvas).removeClass("mode_sel1d");
          $(view.canvas).addClass("mode_" + mode);
          view.mode = mode;
        };
        debug = function(text) {
          return console.log(text);
        };
        recalc_viewparams = function() {
          var factor;
          factor = Math.pow(2, layer.level);
          layer.xtilenum = Math.ceil(dzi.width / factor / dzi.tileSize);
          layer.ytilenum = Math.ceil(dzi.height / factor / dzi.tileSize);
          layer.tilesize_xlast = dzi.width / factor % dzi.tileSize;
          layer.tilesize_ylast = dzi.height / factor % dzi.tileSize;
          if (layer.tilesize_xlast === 0) layer.tilesize_xlast = dzi.tileSize;
          if (layer.tilesize_ylast === 0) layer.tilesize_ylast = dzi.tileSize;
          debug("recalc_viewparams");
        };
        draw = function() {
          var ctx, end, start, time;
          view.needdraw = false;
          ctx = view.canvas.getContext("2d");
          view.canvas.width = view.canvas.width;
          start = new Date().getTime();
          draw_tiles(ctx);
          if (layer.maxlevel - layer.level > options.thumb_depth) draw_thumb(ctx);
          end = new Date().getTime();
          time = end - start;
          if (options.showStatus) {
            $(view.status).html("width: " + dzi.width + ", height: " + dzi.height + ", time(msec): " + time + ", level: " + layer.level + ", l.tilesize: " + layer.tilesize);
          }
          debug("draw");
        };
        draw_tiles = function(ctx) {
          var x, xmax, xmin, y, ymax, ymin;
          xmin = Math.max(0, Math.floor(-layer.xpos / dzi.tileSize));
          ymin = Math.max(0, Math.floor(-layer.ypos / dzi.tileSize));
          xmax = Math.min(layer.xtilenum, Math.ceil((view.canvas.clientWidth - layer.xpos) / layer.tilesize));
          ymax = Math.min(layer.ytilenum, Math.ceil((view.canvas.clientHeight - layer.ypos) / layer.tilesize));
          for (y = ymin; ymin <= ymax ? y <= ymax : y >= ymax; ymin <= ymax ? y++ : y--) {
            for (x = xmin; xmin <= xmax ? x <= xmax : x >= xmax; xmin <= xmax ? x++ : x--) {
              draw_tile(ctx, x, y);
            }
          }
          debug("draw_tiles");
        };
        draw_tile = function(ctx, x, y) {
          var dodraw, img, url;
          url = dzi.getTileURL(layer.level, x, y);
          img = layer.tiles[url];
          debug("test");
          dodraw = function() {
            var xsize, ysize;
            xsize = layer.tilesize;
            if (x === layer.xtilenum - 1) {
              xsize = layer.tilesize / dzi.tileSize * layer.tilesize_xlast;
            }
            ysize = layer.tilesize;
            if (y === layer.ytilenum - 1) {
              ysize = layer.tilesize / dzi.tileSize * layer.tilesize_ylast;
            }
            ctx.drawImage(img, layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize);
            debug("layer.xpos + x * layer.tilesize = " + (layer.xpos + x * layer.tilesize));
            debug("layer.ypos + y * layer.tilesize = " + (layer.ypos + y * layer.tilesize));
            debug("xsize = " + xsize);
            debug("ysize = " + ysize);
            return debug("draw_tile::dodraw");
          };
          if (!img) {
            img = new Image();
            img.onload = function() {
              img.loaded = true;
              if (img.level_loaded_for === layer.level) {
                return view.needdraw = true;
              }
            };
            img.onerror = function() {
              return debug("failed to load " + url + " on x=" + x + " y=" + y);
            };
            img.loaded = false;
            img.level_loaded_for = layer.level;
            img.src = url;
            layer.tiles[url] = img;
            debug("b");
          } else if (img.loaded) {
            debug("a");
            dodraw();
            return;
          }
          draw_subtile(ctx, x, y);
          debug("draw_tile");
        };
        draw_subtile = function(ctx, x, y) {
          var down, factor, half_tilesize, img, sh, sw, sx, sy, url, xsize, xtilenum_up, ysize;
          xsize = layer.tilesize;
          if (x === layer.xtilenum - 1) {
            xsize = layer.tilesize / dzi.tileSize * layer.tilesize_xlast;
          }
          ysize = layer.tilesize;
          if (y === layer.ytilenum - 1) {
            ysize = layer.tilesize / dzi.tileSize * layer.tilesize_ylast;
          }
          down = 1;
          factor = 1;
          while (layer.level + down <= layer.maxlevel) {
            factor <<= 1;
            xtilenum_up = Math.ceil(dzi.width / Math.pow(2, layer.level + down) / dzi.tilesize);
            url = dzi.getTileURL(layer.level + down, Math.floor(x / factor), Math.floor(y / factor) * xtilenum_up);
            img = layer.tiles[url];
            if (img && img.loaded) {
              half_tilesize = dzi.tileSize / factor;
              sx = (x % factor) * half_tilesize;
              sy = (y % factor) * half_tilesize;
              sw = half_tilesize;
              if (x === layer.xtilenum - 1) sw = layer.tilesize_xlast / factor;
              sh = half_tilesize;
              if (y === layer.ytilenum - 1) sh = layer.tilesize_ylast / factor;
              ctx.drawImage(img, sx, sy, sw, sh, layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize);
            }
            down++;
          }
          ctx.fillStyle = options.emptyColor;
          ctx.fillRect(layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize);
          debug("draw_subtile");
        };
        view = $this.data("view");
        layer = $this.data("layer");
        if (!view) {
          view = {
            canvas: document.createElement("canvas"),
            status: document.createElement("span"),
            mode: null,
            xdown: null,
            ydown: null,
            needdraw: false
          };
          $this.data("view", view);
          layer = {
            info: null,
            xpos: 0,
            ypos: 0,
            xtilenum: null,
            ytilenum: null,
            level: null,
            maxlevel: null,
            thumb: null,
            tailsize: null,
            width: options.width,
            height: options.height,
            tiles: []
          };
          $this.data("layer", layer);
          $(view.canvas).css({
            "background-color": "#222",
            "width": layer.width,
            "height": layer.height
          });
          $(view.canvas).attr({
            width: layer.width,
            height: layer.height
          });
          $this.addClass("tileviewer");
          $this.append(view.canvas);
          if (options.showStatus) {
            $(view.status).addClass("status");
            $this.append(view.status);
          }
          setmode("pan");
          layer.maxlevel = Math.ceil(Math.log((Math.max(options.width, options.height)) / dzi.tileSize) / Math.log(2));
          layer.maxlevel = 15;
          layer.level = Math.max(0, layer.maxlevel - 1);
          debug(layer);
          layer.tilesize = dzi.tileSize / 2;
          recalc_viewparams();
          draw();
          check_needdraw = function() {
            if (view.needdraw) draw();
            return setTimeout(check_needdraw, 100);
          };
          setTimeout(check_needdraw, 100);
          $(view.canvas).mousedown(function(e) {
            view.xdown = e.clientX - layer.xpos;
            view.ydown = e.clientY - layer.ypos;
            return false;
          });
          $(document).mouseup(function(e) {
            if (view.xdown && view.mode === "pan") {
              layer.xpos = e.clientX - view.xdown;
              layer.ypos = e.clientY - view.ydown;
              draw();
            }
            return false;
          });
          $(view.canvas).bind("mousewheel.dziviewer", function(e, delta) {
            var dist_from_x0, dist_from_y0, offset;
            debug(delta);
            if (view.mode === "pan") {
              delta = delta * 16;
              if (layer.level === 0 && layer.tilesize + delta > dzi.tileSize) {
                return false;
              }
              if (layer.level === layer.maxlevel && layer.tilesize + delta < dzi.tileSize / 2) {
                return false;
              }
              offset = $(view.canvas).offset();
              dist_from_x0 = e.pageX - offset.left - layer.xpos;
              dist_from_y0 = e.pageY - offset.top - layer.ypos;
              layer.xpos -= dist_from_x0 / layer.tilesize * delta;
              layer.ypos -= dist_from_y0 / layer.tilesize * delta;
              layer.tilesize += delta;
              if (layer.tilesize > dzi.tileSize && layer.level !== 0) {
                layer.level--;
                layer.tilesize /= 2;
                recalc_viewparams();
              }
              if (layer.tilesize < dzi.tileSize / 2 && layer.level !== layer.maxlevel) {
                layer.level++;
                layer.tilesize *= 2;
                recalc_viewparams();
              }
              draw();
            }
            debug("mousewheel");
            return false;
          });
          debug("view");
        }
      });
    },
    setmode: function(mode) {
      return this.each(this.setmode(mode));
    }
  };

  $.fn.dziviewer = function(method) {
    if (__indexOf.call(methods, method) >= 0) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      return alert("Method " + method + " does not exist on jQuery.dziviewer");
    }
  };

  DeepZoomImageDescriptor = (function() {

    function DeepZoomImageDescriptor(source, width, height, tileSize, tileOverlap, format) {
      this.source = source;
      this.width = width;
      this.height = height;
      this.tileSize = tileSize;
      this.tileOverlap = tileOverlap;
      this.format = format;
      this.path = this.source.substring(0, this.source.lastIndexOf('.'));
      this.path = "" + this.path + "_files";
    }

    DeepZoomImageDescriptor.fromXML = function(source, xmlString) {
      var descriptor, format, height, image, size, tileOverlap, tileSize, width, xml;
      xml = this.parseXML(xmlString);
      image = xml.documentElement;
      tileSize = image.getAttribute('TileSize');
      tileOverlap = image.getAttribute('Overlap');
      format = image.getAttribute('Format');
      size = image.getElementsByTagName('Size')[0];
      width = size.getAttribute('Width');
      height = size.getAttribute('Height');
      descriptor = new DeepZoomImageDescriptor(source, width, height, tileSize, tileOverlap, format);
      return descriptor;
    };

    DeepZoomImageDescriptor.parseXML = function(xmlString) {
      var parser, xml;
      if (window.ActiveXObject) {
        try {
          xml = new ActiveXObject('Microsoft.XMLDOM');
          xml.async = false;
          xml.loadXML(xmlString);
        } catch (_error) {}
      } else if (window.DOMParser) {
        try {
          parser = new DOMParser();
          xml = parser.parseFromString(xmlString, 'text/xml');
        } catch (_error) {}
      }
      return xml;
    };

    DeepZoomImageDescriptor.prototype.getTileURL = function(level, column, row) {
      return "" + this.path + "/" + level + "/" + column + "_" + row + "." + this.format;
    };

    return DeepZoomImageDescriptor;

  })();

}).call(this);
