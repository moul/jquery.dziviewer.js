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
                        showStatus: true,
                        src: 'tiles/sf.dzi'

                options = $.extend(defaults, options)
                dzi = DeepZoomImageDescriptor.fromXML options.dzi_url, options.dzi_xml

                return @each ->
                        $this = $(this)
                        setmode = (mode) ->
                                $(view.canvas).removeClass "mode_pan"
                                $(view.canvas).removeClass "mode_sel2d"
                                $(view.canvas).removeClass "mode_sel1d"
                                $(view.canvas).addClass "mode_#{mode}"
                                view.mode = mode
                                return

                        debug = (text) ->
                                console.log text

                        recalc_viewparams = () ->
                                factor = Math.pow 2, layer.level
                                layer.xtilenum = Math.ceil layer.width / factor / layer.tilesize
                                layer.ytilenum = Math.ceil layer.height / factor / layer.tilesize
                                layer.tilesize_xlast = layer.width / factor % layer.tilesize
                                layer.tilesize_ylast = layer.height / factor % layer.tilesize
                                layer.tilesize_xlast = layer.tilesize if layer.tilesize_xlast == 0
                                layer.tilesize_ylast = layer.tilesize if layer.tilesize_ylast == 0
                                debug "recalc_viewparams"
                                return

                        draw = () ->
                                view.needdraw = false
                                ctx = view.canvas.getContext "2d"
                                view.canvas.width = view.canvas.width #clear
                                start = new Date().getTime()
                                draw_tiles ctx
                                if layer.maxlevel - layer.level > options.thumb_depth
                                        draw_thumb ctx
                                end = new Date().getTime()
                                time = end - start
                                if options.showStatus
                                        $(view.status).html "width: #{layer.width}, height: #{layer.height}, time(msec): #{time}"
                                #console.dir dzi.getTileURL 8, 1, 2
                                #console.dir dzi.getTileURL 8, 2, 2
                                debug "draw"
                                return

                        draw_tiles = () ->
                                debug "draw_tiles"
                                return

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
                                        level: null,
                                        maxlevel: (Math.ceil Math.log((Math.max options.width, options.height) / options.tilesize) / Math.log(2)),
                                        tilesize: options.tilesize,
                                        thumb: null,
                                        width: options.width,
                                        height: options.height,
                                        tiles: []
                                layer.level = Math.max 0, layer.maxlevel - 1
                                $this.data "layer", layer

                                $(view.canvas).css ("background-color": "#222", "width": layer.width, "height": layer.height)
                                $(view.canvas).attr (width: layer.width, height: layer.height)
                                $this.addClass "tileviewer"
                                $this.append view.canvas
                                if options.showStatus
                                        $(view.status).addClass "status"
                                        $this.append view.status
                                setmode "pan"

                                recalc_viewparams()
                                draw()
                                debug "view"
                                return

        setmode: (mode) ->
                return @each (@setmode mode)

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
