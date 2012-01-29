$ = $ or jQuery

#class DeepZoomImageViewer
methods =
        init: (options) ->
                defaults =
                        dzi_url: 'tiles/sf.dzi',
                        dzi_xml: '<?xml version="1.0" encoding="UTF-8"?><Image Format="png" Overlap="2" TileSize="128" xmlns="http://schemas.microsoft.com/deepzoom/2008"><Size Height="4716" Width="11709"/></Image>',
                        height: 500,
                        width: 800,
                        magnifier: true,
                        src: 'tiles/sf.dzi'

                options = $.extend(defaults, options)
                dzi = DeepZoomImageDescriptor.fromXML options.dzi_url, options.dzi_xml
                $this = $(this)
                return @each ->
                        setmode = (mode) ->
                                $(view.canvas).removeClass "mode_pan"
                                $(view.canvas).removeClass "mode_sel2d"
                                $(view.canvas).removeClass "mode_sel1d"
                                $(view.canvas).addClass "mode_#{mode}"
                                view.mode = mode

                        draw: ->
                                console.dir "draw"
                                #console.dir dzi.getTileURL 8, 1, 2
                                #console.dir dzi.getTileURL 8, 2, 2

                        view = $this.data "view"
                        layer = $this.data "layer"
                        if not view
                                view =
                                        canvas: (document.createElement "canvas"),
                                        status: (document.createElement "span"),
                                        mode: null,
                                        xdown: null,
                                        ydown: null,
                                        needdraw: false
                                $this.data "view", view

                                layer =
                                        info: null,
                                        xpos: 0,
                                        ypos: 0,
                                        xtilenum: null,
                                        ytilenum: null,
                                        level: null
                                        tilesize: null,
                                        thumb: null,
                                        tiles: []
                                $this.data "layer", layer

                                $this.addClass "tileviewer"
                                $(view.canvas).css ("background-color": "#222", "width": options.width, "height": options.height)
                                $(view.canvas).attr (width: options.width, height: options.height)
                                $this.append view.canvas
                                $(view.status).addClass "status"
                                $this.append view.status
                                setmode "pan"
                                console.log view

$.fn.dziviewer = (method) ->
        if method in methods
                return methods[method].apply this, Array.prototype.slice.call arguments, 1
        else if typeof method == 'object' or not method
                return methods.init.apply this, arguments
        else
                alert "Method #{method} does not exist on jQuery.dziviewer"

class DeepZoomImageDescriptor
        constructor: (@source, @width, @height, @tileSize, @tileOverlap, @format) ->
                @path = @source.substring 0, @source.lastIndexOf '.'
                @path = "#{@path}_files"

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
                #basePath = @source.substring 0, @source.lastIndexOf '.'
                #path = "#{basePath}_files"
                return "#{@path}/#{level}/#{column}_#{row}.#{@format}"
