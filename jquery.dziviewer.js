(function() {
  var $, DeepZoomImageDescriptor;

  $ = $ || jQuery;

  $.fn.dziviewer = (function() {

    function dziviewer(options) {
      var defaults, dzi;
      defaults = {
        dzi_url: 'tiles/sf.dzi',
        dzi_xml: '<?xml version="1.0" encoding="UTF-8"?><Image Format="png" Overlap="2" TileSize="128" xmlns="http://schemas.microsoft.com/deepzoom/2008"><Size Height="4716" Width="11709"/></Image>',
        height: 400,
        width: 800,
        magnifier: true,
        src: 'tiles/sf.dzi'
      };
      this.options = $.extend(defaults, options);
      dzi = DeepZoomImageDescriptor.fromXML(this.options.dzi_url, this.options.dzi_xml);
      console.log("init");
    }

    return dziviewer;

  })();

  DeepZoomImageDescriptor = (function() {

    function DeepZoomImageDescriptor(source, width, height, tileSize, tileOverlap, format) {
      this.source = source;
      this.width = width;
      this.height = height;
      this.tileSize = tileSize;
      this.tileOverlap = tileOverlap;
      this.format = format;
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
      var basePath, path;
      basePath = this.source.substring(0, this.source.lastIndexOf('.'));
      path = "" + basePath + "_files";
      return "" + path + "/" + level + "/" + column + "_" + row + "." + this.format;
    };

    return DeepZoomImageDescriptor;

  })();

}).call(this);
