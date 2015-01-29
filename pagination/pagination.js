(function($){
    var defaults={
        holder:"", //分页组件容器
        container: "", //分页数据容器
        previous: "<i class='iconfont' >&#xF039;</i> 上一页", //上一页文案
        next: "下一页 <i class='iconfont'>&#xF03A;</i>", // 下一页文案
        currentPage: 1, //当前页
        perPage: 10, //每页展示多少条数据
        numPages:0, //总共多少页
        midRange: 5,//展示多少个页面
        miniPage:false,
        callback: undefined,
        flush:true
    }
    function Pagination (options){
        this.options = $.extend({}, defaults, options);
        this._container = $("#" + this.options.container);
        this._holder = $(this.options.holder);
        this._nav = {};

        this._items = this._container.children(":visible");
        this._itemsHiding = this._itemsShowing = this._items;
        this._numPages = this.options.numPages || Math.ceil(this._items.length / this.options.perPage);
        this._currentPage = parseInt(this.options.currentPage);

        this.init();
    }
    Pagination.prototype={
        init: function () {
            if ((!this._container.length && this._numPages) === 0 || !this._holder.length) return;
            this.setNav();
            this.paginate(this._currentPage);
        },
        setNav: function () {
            var navhtml = this.writeNav();
            this._holder.each(this._bind(function (index, element) {
                var holder = $(element);
                holder.html(navhtml);
                this.cacheNavElements(holder, index);
                this.bindNavHandlers(index);
                this.disableNavSelection(element);
            }, this));
        },

        writeNav: function () {
            var i = 1, navhtml;
            navhtml = this.writeBtn("previous");

            for (; i <= this._numPages; i++) {
                if(i === 1 || i=== this._numPages){
                    navhtml += '<span class="jp-break">...</span>';
                }
                navhtml += '<a href="#" class="jp-item jp-hidden">'+i+'</a>';
            }
            navhtml += this.writeBtn("next");

            if(!this.options.miniPage){
                navhtml += '<span class="jp-info">共<b class="jp-bold">'+this._numPages+'</b>页</span>';
                navhtml += '<div class="jp-which">'+
                    '<input class="input" type="text" value="" min="1" max="100">'+
                    '<span class="text">页</span>'+
                    '<a class="jp-goto" tabindex="0">跳转</a>'+
                    '</div>';
            }
            return navhtml;
        },

        writeBtn: function (which) {
            var btnHtml;
            btnHtml = this.options[which] !== false && !$(this["_" + which]).length ?
                '<a class="jp-' + which + '">' + this.options[which] + '</a>' : '';
            return btnHtml;
        },
        cacheNavElements: function (holder, index) {
            this._nav[index] = {};
            this._nav[index].holder = holder;
            this._nav[index].previous = this._nav[index].holder.find("a.jp-previous");
            this._nav[index].next =  this._nav[index].holder.find("a.jp-next");
            this._nav[index].fstBreak = this._nav[index].holder.find(".jp-break:first");
            this._nav[index].lstBreak = this._nav[index].holder.find(".jp-break:last");
            this._nav[index].pages = this._nav[index].holder.find("a").not(" .jp-previous, .jp-next, .jp-goto");
            this._nav[index].gotoBtn = this._nav[index].holder.find(".jp-goto");
            this._nav[index].gotoInput = this._nav[index].holder.find(".input");
            this._nav[index].pagesShowing = $([]);
            this._nav[index].currentPage = $([]);
        },

        bindNavHandlers: function (index) {
            var nav = this._nav[index];
            this._holder.bind("click", this._bind(function (evt) {
                evt.preventDefault();
                var newPage = this.getNewPage(nav, $(evt.target));
                if (this.validNewPage(newPage)) {
                    this.paginate(newPage);
                    if ($.isFunction(this.options.callback) &&this.options.flush)
                        this.callback(newPage);
                }
            }, this));
        },
        disableNavSelection: function (element) {
            if (typeof element.onselectstart != "undefined")
                element.onselectstart = function () {
                    return false;
                };
            else if (typeof element.style.MozUserSelect != "undefined")
                element.style.MozUserSelect = "none";
            else
                element.onmousedown = function () {
                    return false;
                };
        },
        getNewPage: function (nav, target) {
            if (target.is(nav.currentPage)) return this._currentPage;
            if (target.is(nav.pages)) return nav.pages.index(target) + 1;
            if (target.is(nav.previous)) return nav.pages.index(nav.currentPage);
            if (target.is(nav.next)) return nav.pages.index(nav.currentPage) + 2;
            if (target.is(nav.gotoBtn)) return parseInt(nav.gotoInput.val());
            return null;
        },
        validNewPage: function (newPage) {
            return newPage !== this._currentPage && newPage > 0 && newPage <= this._numPages;
        },
        paginate: function (page) {
            var itemRange;
            itemRange = this.updateItems(page);
            this.updatePages(page);
            this._currentPage = page;
            if ($.isFunction(this.options.callback)&& !this.options.flush)
                this.callback(page, itemRange);
        },
        updateItems: function (page) {
            if(!this._items.length ) return [];
            var range = this.getItemRange(page);
            this._itemsHiding = this._itemsShowing;//隐藏当前显示内容
            this._itemsShowing = this._items.slice(range.start, range.end);
            this._itemsHiding.each(function(v,item){
                $(item).addClass("jp-hidden");
            });
            this._itemsShowing.each(function(v,item){
                $(item).removeClass("jp-hidden");
            });
            return range;
        },

        getItemRange: function (page) {
            var range = {};
            range.start = (page - 1) * this.options.perPage;
            range.end = range.start + this.options.perPage;
            if (range.end > this._items.length) range.end = this._items.length;
            return range;
        },

        updatePages: function (page) {
            var interval, index, nav;
            interval = this.getInterval(page);
            for (index in this._nav) {
                if (this._nav.hasOwnProperty(index)) {
                    this._nav[index].gotoInput.val("");
                    nav = this._nav[index];
                    this.updateBtns(nav, page);
                    this.updateCurrentPage(nav, page);
                    this.updatePagesShowing(nav, interval);
                    this.updateBreaks(nav, interval);
                }
            }
        },

        getInterval: function (page) {
            var start=page-1, end=page+this.options.midRange-1;
            if(end>=this._numPages){
                end = this._numPages;
                start = (end<this._numPages || this.options.midRange>this._numPages)?0:(end -this.options.midRange);
            }
            return {start: start, end: end};
        },

        updateBtns: function (nav, page) {
            if (page === 1) {
                nav.previous.addClass("jp-disabled");
            }
            if (page === this._numPages) {
                nav.next.addClass("jp-disabled");
            }
            if (this._currentPage === 1 && page > 1) {
                nav.previous.removeClass("jp-disabled");
            }
            if (this._currentPage === this._numPages && page < this._numPages) {
                nav.next.removeClass("jp-disabled");
            }
        },

        updateCurrentPage: function (nav, page) {
            nav.currentPage.removeClass("jp-current");
            nav.currentPage = nav.pages.eq(page - 1).addClass("jp-current");
        },

        updatePagesShowing: function (nav, interval) {
            var newRange = nav.pages.slice(interval.start, interval.end);
            nav.pagesShowing.not(newRange).addClass("jp-hidden");
            newRange.not(nav.pagesShowing).removeClass("jp-hidden");
            nav.pagesShowing = newRange;
        },

        updateBreaks: function (nav, interval) {
            if (interval.start > 0 ){
                nav.fstBreak.removeClass("jp-hidden");
            }else{
                nav.fstBreak.addClass("jp-hidden");
            }

            if (interval.end < this._numPages){
                nav.lstBreak.removeClass("jp-hidden");
            }else{
                nav.lstBreak.addClass("jp-hidden");
            }
        },
        /**
         *
         * @param page 当前页码
         * @param itemRange 数据区间
         * @param pageInterval 页码区间
         */
        callback: function (page, itemRange, pageInterval) {
            var pages = {
                current: page,
                interval: pageInterval,
                count: this._numPages
            };
            this.options.callback(pages);
        },

        _bind: function (fn, me) {
            return function () {
                return fn.apply(me, arguments);
            };
        }
    }

    $.pagination=function(options){
        return new Pagination(options);
    }
})(jQuery);
