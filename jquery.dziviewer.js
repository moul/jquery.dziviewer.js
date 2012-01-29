(function() {
  var $, DeepZoomImageDescriptor, methods,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = $ || jQuery;

  methods = {
    init: function(options) {
      var defaults, dzi;
      defaults = {
        dzi_url: 'tiles/sf.dzi',
        dzi_xml: '<?xml version="1.0" encoding="UTF-8"?><Image Format="png" Overlap="2" TileSize="128" xmlns="http://schemas.microsoft.com/deepzoom/2008"><Size Height="4716" Width="11709"/></Image>',
        height: 500,
        width: 800,
        magnifier: true,
        showStatus: true,
        src: 'tiles/sf.dzi'
      };
      options = $.extend(defaults, options);
      dzi = DeepZoomImageDescriptor.fromXML(options.dzi_url, options.dzi_xml);
      return this.each(function() {
        var $this, debug, draw, draw_tiles, layer, recalc_viewparams, setmode, view;
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
          layer.xtilenum = Math.ceil(layer.width / factor / layer.tilesize);
          layer.ytilenum = Math.ceil(layer.height / factor / layer.tilesize);
          layer.tilesize_xlast = layer.width / factor % layer.tilesize;
          layer.tilesize_ylast = layer.height / factor % layer.tilesize;
          if (layer.tilesize_xlast === 0) layer.tilesize_xlast = layer.tilesize;
          if (layer.tilesize_ylast === 0) layer.tilesize_ylast = layer.tilesize;
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
            $(view.status).html("width: " + layer.width + ", height: " + layer.height + ", time(msec): " + time);
          }
          debug("draw");
        };
        draw_tiles = function() {
          debug("draw_tiles");
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
            maxlevel: Math.ceil(Math.log((Math.max(options.width, options.height)) / options.tilesize) / Math.log(2)),
            tilesize: options.tilesize,
            thumb: null,
            width: options.width,
            height: options.height,
            tiles: []
          };
          layer.level = Math.max(0, layer.maxlevel - 1);
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
          recalc_viewparams();
          draw();
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
