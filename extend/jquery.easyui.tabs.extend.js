/**
 * Created with IntelliJ IDEA.
 * @author: 爱看书不识字<zjh527@163.com>
 *
 * depend on:
 *  jquery.easyui.menu.extend.js
 *
 * 扩展如下：
 * 1、通过自定义属性控制标签页显示右键菜单，可自定义右键菜单项，自定义右键菜单项支持'-'定义菜单分割符，自定义菜单项是否与默认菜单合并。
 *      1.1 右键菜单默认菜单项：
 *          重新加载
 *          固定标签页
 *          取消固定标签
 *          关闭标签页
 *          关闭其他标签页
 *          关闭右侧标签页
 *          关闭所有标签页
 *
 *
 *      1.2 右键菜单显示控制：
 *          customAttr:{
 *              contextMenu:{
 *                  isShow: true
 *              }
 *          }
 *
 *
 *      1.3 右键菜单自定义菜单项和使用'-'定义菜单项分割符：
 *          customAttr:{
 *              contextMenu:{
 *                  isShow: true,
 *                  items: [
 *                      {text: 'Add', iconCls: 'icon-add', onclick: function(item, title, index, target){}},
 *                      {text: 'Save', iconCls: 'icon-save'},
 *                      '-',
 *                      {text: 'Close', iconCls: 'icon-close'}
 *                  ]
 *              }
 *          }
 *
 *          菜单项onclick方法，参数说明：
 *              item： 菜单项
 *              title: 触发右键菜单的标签页的标题
 *              index: 处罚右键菜单的标签页的索引号
 *              target: 指向当前tabs组件
 *
 *      1.4 自定义菜单项与默认菜单项合并：
 *          customAttr:{
 *              contextMenu:{
 *                  isShow: true,
 *                  isMerge: true,
 *                  items: [
 *                      {text: 'Add', iconCls: 'icon-add', onclick: function(item, title, index, target){}},
 *                      {text: 'Save', iconCls: 'icon-save'},
 *                      '-',
 *                      {text: 'Close', iconCls: 'icon-close'}
 *                  ]
 *              }
 *          }
 *
 *      1.5 菜单项onclick事件接收item, title, index, target参数
 *          item: 当前点击菜单项
 *          title: 当前触发contextmenu标签页的标题
 *          index: 当前触发contextmenu标签页的索引号
 *          target: 当前tabs的引用，非jQuery对象。
 *
 *
 * 2、增加自定义属性解析方法followCustomHandle，只有调用此方法之后customAttr中定义的扩展属性才会被解析执行。
 *      $('#tt').tabs({
 *          customAttr:{
 *              contextMenu:{
 *                  isShow: true
 *              }
 *          }
 *      }).tabs('followCustomHandle');
 *
 *
 *
 * 3、重写add方法，支持使用iframe加载url。
 *      3.1 通过useiframe属性控制是否使用iframe
 *          $('#tt').tabs('add',{
 *              title: 'New Tab',
 *              href: 'http://www.baidu.com',
 *              useiframe: true
 *          });
 *
 *
 *      3.2 改写content参数，使其支持url 。注意：只有当useiframe为true时，此方式才生效。
 *          $('#tt').tabs('add',{
 *              title: 'New Tab',
 *              useiframe: true,
 *              content: 'url:http://www.baidu.com'
 *          });
 *
 */

(function($){
    function getContextMenuId(target){
        return $(target).attr('id')+'_contextmenu';
    }

    function buildContextMenu(target, menuitems){
        var menuid = getContextMenuId(target);
        var contextmenu = $('#'+menuid);
        if(contextmenu.length==0){
            contextmenu = $('<div>', {id: menuid}).menu();
            contextmenu.menu('appendItems', menuitems);
        }
        return contextmenu;
    }

    function getMenuItemOnClickHandler(menuitems){
        var onclickHandler={};

        $.each(menuitems, function(){
            var item = this;
            if(item.onclick){
                var index = item.id || item.text;
                onclickHandler[index] = item.onclick;
                delete item.onclick;
            }

            if(item.submenu && $.isArray(item.submenu) && item.submenu.length>0){
                $.extend(onclickHandler, getMenuItemOnClickHandler(item.submenu));
            }
        });

        return onclickHandler;
    }

    /**
     * 解决在menu.onClick事件和item.onclick同时触发调用。
     * @param target
     */
    function initContextMenu(target){
        var opts = $.extend(true, {}, $.fn.tabs.defaults, $.data(target, 'tabs').options);
        var menuOpts = opts.customAttr.contextMenu;
        if(!menuOpts.isShow) return;

        var menuitems = getDefaultContextMenuItems(target);
        if(menuOpts.isMerge && $.isArray(menuOpts.items) && menuOpts.items.length>0){
            menuitems = $.merge(menuitems, menuOpts.items);
        }

        if(!menuOpts.isMerge && $.isArray(menuOpts.items) && menuOpts.items.length>0){
            menuitems = menuOpts.items;
        }

        var onClickHandlerCache = getMenuItemOnClickHandler(menuitems);
        var contextmenu = buildContextMenu(target, menuitems);
        $(target).tabs({
            onContextMenu: function(e, title, index){
                e.preventDefault();
                modifyItemText(target, contextmenu, index);
                contextmenu.menu({
                    onClick: function(item){
                        var name = item.id || item.text;
                        if(onClickHandlerCache[name]){
                            onClickHandlerCache[name].call(this, item, title, index, target);
                        }
                    }
                }).menu('show',{
                    left: e.pageX,
                    top: e.pageY
                });
            }
        });
    }

    function modifyItemText(target, contextmenu, index){
        var menuid = getContextMenuId(target);
        var itemEl = $('#'+menuid+'_fixed');
        if($.inArray(index, $.fn.tabs.defaults.customAttr.fixedtabs) == -1 && !$(target).tabs('getTab', index).panel('options').closable){
            contextmenu.menu('setText', {target: itemEl, text: $.fn.tabs.defaults.contextMenu.itemname.unfixtab});
        }else{
            contextmenu.menu('setText', {target: itemEl, text: $.fn.tabs.defaults.contextMenu.itemname.fixtab});
            if($.inArray(index, $.fn.tabs.defaults.customAttr.fixedtabs)>-1){
                contextmenu.menu('disableItem', itemEl);
            }else{
                contextmenu.menu('enableItem', itemEl);
            }
        }

        itemEl = $('#'+menuid+'_close');
        if(!$(target).tabs('getTab', index).panel('options').closable){
            contextmenu.menu('disableItem', itemEl);
        }else{
            contextmenu.menu('enableItem', itemEl);
        }

    }

    function getDefaultContextMenuItems(target){
        var menuid = getContextMenuId(target);
        return [
            {
                id: menuid+'_reload',
                text: $.fn.tabs.defaults.contextMenu.itemname.reload,
                onclick: $.fn.tabs.defaults.contextMenu.defaultEventsHandler.reload
            },
            {
                id: menuid+'_fixed',
                text: $.fn.tabs.defaults.contextMenu.itemname.fixtab,
                onclick: function(item, title, index, tabs){
                    if(item.text == $.fn.tabs.defaults.contextMenu.itemname.fixtab)
                        $.fn.tabs.defaults.contextMenu.defaultEventsHandler.fixtab(item, title, index, tabs);
                    else
                        $.fn.tabs.defaults.contextMenu.defaultEventsHandler.unfixtab(item, title, index, tabs)
                }
            },
            '-',
            {
                id: menuid+'_close',
                text: $.fn.tabs.defaults.contextMenu.itemname.close,
                onclick: $.fn.tabs.defaults.contextMenu.defaultEventsHandler.closetab
            },
            {
                id: menuid+'_close_others',
                text: $.fn.tabs.defaults.contextMenu.itemname.closeothers,
                onclick: $.fn.tabs.defaults.contextMenu.defaultEventsHandler.closeOthersTab
            },
            {
                id: menuid+'_close_rightside',
                text: $.fn.tabs.defaults.contextMenu.itemname.closerightside,
                onclick: $.fn.tabs.defaults.contextMenu.defaultEventsHandler.closeRightSideTabs
            },
            {
                id: menuid+'_close_all',
                text: $.fn.tabs.defaults.contextMenu.itemname.closeall,
                onclick: $.fn.tabs.defaults.contextMenu.defaultEventsHandler.closeAll
            }
        ];
    }

    function getHeader(target, index){
        var headers = [];
        index++;
        $(target).children('div.tabs-header').find('ul li:nth-child('+index+')').each(function(){
            headers.push(this);
        });
        return headers.length>0?headers[0]:null;
    }

    function resortTabs(target, minIndex, maxIndex, reverse){
        if(typeof maxIndex == 'number' && typeof minIndex == 'number'){
            var tabs = $.data(target, 'tabs').tabs;
            if(maxIndex<0 || maxIndex>tabs.length) return;
            if(minIndex<0 || minIndex>tabs.length) return;


            if(reverse){
                var srcTab = tabs[maxIndex];
                for(var i=maxIndex; i>minIndex; i--){
                    tabs.splice(i, 1, tabs[i-1]);
                }
                tabs[minIndex] = srcTab;

                var destHeader = getHeader(target, minIndex);
                if(destHeader){
                    var srcheader = getHeader(target, maxIndex);
                    $(destHeader).before(srcheader);
                }
            }else{
                var srcTab = tabs[minIndex];
                for(var j=minIndex; j<=maxIndex; j++){
                    tabs.splice(j, 1, tabs[j+1]);
                }
                tabs[maxIndex]= srcTab;

                var destHeader = getHeader(target, maxIndex);
                if(destHeader){
                    var srcHeader = getHeader(target, minIndex);
                    $(destHeader).after(srcHeader);
                }
            }
        }
    }

    function getFixedTabs(target){
        var tabs = $(target).tabs('tabs');
        var fixedtabs = [];
        for(var i=0; i<tabs.length; i++){
            var tab = tabs[i];
            if(tab.panel('options').closable == undefined ||!tab.panel('options').closable){
                fixedtabs.push(tab);
            }
        }

        return fixedtabs;
    }

    function appendIframeToTab(target, tabTitle, url){
        var iframe = $('<iframe>')
            .attr('height', '98%')
            .attr('width', '100%')
            .attr('marginheight', '0')
            .attr('marginwidth', '0')
            .attr('frameborder', '0');

        setTimeout(function(){
            iframe.attr('src', url);
        }, 1);

        var tab = $(target).tabs('getTab', tabTitle);
        tab.panel('body').empty().append(iframe);
    }

    $.fn.tabs.defaults.contextMenu={}
    $.fn.tabs.defaults.contextMenu.itemname={};
    $.fn.tabs.defaults.contextMenu.itemname.reload = '重新加载';
    $.fn.tabs.defaults.contextMenu.itemname.fixtab = '固定标签页';
    $.fn.tabs.defaults.contextMenu.itemname.unfixtab = '取消固定标签';
    $.fn.tabs.defaults.contextMenu.itemname.close = '关闭标签页';
    $.fn.tabs.defaults.contextMenu.itemname.closeothers = '关闭其他标签页';
    $.fn.tabs.defaults.contextMenu.itemname.closerightside = '关闭右侧标签页';
    $.fn.tabs.defaults.contextMenu.itemname.closeall = '关闭所有标签页';

    $.fn.tabs.defaults.contextMenu.defaultEventsHandler ={
        reload: function(item, title, index, target){
            $(target).tabs('getTab', index).panel('refresh');
        },
        fixtab: function(item, title, index, target){
            var tab = $(target).tabs('getTab', index);
            $(target).tabs('update', {tab: tab, options:{closable: false}});


            var minIndex = $.fn.tabs.defaults.customAttr.fixedtabs.length;
            resortTabs(target, minIndex, index, true);
        },
        unfixtab: function(item, title, index, target){
            var maxIndex = getFixedTabs(target).length-1;
            var tab = $(target).tabs('getTab', index);
            $(target).tabs('update', {tab: tab, options:{closable: true}});

            resortTabs(target, index, maxIndex);

        },
        closetab: function(item, title, index, target){
            var panelOpts = $(target).tabs('getTab', index).panel('options');
            if(panelOpts.closable){
                $(target).tabs('close', index);
            }
        },
        closeOthersTab: function(item, titl, index, target){
            var tabs = $(target).tabs('tabs');
            var panels = $.grep(tabs, function(tab, i){
                return tab.panel('options').closable && i!=index;
            });

            $.each(panels, function(){
                $(target).tabs('close', this.panel('options').title);
            })
        },
        closeRightSideTabs: function(item, title, index, target){
            var tabs = $(target).tabs('tabs');
            var panels = $.grep(tabs, function(tab, i){
                return i>index && tab.panel('options').closable;
            });

            $.each(panels, function(){
                $(target).tabs('close', this.panel('options').title);
            });
        },
        closeAll: function(item, title, index, target){
            var tabs = $(target).tabs('tabs');
            var panels = $.grep(tabs, function(tab, i){
                return tab.panel('options').closable
            });
            $.each(panels, function(){
                $(target).tabs('close', this.panel('options').title);
            });
        }
    }

    $.fn.tabs.defaults.customAttr={
        fixedtabs:[0],
        contextMenu: {
            isShow: false,
            isMerge: true,
            items:[]
        }
    };


    var defaultMethods = $.extend({}, $.fn.tabs.methods);

    $.extend($.fn.tabs.methods, {
        followCustomHandle: function(jq){
            return jq.each(function(){
                initContextMenu(this);
            });
        },
        add: function(jq, options){
            return jq.each(function(){
                var url = null;
                if(options.href || /^url:/.test(options.content)){
                    url = options.href || options.content.substr(4, options.content.length);
                    delete options.content;
                    delete options.href;
                }


                if(url){
                    if(options.useiframe){
                        defaultMethods.add(jq, options);
                        appendIframeToTab(this, options.title, url);
                    }else{
                        defaultMethods.add(jq, $.extend(options, {href: url}));
                    }
                }else{
                    defaultMethods.add(jq, options);
                }
            });
        }
    });
})(jQuery);
