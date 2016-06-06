/*
 *  jQuery Insta-Search - v0.1.0
 *  Add Google like instant searching to your search form.
 *  
 *
 *  Made by Sean Zellmer
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "instaSearch",
    defaults = {
        ajaxParams: {},
        url: "",
        results: null,
        searchField: null,
        debug: false
    };

    if (!$[pluginName]) {
        $[pluginName] = {};
    }

    // The actual plugin constructor
    function Plugin ( element, options ) {
        this.element = element;
        this.$element = $(element); // cache jQuery element

        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. that.element
            // and that.settings
            // you can add more functions like the one below and
            // call them like so: that.yourOtherFunction(that.element, that.settings).

            // Get various elements

            // that.searchField is the input field to search with.
            // If given a searchField selector use that otherwise default to the first
            // text field under the main element.
            that.searchField = ( that.settings.searchField ) ? $( that.settings.searchField ) : that.$element.find(":text");

            // that.searchResult is the container of the results from the search
            if ( that.settings.results && that.$element.find(that.settings.results).length > 0 ) {
                that.results = that.$element.find(that.settings.results);
            } else {
                that.results = $("<div>",{
                    id: "searchResponse"
                }).appendTo(that.$element);
            }
            // Ensure that the results element has an id
            if ( that.results.attr("id") === "" ) {
                that.results.attr("id", "searchResponse");
            }

            // Key Bindings
            that.searchField.keyup(that.keymapping());

            that.$element.submit(function(e) {
                e.preventDefault();
                if (that.searchField.val() === "") {
                   that.results.html("");
                   that.results.css("display","none");
                } else {
                   that.get_results(that.searchField.val());
                }
            });

            // ===== results =====

            // ----- Events -----
            // @TODO probably should be rewritten not to use 'li's as the clickable item.
            $( document ).on("click", that.results.attr("id") + " > ul > li", function(){
                window.location = $(this).attr("title");
            });
            that.results.click(function(){
                that.$element.data("clear_results", false);
            });
            that.results.hover(function(){
                that.$element.data("clear_results", false);
            }, function(){
                if (!that.settings.debug) {
                    that.$element.data("clear_results", true);
                }
                window.setTimeout(function(){
                    if (that.$element.data("clear_results") && !that.searchField.is(":focus")) {
                        that.results.html("");
                        that.results.css("display","none");
                    }
                }, 1000);
            });

            // Initialize contents
            if (that.searchField.val() === "") {
                that.results.html("");
                that.results.css("display","none");
            } else {
               that.get_results(that.searchField.val());
            }

            // Style
            that.results.css("width",that.searchField.width());

            // ===== searchField =====

            // ----- Events -----
            that.searchField.focus(function(){
                if (that.searchField.val() === "") {
                    that.results.html("");
                    that.results.css("display","none");
                } else {
               that.get_results(that.searchField.val());
                }
            });
            that.searchField.blur(function(){
                if (!that.settings.debug) {
                    that.$element.data("clear_results", true);
                }
                window.setTimeout(function(){
                    if (that.$element.data("clear_results") && !that.searchField.is(":focus")) { //put a breakpoint here when testing
                        that.results.html("");
                        that.results.css("display","none");
                    }
                }, 1000);
            });
        },
        get_results: function(search_str) {
            var that = this;
            // Setup params
            var search_params = {
                st: search_str
            };
            var params = $.extend( {}, this.settings.ajaxParams, search_params );

            $.ajax({
               type: "POST",
               url: that.settings.url,
               data: params,
               success: function(data) {
                  that.results.html(data);
                  that.results.css({
                     "display": "block",
                      // @TODO fix height to be relative to the searchField's position
                     "max-height" : ( ( $(document).innerHeight() - ( that.searchField.offset().top + that.searchField.innerHeight() ) ) - 100 )+"px"
                  });
                  that.$element.data("is_current", that.results.children("ul").find("li:not(.ignore)").eq(0));
                  that.$element.data("is_current").addClass("current");
                  that.$element.data("isIndex", 0);
               }
            });
        },
        keymapping: function(){
            var that = this;
            return function(e) {
                if (e.which <= 40 && e.which >= 37 || e.which === 9 || (e.which >= 16 && e.which <= 19) || e.which === 20 || e.which === 27 || e.which === 93 || e.which === 91 || e.which === 13) {
                    if (e.which === 40) {
                        if (that.$element.data("is_current") && that.$element.data("is_current").length > 0) {
                            if (that.$element.data("isIndex") === that.results.children("ul").find("li:not(.ignore)").length - 1) {
                                that.$element.data("isIndex", 0);
                            } else {
                                that.$element.data("isIndex", that.$element.data("isIndex") + 1);
                            }
                            that.$element.data("is_current").removeClass("current");
                            that.$element.data("is_current", that.results.children("ul").find("li:not(.ignore)").eq(that.$element.data("isIndex")));
                            that.$element.data("is_current").addClass("current");
                        } else {
                            that.$element.data("is_current", that.results.children("ul").find("li:not(.ignore)").eq(0));
                            that.$element.data("is_current").addClass("current");
                            that.$element.data("isIndex", 0);
                        }
                        e.preventDefault();
                    } else if (e.which === 38) {
                        if (that.$element.data("is_current") && that.$element.data("is_current").length > 0) {
                            if (that.$element.data("isIndex") === 0) {
                                that.$element.data("isIndex", that.results.children("ul").find("li:not(.ignore)").length - 1);
                            } else {
                                that.$element.data("isIndex", that.$element.data("isIndex") - 1);
                            }
                            that.$element.data("is_current").removeClass("current");
                            that.$element.data("is_current", that.results.children("ul").find("li:not(.ignore)").eq(that.$element.data("isIndex")));
                            that.$element.data("is_current").addClass("current");
                        } else {
                            that.$element.data("is_current", that.results.children("ul").find("li:not(.ignore)").eq(0));
                            that.$element.data("is_current").addClass("current");
                            that.$element.data("isIndex", 0);
                        }
                        e.preventDefault();
                    } else if (e.which === 13) {
                        if (that.$element.data("is_current") && that.$element.data("is_current").length > 0) {
                            window.location = that.$element.data("is_current").attr("title");
                        }
                    }
                } else {
                    if (that.searchField.val() === "") {
                        that.results.html("");
                        that.results.css("display","none");
                    } else {
                        that.get_results(that.searchField.val());
                    }
                }
            };
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
        this.each(function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
        });

        // chain jQuery functions
        return this;
    };

})( jQuery, window, document );
