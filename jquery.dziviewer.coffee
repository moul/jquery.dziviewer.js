#$ = jQuery if not $
$ = $ or jQuery




class $.fn.dziviewer
        constructor: (options) ->
                defaults = dzi_url: 'tiles/sf.dzi', dzi_xml: '<?xml version="1.0" encoding="UTF-8"?><Image Format="png" Overlap="2" TileSize="128" xmlns="http://schemas.microsoft.com/deepzoom/2008"><Size Height="4716" Width="11709"/></Image>', height: 400, width: 800, magnifier: true, src: 'tiles/sf.dzi'
                @options = $.extend(defaults, options)
                dzi = DeepZoomImageDescriptor.fromXML @options.dzi_url, @options.dzi_xml
                console.log "init"




class DeepZoomImageDescriptor
        constructor: (@source, @width, @height, @tileSize, @tileOverlap, @format) ->

        @fromXML: (source, xmlString) ->
                xml = @parseXML xmlString
                image = xml.documentElement
                tileSize = image.getAttribute 'TileSize'
                tileOverlap = image.getAttribute 'Overlap'
                format = image.getAttribute 'Format'
                size = image.getElementsByTagName('Size')[0]
                width = size.getAttribute 'Width'
                height = size.getAttribute 'Height'
                descriptor = new DeepZoomImageDescriptor source, width, height, tileSize, tileOverlap, format
                return descriptor

        @parseXML: (xmlString) ->
                # IE
                if window.ActiveXObject
                    try
                        xml = new ActiveXObject 'Microsoft.XMLDOM'
                        xml.async = false
                        xml.loadXML xmlString
                # Other browsers
                else if window.DOMParser
                    try
                        parser = new DOMParser()
                        xml = parser.parseFromString xmlString, 'text/xml'
                return xml

        getTileURL: (level, column, row) ->
                basePath = @source.substring 0, @source.lastIndexOf '.'
                path = "#{basePath}_files"
                return "#{path}/#{level}/#{column}_#{row}.#{@format}"
