/**
 * Created with IntelliJ IDEA.
 * @author: 爱看书不识字<zjh527@163.com>
 *
 * depend on:
 *  jquery.easyui.validatebox.extend.js
 *
 *
 * 扩展如下：
 * 1、自定义组件默认提示信息。
 *      1.1 提示信息显示控制：
 *          $('#cc').combo({
 *              customAttr:{
 *                  headervalue: '--请选择--'
 *              }
 *          })
 *
 *
 * 2、修改clear方法，使其调用时可出发onChange事件。
 *
 * 3、修改getValue方法，将原有返回值中的undefined改成null，方便后台程序处理。
 *
 * 4、编辑模式下支持自动完成功能。 默认当输入第3个字符时触发,后台可通过查询"wd"参数取得前台提交的值。
 *      4.1 控制设置
 *          $('#cc').combo({
 *              customAttr:{
 *                  autocomplete:{
 *                      enabled: true,  //开启此功能
 *                      minLength: 3,   //设置触发字符长度
 *                      url: 'search.action' //数据来源
 *                  }
 *              }
 *          })
 *
 * 5、以上扩展属性和方法都可以被继承自combo的组件所获得。
 */
(function($){

    function showHeaderValue(target){
        var optioins = $.data(target, 'combo').options;
        var opts = $.extend(true, {}, $.fn.combo.defaults, optioins);
        if(!opts.customAttr.headervalue) return;

        if(optioins.required){
            var validType = ['unequal["'+opts.customAttr.headervalue+'"]'];
            if(optioins.validType){
                if(typeof optioins.validType == 'string'){
                    validType.push(optioins.validType);
                    optioins.validType = validType;
                }

                if($.isArray(optioins.validType)){
                    $.merge(optioins.validType, validType)
                }
            }else{
                $.extend(optioins, {validType: validType});
            }
        }

        var onChangeCallback = optioins.onChange;
        $(target).combo({
                onChange: function(newValue, oldValue){
                    if(newValue == null || newValue == '') $(target).combo('setText', opts.customAttr.headervalue);
                    onChangeCallback.call(target, newValue, oldValue);
                }
            })
            .combo('textbox')
            .val(opts.customAttr.headervalue)
            .attr('prompt', opts.customAttr.headervalue)
            .focus(function(){
                if($(this).val() == opts.customAttr.headervalue) $(this).val('');
            })
            .blur(function(){
                if($.trim($(this).val())=='') $(this).val(opts.customAttr.headervalue);
                $(target).combo('validate');
            });
    }

    /**
     * 重写clear方法，目的是为了触发onChange事件，原生clear不触发onChange事件
     * @param target
     */
    function clear(target){
        var options = $.data(target, "combo").options;

        $(target).combo('setText', '');

        if(options.multiple){
            $(target).combo('setValues', []);
        }else{
            $(target).combo('setValue', '');
        }

    }

    function getValue(target){
        var values = $(target).combo('getValues');
        return values.length>0?(values[0]!=''?values[0]:null):null;
    }

    function autocompleteHandle(target){
        var optioins = $.extend(true, {}, $.fn.combo.defaults, $.data(target, 'combo').options);
        var autocompleteOpts = optioins.customAttr.autocomplete;
        if(!autocompleteOpts.enabled) return;

        $(target).combo('textbox').keypress(function(e){
            if($(this).val().length != 0 && $(this).val().length % autocompleteOpts.minLength ==0 && autocompleteOpts.url){
                $.ajax({
                    type: 'POST',
                    url: autocompleteOpts.url,
                    data: {wd: $(this).val()},
                    dataType: 'json',
                    success: function(data){
                        var sp = $(target).combo('panel').empty();
                        for(var i=0; i<data.length; i++){
                            $('<div>').addClass('combobox-item')
                                .attr('value', data[i].value)
                                .text(data[i].text)
                                .click(function(e){
                                    var v = $(this).attr('value');
                                    var s = $(this).text();
                                    $(target).combo('setValue', v).combo('setText', s).combo('hidePanel')
                                }).hover(function(){
                                    $(this).addClass('combobox-item-hover');
                                }, function(){
                                    $(this).removeClass('combobox-item-hover');
                                }).appendTo(sp);
                        }

                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown){
                        $.messager.alert('Error', errorThrown, 'error');
                    }
                });
            }
        });
    }

    $.fn.combo.defaults.customAttr={
        headervalue: null,
        autocomplete: {
            enabled: false,
            minLength: 3,
            url: undefined
        }
    };

    $.extend($.fn.combo.methods, {
        followCustomHandle: function(jq){
            return jq.each(function(){
                showHeaderValue(this);
                autocompleteHandle(this);
            });
        }
        ,clear: function(jq){
            return jq.each(function(){
                clear(this);
            });
        }
        ,getValue: function(jq){
            return getValue(jq[0]);
        }
    });
})(jQuery);