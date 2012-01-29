$ = $ or jQuery

#class DeepZoomImageViewer
methods =
        init: (options) ->
                defaults =
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

                options = $.extend(defaults, options)
                dzi = DeepZoomImageDescriptor.fromXML options.dziUrl, options.dziXml

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
                                layer.xtilenum = Math.ceil dzi.width / factor / dzi.tileSize
                                layer.ytilenum = Math.ceil dzi.height / factor / dzi.tileSize
                                layer.tilesize_xlast = dzi.width / factor % dzi.tileSize
                                layer.tilesize_ylast = dzi.height / factor % dzi.tileSize
                                layer.tilesize_xlast = dzi.tileSize if layer.tilesize_xlast == 0
                                layer.tilesize_ylast = dzi.tileSize if layer.tilesize_ylast == 0
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
                                        $(view.status).html "width: #{dzi.width}, height: #{dzi.height}, time(msec): #{time}"
                                debug "draw"
                                return


                        draw_tiles = (ctx) ->
                                xmin = Math.max 0, Math.floor(-layer.xpos / dzi.tileSize)
                                ymin = Math.max 0, Math.floor(-layer.ypos / dzi.tileSize)
                                xmax = Math.min layer.xtilenum, Math.ceil (view.canvas.clientWidth - layer.xpos) / layer.tilesize
                                ymax = Math.min layer.ytilenum, Math.ceil (view.canvas.clientHeight - layer.ypos) / layer.tilesize
                                for y in [ymin..ymax]
                                        for x in [xmin..xmax]
                                                draw_tile ctx, x, y
                                debug "draw_tiles"
                                return

                        draw_tile = (ctx, x, y) ->
                                url = dzi.getTileURL layer.level, x, y
                                img = layer.tiles[url]
                                debug "test"
                                dodraw = () ->
                                        xsize = layer.tilesize
                                        xsize = layer.tilesize / dzi.tileSize * layer.tilesize_xlast if x == layer.xtilenum - 1
                                        ysize = layer.tilesize
                                        ysize = layer.tilesize / dzi.tileSize * layer.tilesize_ylast if y == layer.ytilenum - 1
                                        ctx.drawImage img, layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize
                                        debug "layer.xpos + x * layer.tilesize = #{layer.xpos + x * layer.tilesize}"
                                        debug "layer.ypos + y * layer.tilesize = #{layer.ypos + y * layer.tilesize}"
                                        debug "xsize = #{xsize}"
                                        debug "ysize = #{ysize}"
                                        debug "draw_tile::dodraw"

                                if not img
                                        img = new Image()
                                        img.onload = () ->
                                                img.loaded = true
                                                if img.level_loaded_for == layer.level
                                                        view.needdraw = true
                                        img.onerror = () ->
                                                debug "failed to load #{url} on x=#{x} y=#{y}"
                                        img.loaded = false
                                        img.level_loaded_for = layer.level
                                        img.src = url
                                        layer.tiles[url] = img
                                        debug "b"
                                else if img.loaded
                                        debug "a"
                                        dodraw()
                                        return
                                draw_subtile ctx, x, y

                                #debug "draw_tile: #{url}"
                                debug "draw_tile"
                                return

                        draw_subtile = (ctx, x, y) ->
                                xsize = layer.tilesize
                                xsize = layer.tilesize / dzi.tileSize * layer.tilesize_xlast if x == layer.xtilenum - 1
                                ysize = layer.tilesize
                                ysize = layer.tilesize / dzi.tileSize * layer.tilesize_ylast if y == layer.ytilenum - 1
                                down = 1
                                factor = 1
                                while layer.level + down <= layer.maxlevel
                                        factor <<= 1
                                        xtilenum_up = Math.ceil(dzi.width / Math.pow(2, layer.level + down) / dzi.tilesize)
                                        url = dzi.getTileURL layer.level + down, Math.floor(x / factor), Math.floor(y / factor) * xtilenum_up
                                        img = layer.tiles[url]
                                        if img && img.loaded
                                                half_tilesize = dzi.tileSize / factor
                                                sx = (x % factor) * half_tilesize
                                                sy = (y % factor) * half_tilesize
                                                sw = half_tilesize
                                                sw = layer.tilesize_xlast / factor if x == layer.xtilenum - 1
                                                sh = half_tilesize
                                                sh = layer.tilesize_ylast / factor if y == layer.ytilenum - 1
                                                ctx.drawImage img, sx, sy, sw, sh, layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize
                                        down++
                                ctx.fillStyle = options.emptyColor
                                ctx.fillRect layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize
                                debug "draw_subtile"
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
                                        maxlevel: null,
                                        thumb: null,
                                        tailsize: null,
                                        width: options.width,
                                        height: options.height,
                                        tiles: []
                                $this.data "layer", layer

                                $(view.canvas).css ("background-color": "#222", "width": layer.width, "height": layer.height)
                                $(view.canvas).attr (width: layer.width, height: layer.height)
                                $this.addClass "tileviewer"
                                $this.append view.canvas
                                if options.showStatus
                                        $(view.status).addClass "status"
                                        $this.append view.status
                                setmode "pan"
                                layer.maxlevel = Math.ceil Math.log((Math.max options.width, options.height) / dzi.tileSize) / Math.log(2)
                                layer.maxlevel = 15
                                layer.level = Math.max 0, layer.maxlevel - 1
                                debug layer
                                #return
                                layer.tilesize = dzi.tileSize / 2
                                recalc_viewparams()
                                draw()

                                #load thumbnail
                                #layer.thumb = new Image()

                                check_needdraw = () ->
                                        if view.needdraw
                                                draw()
                                        setTimeout check_needdraw, 100
                                setTimeout check_needdraw, 100
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
