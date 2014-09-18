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
        results: null,
        searchField: null
    };

    if (!$[pluginName]) {
        $[pluginName] = {};
    }

    // The actual plugin constructor
    function Plugin ( element, options ) {
        this.element = element;
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.settings).

            // Get various elements

            // this.searchField is the input field to search with.
            // If given a searchField selector use that otherwise default to the first
            // text field under the main element.
            this.searchField = ( this.settings.searchField ) ? $( this.settings.searchField ) : this.element.find(":text");

            // this.searchResult is the container of the results from the search
            if ( this.settings.results && this.element.find(this.settings.results).length > 0 ) {
                this.results = this.element.find(this.settings.results);
            } else {
                this.results = $("div",{
                    id: "searchResponse"
                }).appendTo(this.element);
            }

            // Key Bindings
            this.searchField.keyup(this.keymapping);

            this.element.submit(function(e) {
                e.preventDefault();
                if (this.searchField.val() === "") {
                   this.results.html("");
                   this.results.css("display","none");
                } else {
                   get_results(this.searchField.val());
                }
             });
                // @TODO probably should be rewritten not to use 'li's as the clickable item.
                $( document ).on("click", this.results.children("ul").children("li"), function(){
                    window.location = $(this).attr("title");
                });
                this.results.blur(function(){
                    this.element.data("clear_results", true);
                    window.setTimeout(function(){
                        if (this.element.data("clear_results") && !this.searchField.is(":focus")) { //put a breakpoint here when testing
                            this.results.html("");
                            this.results.css("display","none");
                        }
                    }, 1000);
                });
                if (this.searchField.val() === "") {
                    this.results.html("");
                    this.results.css("display","none");
                } else {
                   get_results(this.searchField.val());
                }
                this.searchField.focus(function(){
                    if (this.searchField.val() === "") {
                        this.results.html("");
                        this.results.css("display","none");
                    } else {
                   get_results(this.searchField.val());
                    }
                });
                this.results.click(function(){
                    this.element.data("clear_results", false);
                });
                this.results.css("width",this.searchField.width());
                this.results.hover(function(){
                    this.element.data("clear_results", false);
                },function(){
                    this.element.data("clear_results", true);
                    window.setTimeout(function(){
                        if (this.element.data("clear_results") && !this.searchField.is(":focus")) {
                            this.results.html("");
                            this.results.css("display","none");
                        }
                    }, 1000);
                });

             function get_results(search_str) {
                $.ajax({
                   type: "POST",
                   url: "/xm_instance/insta_search.cgi",
                   data: "rm=s&st="+search_str,
                   success: function(data) {
                      this.results.html(data);
                      this.results.css({
                         "display": "block",
                         "height" : (window.innerHeight-100)+"px"
                      });
                      this.elmement.data("is_current", this.results.children("ul").find("li:not(.ignore)").eq(0));
                      this.elmement.data("is_current").addClass("current");
                      this.element.data("isIndex", 0);
                   }
                });
             }
        },
        keymapping: function(e){
            if (e.which <= 40 && e.which >= 37 || e.which === 9 || (e.which >= 16 && e.which <= 19) || e.which === 20 || e.which === 27 || e.which === 93 || e.which === 91 || e.which === 13) {
                if (e.which === 40) {
                    if (this.elmement.data("is_current") && this.elmement.data("is_current").length > 0) {
                        if (this.element.data("isIndex") === this.results.children("ul").find("li:not(.ignore)").length - 1) {
                            this.element.data("isIndex", 0);
                        } else {
                            this.element.data("isIndex", this.element.data("isIndex") + 1);
                        }
                        this.elmement.data("is_current").removeClass("current");
                        this.elmement.data("is_current", this.results.children("ul").find("li:not(.ignore)").eq(this.element.data("isIndex")));
                        this.elmement.data("is_current").addClass("current");
                    } else {
                        this.elmement.data("is_current", this.results.children("ul").find("li:not(.ignore)").eq(0));
                        this.elmement.data("is_current").addClass("current");
                        this.element.data("isIndex", 0);
                    }
                    e.preventDefault();
                } else if (e.which === 38) {
                    if (this.elmement.data("is_current") && this.elmement.data("is_current").length > 0) {
                        if (this.element.data("isIndex") === 0) {
                            this.element.data("isIndex", this.results.children("ul").find("li:not(.ignore)").length - 1);
                        } else {
                            this.element.data("isIndex", this.element.data("isIndex") - 1);
                        }
                        this.elmement.data("is_current").removeClass("current");
                        this.elmement.data("is_current", this.results.children("ul").find("li:not(.ignore)").eq(this.element.data("isIndex")));
                        this.elmement.data("is_current").addClass("current");
                    } else {
                        this.elmement.data("is_current", this.results.children("ul").find("li:not(.ignore)").eq(0));
                        this.elmement.data("is_current").addClass("current");
                        this.element.data("isIndex", 0);
                    }
                    e.preventDefault();
                } else if (e.which === 13) {
                    if (this.elmement.data("is_current") && this.elmement.data("is_current").length > 0) {
                        window.location = this.elmement.data("is_current").attr("title");
                    }
                }
            } else {
                if (this.searchField.val() === "") {
                    this.results.html("");
                    this.results.css("display","none");
                } else {
                  get_results(this.searchField.val());
                }
            }
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
