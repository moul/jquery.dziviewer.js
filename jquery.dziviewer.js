(function() {
  var $, DeepZoomImageDescriptor, methods,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = $ || jQuery;

  methods = {
    init: function(options) {
      var $this, defaults, dzi;
      defaults = {
        dzi_url: 'tiles/sf.dzi',
        dzi_xml: '<?xml version="1.0" encoding="UTF-8"?><Image Format="png" Overlap="2" TileSize="128" xmlns="http://schemas.microsoft.com/deepzoom/2008"><Size Height="4716" Width="11709"/></Image>',
        height: 500,
        width: 800,
        magnifier: true,
        src: 'tiles/sf.dzi'
      };
      options = $.extend(defaults, options);
      dzi = DeepZoomImageDescriptor.fromXML(options.dzi_url, options.dzi_xml);
      $this = $(this);
      return this.each(function() {
        var layer, setmode, view;
        setmode = function(mode) {
          $(view.canvas).removeClass("mode_pan");
          $(view.canvas).removeClass("mode_sel2d");
          $(view.canvas).removeClass("mode_sel1d");
          $(view.canvas).addClass("mode_" + mode);
          return view.mode = mode;
        };
        ({
          draw: function() {
            return console.dir("draw");
          }
        });
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
            tilesize: null,
            thumb: null,
            tiles: []
          };
          $this.data("layer", layer);
          $this.addClass("tileviewer");
          $(view.canvas).css({
            "background-color": "#222",
            "width": options.width,
            "height": options.height
          });
          $(view.canvas).attr({
            width: options.width,
            height: options.height
          });
          $this.append(view.canvas);
          $(view.status).addClass("status");
          $this.append(view.status);
          setmode("pan");
          return console.log(view);
        }
      });
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
