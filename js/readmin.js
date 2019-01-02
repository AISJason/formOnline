var R = {
    notVal: function (v) {
        return v === undefined || v === null || v === 'undefined';
    },
    val: function (v) {
        return v !== undefined && v !== null && v !== 'undefined';
    },
    hasArray: function (data) {
        return $.isArray(data) && data.length > 0
    },
    hasObject: function (data) {
        return $.isPlainObject(data) && !$.isEmptyObject(data);
    },
    getByteLen: function (val) {
        var len = 0;
        for (var i = 0; i < val.length; i++) {
            var length = val.charCodeAt(i);
            if (length >= 0 && length <= 128) {
                len += 1;
            }
            else {
                len += 2;
            }
        }
        return len;
    },
    getQueryPara: function (name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
        var r = window.location.search.substr(1).match(reg);
        if (R.val(r))
            return unescape(r[2]);
        else
            return null;
    },
    trimAll: function (str) {
        //去除所有空格
        if (str !== undefined)
            return str.replace(/\s/g, '');
        else
            return '';
    },
    jsonClone: function (data) {
        return JSON.parse(JSON.stringify(data));
    },
    ajaxPostJson: function (url, data, callBack) {
        var options = {
            url: url,
            type: 'POST',
            traditional: true,
            dataType: 'json',
            cache: false,
            success: function (res) {
                if (typeof callBack === 'function') {
                    callBack(res)
                } else if (typeof data === 'function') {
                    data(res);
                }
            }
        };
        if (R.hasObject(data)) options.data = data;
        $.ajax(options);
    },
    getFormHtml: function (json) {
        //根据Json获取html
        var html = '';
        var isArry = $.isArray(json);
        if (!isArry) {
            if (!R.hasObject(json)) return;
            var tag = '', type = '';
            var child;
            $.each(json, function (k, v) {
                if ($.isArray(v)) {
                    child = v;
                    return;
                }

                if ($.isPlainObject(v)) return;

                if (k === 'tag') {
                    tag = v;
                    html += '<' + tag;
                }
                else if (k === 'itemId') {
                    if (v === '') {
                        v = R.uuid(10, 10);
                        json[k] = v;
                    }
                    html += ' reitemid="' + v + '"'
                }
                else {
                    html += ' ' + k + '="' + v + '"';
                }
            });
            html += '>';
            if (child && child.length > 0) {
                html += R.getFormHtml(child);
            }
            html += '</' + tag + '>';

        } else {
            $.each(json, function (idx, data) {
                if (!R.hasObject(data)) return;
                html += R.getFormHtml(data);
            })
        }
        return html;
    },
    bindExpiresTime: function (elem) {

        if (!elem.attr('expires'))
            return;

        var time = Math.round((elem.attr('expires') - new Date().getTime()) / 1000);
        elem.html(time + ' S');
        if (time <= 0) {
            elem.html('重新获取');
            return;
        }

        setTimeout(function () {
            R.bindExpiresTime(elem);
        }, 1000);
    },
    bindFormHtml: function (jsonData, type) {
        if (!R.hasObject(jsonData)) return;
        //根据json绑定html
        if (jsonData.array) {
            $.each(jsonData.array, function (idx, json) {
                R.bindFormHtml(json, type);
            });
        }
        if (jsonData.itemData) {
            var elementType = jsonData.itemData.elementType;
            //绑定文本
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindtext]'), function () {
                $(this).html(jsonData.itemData[$(this).attr('bindText')]);

                if (type !== 0) $(this).removeAttr('bindtext');
            });
            //绑定field名称
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindfield]'), function () {
                if (type !== 0) $(this).removeAttr('bindfield');

                $(this).attr('fieldName', jsonData.itemData.fieldName);
            });
            //绑定name值
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindname]'), function () {
                if (type !== 0) $(this).removeAttr('bindname');

                var name = jsonData.itemData.itemName;
                if (!name || name === '') {
                    name = 'Name_' + R.uuid(8, 16);
                    jsonData.itemData.itemName = name;
                }

                $(this).attr('name', name);

                if (jsonData.itemData.defaultVal) $(this).val(jsonData.itemData.defaultVal);
            });
            //绑定默认显示
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindplaceholder]'), function () {
                $(this).attr('placeholder', jsonData.itemData[$(this).attr('bindplaceholder')]);

                if (type !== 0) $(this).removeAttr('bindplaceholder');
            });
            //绑定显示隐藏
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindhide]'), function () {
                if (jsonData.itemData[$(this).attr('bindhide')])
                    $(this).removeClass('layui-hide');
                else
                    $(this).addClass('layui-hide');

                if (type !== 0) $(this).removeAttr('bindhide');
            });
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindhidden]'), function () {
                if (type === 0) $(this).parent().parent().css({'background-color': '#F0F0F0', 'min-height': '37px'});

                if (type === 1) {
                    $(this).removeAttr('bindhidden');
                    $(this).parent().parent().hide();
                    $(this).closest('[reitemid]').find('label').remove();
                }
            });
            //绑定显示隐藏
            // $.each($('[reitemid="' + jsonData.itemId + '"] [bindeditarea]'), function () {
            //     if (!debug) $(this).removeAttr('bindeditarea');
            //     else {
            //         $(this).removeClass('edit-area');
            //         $(this).addClass('edit-area');
            //     }
            // });
            //绑定图形验证码
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindimgcode]'), function () {
                if (type !== 0) $(this).removeAttr('bindimgcode');

                // $(this).attr('retype', 'imgCode');

                var img = $(this).parent().next();
                img.css({'cursor': 'pointer', 'margin-bottom': '0px', 'box-sizing': 'border-box', 'height': '38px'});

                $(this).parent().next().next().remove();
                var time = $(this).parent().next().after('<div class="layui-inline" style="margin-bottom: 0 !important;"><div class="layui-form-mid layui-word-aux"></div></div>').next().children();

                var timer = parseInt(jsonData.itemData.expiresTime);
                var length = parseInt(jsonData.itemData.codeLength);
                var expires = new Date().getTime() + timer * 60 * 1000;
                time.attr('expires', expires);
                R.bindExpiresTime(time);
                time.attr('length', length);

                $.post('/getImgCode', {timer: timer, length: length}, function (res) {
                    if (res.code === -1) R.goError(res.msg, res.errPage);
                    if (res.code === 1) return R.goMsgWarn(res.msg);
                    if (res.result) {
                        img.html(res.result);
                        img.children(':eq(0)').attr('viewBox', '0,3,150,38')
                    }
                }, 'json');

                img.unbind('click');
                img.on('click', function () {
                    // if (new Date().getTime() < expires) return layer.tips('尚未失效，无需重复获取...', img, {
                    //     tips: 1
                    // });

                    expires = new Date().getTime() + timer * 60 * 1000;
                    time.attr('expires', expires);
                    R.bindExpiresTime(time);
                    time.attr('length', length);

                    $.post('/getImgCode', {timer: timer, length: length}, function (res) {
                        if (res.code === -1) R.goError(res.msg, res.errPage);
                        if (res.code === 1) return R.goMsgWarn(res.msg);
                        if (res.result) {
                            img.html(res.result);
                            img.children(':eq(0)').attr('viewBox', '0,3,150,38')
                        }
                    }, 'json');
                });

                $(this).attr('lay-verify', 'imgCode');

                $(this).attr('lay-verType', 'tips');
                $(this).attr('requiredMsg', '请输入' + length + '位图形验证码！');

            });
            //绑定手机验证码
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindphonecode]'), function () {
                if (type !== 0) $(this).removeAttr('bindphonecode');

                // $(this).attr('retype', 'phoneCode');

                var phone = $('[reitemid="' + jsonData.relevanceId + '"]').find('input');

                var timer = parseInt(jsonData.itemData.expiresTime);
                var length = parseInt(jsonData.itemData.codeLength);
                var expires = null;

                var link = $(this).parent().next().find('a');
                link.removeAttr('expires');
                link.attr('href', '#');
                link.html('获取');

                link.unbind('click');
                link.on('click', function () {
                    phone.addClass('layui-form-danger');
                    if ($.trim(phone.val()) === '') {
                        phone.focus();
                        return layer.tips('请输入手机号码...', phone, {
                            tips: 1
                        });
                    }
                    if (!R.regular.phoneNumber.test(phone.val())) {
                        phone.focus();
                        return layer.tips('请输入正确的手机号码...', phone, {
                            tips: 1
                        });
                    }
                    phone.removeClass('layui-form-danger');
                    link.attr('phone', phone.val());

                    if (expires === null || expires != null && new Date().getTime() > expires) {
                        link.removeAttr('expires');
                        expires = new Date().getTime() + timer * 60 * 1000;
                        link.attr('expires', expires);
                        link.attr('length', length);
                        R.bindExpiresTime(link);

                        $.post('/getPhoneCode', {
                            timer: timer,
                            phoneNumber: phone.val(),
                            length: length
                        }, function (res) {

                            if (res.code === -1) R.goError(res.msg, res.errPage);
                            if (res.code === 1) return R.goMsgWarn(res.msg);
                            if (res.result) R.alertOk('测试', '仅为测试，手机验证码：' + res.result);
                            else R.msgOk(res.msg)
                        }, 'json');
                    }
                });

                $(this).attr('lay-verify', 'phoneCode');
                $(this).attr('lay-verType', 'tips');
                $(this).attr('requiredMsg', '请输入' + length + '位手机验证码！');

            });
            //绑定验证
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindverify]'), function () {
                if (type !== 0) $(this).removeAttr('bindverify');

                var verify = $(this);
                verify.removeAttr('lay-verify');
                verify.removeAttr('_lay-verify');

                verify.removeAttr('minLen');
                verify.removeAttr('maxLen');
                verify.removeAttr('minVal');
                verify.removeAttr('maxVal');
                verify.removeAttr('decimalPlace');
                verify.removeAttr('minChecked');
                verify.removeAttr('maxChecked');
                verify.removeAttr('requiredMsg');
                verify.removeAttr('chooseMsg');
                verify.removeAttr('regular');
                verify.removeAttr('regularMsg');

                var required = jsonData.itemData.required;
                var choose = jsonData.itemData.choose;

                if (required && (elementType === 'string' || elementType === 'textArea' || elementType === 'password'))
                    verify.attr('lay-verify', 'required');
                else if (required && elementType === 'int')
                    verify.attr('lay-verify', 'required|int');
                else if (required && elementType === 'decimal')
                    verify.attr('lay-verify', 'required|decimal');
                else if (required && elementType === 'chinese')
                    verify.attr('lay-verify', 'required|chinese');
                else if (required && elementType === 'email')
                    verify.attr('lay-verify', 'required|email');
                else if (required && elementType === 'phoneNumber')
                    verify.attr('lay-verify', 'required|phoneNumber');
                else if (required && elementType === 'telephoneNumber')
                    verify.attr('lay-verify', 'required|telephoneNumber');
                else if (required && elementType === 'url')
                    verify.attr('lay-verify', 'required|url');
                else if (choose && elementType === 'dateTime')
                    verify.attr('lay-verify', 'required|dateTime');

                else if (!required && (elementType === 'string' || elementType === 'textArea' || elementType === 'password'))
                    verify.attr('lay-verify', 'fillRequired');
                else if (!required && elementType === 'int')
                    verify.attr('lay-verify', 'int');
                else if (!required && elementType === 'decimal')
                    verify.attr('lay-verify', 'decimal');
                else if (!required && elementType === 'chinese')
                    verify.attr('lay-verify', 'chinese');
                else if (!required && elementType === 'email')
                    verify.attr('lay-verify', 'email');
                else if (!required && elementType === 'phoneNumber')
                    verify.attr('lay-verify', 'phoneNumber');
                else if (!required && elementType === 'telephoneNumber')
                    verify.attr('lay-verify', 'telephoneNumber');
                else if (!required && elementType === 'url')
                    verify.attr('lay-verify', 'url');
                else if (!choose && elementType === 'dateTime')
                    verify.attr('lay-verify', 'dateTime');

                else if (choose && elementType === 'select')
                    verify.attr('lay-verify', 'selected');
                else if (choose && elementType === 'selects')
                    verify.attr('lay-verify', 'selects');
                else if (choose)
                    verify.attr('lay-verify', 'checked');

                verify.attr('lay-verType', 'tips');

                $.each(jsonData.itemData, function (k, v) {
                    if ((k === 'minLen' || k === 'maxLen' || k === 'minVal' || k === 'maxVal' || k === 'decimalPlace' || k === 'minChecked' || k === 'maxChecked' || k === 'requiredMsg' || k === 'chooseMsg' || k === 'regular' || k === 'regularMsg') && v !== '') {
                        verify.attr(k, v);
                    }
                })
            });
            //绑定单选、复选
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindcheckbox]'), function () {
                if (type !== 0) $(this).removeAttr('bindcheckbox');

                var name = jsonData.itemData.itemName;
                if (!name || name === '') {
                    name = 'Name_' + R.uuid(8, 16);
                    jsonData.itemData.itemName = name;
                }

                var template = $(this).children(':first');
                // template.attr('retype', template.attr('type'));

                var html = '';

                var strArr = R.trimAll(jsonData.itemData.options).split(',');
                var defaultArr = R.trimAll(jsonData.itemData.optionsChecked).split(',');
                var tempAry = [];

                $.each(strArr, function (k, v) {
                    if (v !== '' && $.inArray(v, tempAry) === -1) {
                        tempAry.push(v);
                        template.removeAttr('checked');
                        template.removeAttr('lay-skin');
                        template.attr('name', jsonData.itemData.itemName).attr('title', v).val(v);
                        if ($.inArray(v, defaultArr) > -1)
                            template.attr('checked', 'checked');

                        if (jsonData.itemData.checkboxTheme === '1')
                            template.attr('lay-skin', 'primary');

                        html += template.prop('outerHTML');
                    }
                });
                $(this).children().remove();
                $(this).append(html);
            });
            //下拉列表
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindselect]'), function () {
                if (type !== 0) $(this).removeAttr('bindselect');

                $(this).removeAttr('lay-search');
                if (jsonData.itemData.optionsSearch) {
                    $(this).attr('lay-search', '');
                }
                var html = '<option value="">' + jsonData.itemData.optionsTip + '</option>';
                var strArr = R.trimAll(jsonData.itemData.options).split(',');
                var tempAry = [];

                $.each(strArr, function (k, v) {
                    if (v !== '' && $.inArray(v, tempAry) === -1) {
                        tempAry.push(v);
                        html += '<option value="' + v + '">' + v + '</option>';
                    }
                });
                $(this).children().remove();
                $(this).append(html);
            });
            //绑定下拉多选
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindselects]'), function () {
                if (type !== 0) $(this).removeAttr('bindselects');

                // $(this).attr('retype', 'selects');

                var selectId = jsonData.itemData.itemName;
                if (type !== 0) selectId = R.uuid(10, 10);

                $(this).removeAttr('xm-select-search');
                if (jsonData.itemData.optionsSearch) {
                    $(this).attr('xm-select-search', '');
                }
                $(this).attr('xm-select-skin', 'default');
                $(this).attr('xm-select', selectId);
                var strArr = R.trimAll(jsonData.itemData.options).split(',');
                var tempAry = [];
                //var dataAry = [];
                var html = '<option value="">' + jsonData.itemData.optionsTip + '</option>';
                $.each(strArr, function (k, v) {
                    if (v !== '' && $.inArray(v, tempAry) === -1) {
                        //dataAry.push({name: v, value: v});
                        html += '<option value="' + v + '">' + v + '</option>';
                        tempAry.push(v);
                    }
                });
                $(this).children().remove();
                $(this).append(html);

                formSelects.render(selectId);

                // $('input [name="'+jsonData.itemData.itemName+'"]').attr('autocomplete','off');

                // formSelects.data(selectId, 'local', {
                //     arr: dataAry
                // });
            });
            //绑定开关
            $.each($('[reitemid="' + jsonData.itemId + '"] [bindswitch]'), function () {
                if (type !== 0) $(this).removeAttr('bindswitch');

                $(this).attr('lay-skin', 'switch').attr('lay-text', jsonData.itemData.switchText).val('1');
                $(this).removeAttr('checked');
                if (jsonData.itemData.switchDefault)
                    $(this).attr('checked', 'checked')
            });
            //绑定日期
            $.each($('[reitemid="' + jsonData.itemId + '"] [binddatetime]'), function () {
                if (type !== 0) $(this).removeAttr('binddatetime');

                $(this).removeAttr('lay-key');
                $(this).after($(this).prop('outerHTML'));
                $(this).remove();
                laydate.render({
                    elem: '.re-element-view-form [name="' + jsonData.itemData.itemName + '"]',
                    trigger: 'click',
                    type: jsonData.itemData.dateType,
                    format: jsonData.itemData.dateFormat
                });
                laydate.render({
                    elem: '.re-view-form [name="' + jsonData.itemData.itemName + '"]',
                    trigger: 'click',
                    type: jsonData.itemData.dateType,
                    format: jsonData.itemData.dateFormat
                });
            });
        }
    },

    regular: {
        required: /[\S]+/,
        int: /^-?\d+$/,
        chinese: /^[\u4e00-\u9fa5]+$/,
        email: /^[\w\-\.]+@[\w\-\.]+(\.\w+)+$/,
        phoneNumber: /^((13[0-9])|(14[5,7,9])|(15[^4])|(18[0-9])|(17[0,1,3,5,6,7,8]))\d{8}$/,
        telephoneNumber: /^((0\d{2,3})-?)(\d{7,8})(-(\d{3,}))?$/,
        url: /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/,
        identity: /(^\d{15}$)|(^\d{17}(x|X|\d)$)/,
        dateTime: /^(\d{4})[-\/](\d{1}|0\d{1}|1[0-2])([-\/](\d{1}|0\d{1}|[1-2][0-9]|3[0-1]))*$/
    },
    verify: {
        required: function (value, item) {
            var title = $(item).attr('fieldname');
            title = title ? title : '';

            if (!value || $.trim(value) === '')
                return $(item).attr('requiredmsg') ? $(item).attr('requiredmsg') : title + '不能为空！';

            value = $.trim(value);

            var vLen = R.trimAll(value).length;
            if (vLen < $(item).attr('minLen'))
                return title + '长度不能小于' + $(item).attr('minLen') + '！';

            if (vLen > $(item).attr('maxLen'))
                return title + '长度不能大于' + $(item).attr('maxLen') + '！';

            var regular = $(item).attr('regular');
            var regularMsg = $(item).attr('regularMsg');
            if (regular && !new RegExp(regular).test(value))
                return regularMsg ? regularMsg : title + '不符合要求！';
        },
        fillRequired: function (value, item) {
            if (value) {
                value = $.trim(value);

                var title = $(item).attr('fieldname');
                title = title ? title : '';

                var vLen = R.trimAll(value).length;
                if (vLen < $(item).attr('minLen'))
                    return title + '长度不能小于' + $(item).attr('minLen') + '！';

                if (vLen > $(item).attr('maxLen'))
                    return title + '长度不能大于' + $(item).attr('maxLen') + '！';

                var regular = $(item).attr('regular');
                var regularMsg = $(item).attr('regularMsg');
                if (regular && !new RegExp(regular).test(value))
                    return regularMsg ? regularMsg : title + '不符合要求！';
            }
        },
        visibleRequired: function (value, item) {
            if ($(item).is(':visible')) {
                var title = $(item).attr('fieldname');
                title = title ? title : '';

                if (!value || $.trim(value) === '')
                    return $(item).attr('requiredmsg') ? $(item).attr('requiredmsg') : title + '不能为空！';
            }
        },
        int: function (value, item) {
            if (value) {
                value = $.trim(value);

                var title = $(item).attr('fieldname');
                title = title ? title : '';

                if (!R.regular.int.test(value))
                    return title + '只能输入整数！';

                var intVal = parseInt(value);
                if (intVal < $(item).attr('minVal'))
                    return title + '不能小于' + $(item).attr('minVal') + '！';

                if (intVal > $(item).attr('maxVal'))
                    return title + '不能大于' + $(item).attr('maxVal') + '！';
            }
        },
        decimal: function (value, item) {
            if (value) {
                value = $.trim(value);

                var title = $(item).attr('fieldname');
                title = title ? title : '';

                if (isNaN(value))
                    return title + '只能输入数字！';

                var decimalVal = parseFloat(value);
                if (decimalVal < $(item).attr('minVal'))
                    return title + '不能小于' + $(item).attr('minVal') + '！';

                if (decimalVal > $(item).attr('maxVal'))
                    return title + '不能大于' + $(item).attr('maxVal') + '！';

                var decimalPlace = value.length - value.indexOf('.') - 1;
                if (value.indexOf('.') > -1 && decimalPlace > $(item).attr('decimalPlace'))
                    return title + '不能超过' + $(item).attr('decimalPlace') + '位小数！';
            }
        },
        chinese: function (value, item) {
            if (value) {
                value = $.trim(value);

                var title = $(item).attr('fieldname');
                title = title ? title : '';

                if (!R.regular.chinese.test(value))
                    return title + '只能输入中文汉字！';

                var vLen = R.trimAll(value).length;
                if (vLen < $(item).attr('minLen'))
                    return title + '字数不能小于' + $(item).attr('minLen') + '！';

                if (vLen > $(item).attr('maxLen'))
                    return title + '字数不能大于' + $(item).attr('maxLen') + '！';
            }
        },
        email: function (value, item) {
            if (value && !R.regular.email.test($.trim(value)))
                return '请输入正确的电子邮箱！';
        },
        phoneNumber: function (value, item) {
            if (value && !R.regular.phoneNumber.test($.trim(value)))
                return '请输入正确的手机号码！';
        },
        telephoneNumber: function (value, item) {
            if (value && !R.regular.telephoneNumber.test($.trim(value)))
                return '请输入正确的固定电话！';
        },
        url: function (value, item) {
            if (value && !R.regular.url.test($.trim(value)))
                return '请输入正确的网址！';
        },
        regular: function (value, item) {
            if (value) {
                value = $.trim(value);

                if (value && (value.substr(value.length - 1) === '/' || value.substr(0, 1) === '/'))
                    return '请输入正确的正则表达式，无需首位"/"！';
            }
        },
        dateTime: function (value, item) {
            if (!R.regular.dateTime.test($.trim(value)))
                return '请输入正确的日期！';
        },
        checked: function (value, item) {
            var title = $(item).attr('fieldname');
            title = title ? title : '';

            var checkedLen = $(item).find('input:checked').length;
            if (checkedLen === 0)
                return $(item).attr('choosemsg') ? $(item).attr('choosemsg') : '请选择' + title + '!';

            var minChecked = $(item).attr('minChecked');
            if (checkedLen < minChecked)
                return title + '最少需要选中' + minChecked + '项！';

            var maxChecked = $(item).attr('maxChecked');
            if (checkedLen > maxChecked)
                return title + '最多只能选中' + maxChecked + '项！';
        },
        selected: function (value, item) {
            var title = $(item).attr('fieldname');
            title = title ? title : '';
            value = $.trim(value);
            if (!value || value === '')
                return $(item).attr('choosemsg') ? $(item).attr('choosemsg') : '请选择' + title + '!';
        },
        selects: function (value, item) {
            var oldItem = $(item).parent().parent().prev();
            var title = oldItem.attr('fieldname');
            title = title ? title : '';

            var checkedLen = value ? value.split(',').length : 0;
            if (checkedLen === 0)
                return oldItem.attr('choosemsg') ? oldItem.attr('choosemsg') : '请选择' + title + '!';

            var minChecked = oldItem.attr('minChecked');
            if (checkedLen < minChecked)
                return title + '最少需要选中' + minChecked + '项！';

            var maxChecked = oldItem.attr('maxChecked');
            if (checkedLen > maxChecked)
                return title + '最多只能选中' + maxChecked + '项！';
        },
        imgCode: function (value, item) {
            var title = $(item).attr('fieldname');
            title = title ? title : '';

            var img = $(item).parent().next();

            var length = img.next().children().attr('length');
            length = !length ? 5 : parseInt(length);

            if (!value || $.trim(value) === '' || $.trim(value).length !== length)
                return $(item).attr('requiredmsg') ? $(item).attr('requiredmsg') : title + '不能为空！';

            if (new Date().getTime() > img.next().children().attr('expires'))
                return '图形已过期，请重新获取...';

            var rs = {code: 1, msg: '验证中...'};
            // $.ajaxSettings.async = false;
            // $.post("/verifyImgCode", {imgCode: value}, function (res) {
            //     rs = res;
            // }, 'json');
            // $.ajaxSettings.async = true;

            if ($('body').find('[name="' + $(item).attr('name') + '_temp"]').val()) {
                $('body').find('[name="' + $(item).attr('name') + '_temp"]').remove();
                return '';
            } else {
                R.ajaxPostJson('/verifyImgCode', {imgCode: value}, function (res) {
                    rs = res;
                    if (rs.code === 1 || rs.code === -1) {
                        if (new Date().getTime() > img.next().children().attr('expires'))
                            img.click();

                        $(item).val('');
                        layer.tips(rs.msg, $(item), {
                            tips: 1
                        });
                    }
                    if (rs.code === 0) {
                        $('body').append('<input type="hidden" name="' + $(item).attr('name') + '_temp" value="1">');
                        $(item).closest('form').find('[lay-submit]').click();
                    }
                });
                return rs.msg;
            }
        },
        phoneCode: function (value, item) {
            var title = $(item).attr('fieldname');
            title = title ? title : '';

            var length = $(item).parent().next().find('[length]').attr('length');
            length = !length ? 6 : parseInt(length);

            if (!value || $.trim(value) === '' || $.trim(value).length !== length)
                return $(item).attr('requiredmsg') ? $(item).attr('requiredmsg') : title + '不能为空！';

            var phoneItem = $(item).closest('[reitemid]').attr('relevanceid');

            var phone = $(item).parent().next().find('[phone]').attr('phone');
            var expires = $(item).parent().next().find('[expires]').attr('expires');

            if (!phone)
                return '请先获取手机验证码...';
            if (phone && $('[reitemid="' + phoneItem + '"]').find('input').val() !== phone) {
                $(item).val('');
                return '手机号码已变更，请重新获取...';
            }
            if (new Date().getTime() > expires) {
                $(item).val('');
                return '手机验证码已过期，请重新获取...';
            }

            var rs = {code: 1, msg: '验证中...'};

            if ($('body').find('[name="' + $(item).attr('name') + '_temp"]').val()) {
                $('body').find('[name="' + $(item).attr('name') + '_temp"]').remove();
                return '';
            } else {

                R.ajaxPostJson('/verifyPhoneCode', {phoneCode: value, phoneNumber: phone}, function (res) {
                    rs = res;
                    if (rs.code === 1 || rs.code === -1) {
                        $(item).val('');
                        layer.tips(rs.msg, $(item), {
                            tips: 1
                        });
                    }
                    if (rs.code === 0) {
                        $('body').append('<input type="hidden" name="' + $(item).attr('name') + '_temp" value="1">');
                        $(item).closest('form').find('[lay-submit]').click();
                    }
                });

                return rs.msg;
            }
        }
    },

    updateJsonListObjIndex: function (jsonList, oldJson, oldItemId, newItemId, moveStep) {
        //更新集合对象位置
        $.each(jsonList, function (idx, json) {
            if (json.itemId === newItemId) {
                jsonList.splice(idx + moveStep, 0, R.jsonClone(oldJson));
                return false;
            }
            if (json.array) {
                R.updateJsonListObjIndex(json.array, oldJson, oldItemId, newItemId, moveStep);
            }
        });
    },
    updateJsonListObjByItemId: function (jsonList, jsonObj, itemId) {
        //更新集合对象
        $.each(jsonList, function (idx, json) {
            if (json.itemId === itemId) {
                jsonList.splice(idx, 1, R.jsonClone(jsonObj));
                return false;
            }
            if (json.array) {
                R.updateJsonListObjByItemId(json.array, jsonObj, itemId);
            }
        });
    },
    getJsonObjFromListByItemId: function (jsonList, itemId) {
        //根据itemId获取集合数据
        var jsonObj = null;
        var array = [];
        $.each(jsonList, function (idx, json) {
            if (json.itemId === itemId) {
                jsonObj = R.jsonClone(json);
                return;
            }
            if (json.array) {
                $.each(json.array, function (cidx, cjson) {
                    array.push(cjson);
                })
            }
        });
        if (jsonObj === null && array.length > 0)
            return R.getJsonObjFromListByItemId(array, itemId);
        else
            array = null;
        return jsonObj;
    },
    getJsonObjFromListByKey: function (jsonList, key, val) {
        var jsonObj = null;
        var array = [];
        $.each(jsonList, function (idx, json) {
            if (json.key === val) {
                jsonObj = R.jsonClone(json);
                return;
            }
            if (json.array) {
                $.each(json.array, function (cidx, cjson) {
                    array.push(cjson);
                })
            }
        });
        if (jsonObj === null && array.length > 0)
            return R.getJsonObjFromListByItemId(array, itemId);
        else
            array = null;
        return jsonObj;
    },
    delJsonListObjByItemId: function (jsonList, itemId) {
        //根据itemId删除集合数据
        $.each(jsonList, function (idx, json) {
            if (json && json.itemId === itemId) {
                jsonList.splice(idx, 1);
                return false;
            }
            if (json.array) {
                R.delJsonListObjByItemId(json.array, itemId);
            }
        });
    },

    uuid: function uuid(len, radix) {
        //uuid
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
        } else {
            var r;

            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';

            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    },

    random:{random: 'U8MIA171EZ59U7VNQKSKPZYS56S03DT4TMUC', start: 12, length: 16},
    aesDecryptStr: function (str, random) {
        //解密字符
        if (!str) return null;
        if (!random&&$.cookie('user'))
            random = JSON.parse($.cookie('user')).random;
        else if(!random)
            random=R.random;
        var key = CryptoJS.enc.Utf8.parse(random.random.substr(0, random.length));
        var iv = CryptoJS.enc.Utf8.parse(random.random.substr(random.start, random.length));
        return CryptoJS.AES.decrypt(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(str)), key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);
    },
    aesDecryptObj: function (str, random) {
        //解密成对象
        if (!str) return null;
        if (!random&&$.cookie('user'))
            random = JSON.parse($.cookie('user')).random;
        else if(!random)
            random=R.random;
        var key = CryptoJS.enc.Utf8.parse(random.random.substr(0, random.length));
        var iv = CryptoJS.enc.Utf8.parse(random.random.substr(random.start, random.length));
        return JSON.parse(CryptoJS.AES.decrypt(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(str)), key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8));
    },
    aesEncryptStr: function (str, random) {
        //加密字符
        if (!str) return null;
        if (!random&&$.cookie('user'))
            random = JSON.parse($.cookie('user')).random;
        else if(!random)
            random=R.random;
        var key = CryptoJS.enc.Utf8.parse(random.random.substr(0, random.length));
        var iv = CryptoJS.enc.Utf8.parse(random.random.substr(random.start, random.length));
        return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(str), key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).ciphertext.toString().toUpperCase();
    },
    aesEncryptObj: function (obj, random) {
        //加密对象
        if (!obj) return null;
        if (!random&&$.cookie('user'))
            random = JSON.parse($.cookie('user')).random;
        else if(!random)
            random=R.random;
        var key = CryptoJS.enc.Utf8.parse(random.random.substr(0, random.length));
        var iv = CryptoJS.enc.Utf8.parse(random.random.substr(random.start, random.length));
        return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(JSON.stringify(obj)), key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).ciphertext.toString().toUpperCase();
    },

    setJsonViewData: function (data) {
        localStorage.setItem('jsonViewData', JSON.stringify(data));
    },
    pushJsonViewData: function (data) {
        var jsonViewData = JSON.parse(localStorage.getItem('jsonViewData'));
        if (!$.isArray(jsonViewData)) jsonViewData = [];
        jsonViewData.push(data);
        localStorage.setItem('jsonViewData', JSON.stringify(jsonViewData));
    },

    alertOk: function (title, msg, callback) {
        layer.alert(msg, {title: title, icon: 1, shift: 5}, callback);
    },
    alertWarn: function (title, msg, callback) {
        layer.alert(msg, {title: title, icon: 5, shift: 6}, callback);
    },
    msgOk: function (msg, endCallback) {
        layer.msg(msg, {icon: 1, shift: 5, time: 1 * 1000, end: endCallback});
    },
    parentMsgOk: function (msg, endCallback) {
        parent.layer.msg(msg, {icon: 1, shift: 5, time: 1 * 1000, end: endCallback});
    },
    msgError: function (msg, endCallback) {
        layer.msg(msg, {icon: 2, shift: 6, time: 1 * 1000, end: endCallback});
    },
    parentMsgError: function (msg, endCallback) {
        parent.layer.msg(msg, {icon: 2, shift: 6, time: 1 * 1000, end: endCallback});
    },
    msgWarn: function (msg, endCallback) {
        layer.msg(msg, {icon: 5, shift: 6, time: 2 * 1000, end: endCallback});
    },
    confirm: function (title, msg, callback) {
        layer.confirm(msg, {title: title, icon: 3}, callback);
    },
    goError: function (msg, errPage) {
        if (errPage === '/login') {
            return R.parentMsgError(msg ? msg : '请重新登陆...', function () {
                top.location.href = errPage;
            });
        }
        return R.msgError(msg ? msg : '非法请求...', function () {
            location.href = errPage ? errPage : 'error.html';
        });

    },
    goMsgWarn: function (msg, endCallback) {
        return R.msgWarn(msg ? msg : '服务器错误...', endCallback);
    },
    goMsgOk: function (msg, endCallback) {
        return R.msgOk(msg ? msg : '操作成功...', endCallback);
    },
    goParentMsgOk: function (msg, endCallback) {
        return R.parentMsgOk(msg ? msg : '操作成功...', endCallback);
    },
    postLoad: function () {
        layer.load();
    },
    closeLoading: function () {
        layer.closeAll('loading');
    },

    getFormConfig: function (formId, callBack) {
        //获取表单配置数据
        if (localStorage.getItem(formId)) {
            if (callBack) callBack(R.aesDecryptObj(localStorage.getItem(formId)));
        } else {
            // $.ajaxSettings.async = false;
            // $.post('/getFormConfig', {formId: formId}, function (res) {
            //
            //     if (res.code === -1) R.goError(res.msg, res.errPage);
            //     if (res.code === 1) return R.goMsgWarn(res.msg);
            //     if (!res.data || res.data === '') return;
            //     localStorage.setItem(formId, res.data);
            //     if (callback) callback(R.aesDecryptObj(res.data));
            // }, 'json');
            // $.ajaxSettings.async = true;
            R.ajaxPostJson('/getFormConfig', {formId: formId}, function (res) {

                if (res.code === -1) R.goError(res.msg, res.errPage);
                if (res.code === 1) return R.goMsgWarn(res.msg);
                if (!res.data || res.data === '') return;
                localStorage.setItem(formId, res.data);
                if (callBack) callBack(R.aesDecryptObj(res.data));
            });
        }
    },
    getFormManageData: function (formId, callBack) {
        if(!formId){
            callBack({
                formWidth: 800,
                formHeight: 600,
                openFull: 0
            });
            return;
        }
        R.getFormConfig(formId, function (callbackFormConfigData) {
            if (!callbackFormConfigData.manageData) {
                callbackFormConfigData.manageData = {
                    formWidth: 800,
                    formHeight: 600,
                    openFull: 0
                };
            }
            callBack(callbackFormConfigData.manageData);
        });
    },
    loadFormByKey: function (formKey, random, callback) {
        var rd = {random: random, start: Math.round(Math.random() * 16), length: 16};
        $.post('/loadForm', {formKey: formKey, random: JSON.stringify(rd)}, function (res) {

            if (res.code === -1) R.goError(res.msg, res.errPage);
            if (res.code === 1) return R.goMsgWarn(res.msg);
            if (!res.data || res.data === '') return;
            callback(R.aesDecryptObj(res.data, rd));

        }, 'json');
    },
    loadFormById: function (formId, random, callback) {
        var rd = {random: random, start: Math.round(Math.random() * 16), length: 16};
        $.post('/loadForm', {formId: formId, random: JSON.stringify(rd)}, function (res) {

            if (res.code === -1) R.goError(res.msg, res.errPage);
            if (res.code === 1) return R.goMsgWarn(res.msg);
            if (!res.data || res.data === '') return;
            callback(R.aesDecryptObj(res.data, rd));

        }, 'json');
    },
    getFormData: function (filter) {
        var elem = '[lay-filter="' + filter + '"] ';
        var fields = {};
        $(elem + 'input:checked').each(function () {
            if (eval('fields.' + $(this).attr('name'))) {
                fields[$(this).attr('name')] += ',' + $(this).val();
            } else {
                fields[$(this).attr('name')] = $(this).val();
            }
        });
        $(elem + 'input:password').each(function () {
            fields[$(this).attr('name')] = CryptoJS.MD5($(this).val()).toString();
        });
        $(elem + '[lay-skin="switch"]').each(function () {
            if ($(this).prop('checked')) fields[$(this).attr('name')] = 1;
            if (!$(this).prop('checked')) fields[$(this).attr('name')] = 0;
        });

        return fields;
    },
    loadFormData: function (formData, filter) {
        var elem = '[lay-filter="' + filter + '"]';
        $(elem)[0].reset();
        if (!R.hasObject(formData)) return;
        elem = '[lay-filter="' + filter + '"] ';
        $(elem + '[lay-skin="switch"]').prop('checked', false);

        form.val(filter, formData);

        $(elem + '[lay-skin="switch"]').each(function () {
            if (formData[$(this).attr('name')] != 1) $(this).prop('checked', false);
        });

        $(elem + 'input:password').each(function () {
            $(this).val('');
        });
        $(elem + '[retype="imgCode"]').each(function () {
            $(this).val('');
        });
        $(elem + '[retype="phoneCode"]').each(function () {
            $(this).val('');
        });

        $(elem + '[retype="checkbox"]').each(function () {
            $(this).prop('checked', false);
            if (formData[$(this).attr('name')].split(',').indexOf($(this).val()) > -1) {
                $(this).prop('checked', true);
            }
        });

        $(elem + '[retype="selects"]').each(function () {
            if (formData[$(this).attr('xm-select')]) {
                formSelects.value($(this).attr('xm-select'), formData[$(this).attr('xm-select')].split(','));
            }
        });

        $(elem + '[retype="json"]').each(function () {
            var obj = $(this);
            if (formData[obj.attr('name')]) {
                var name = [R.uuid(8, 8)];
                name[0] = new JSONEditor(obj.parent()[0], {
                    mode: 'code'
                }, formData[obj.attr('name')]);
                obj.remove();
            }
        });
    },

    getElementTypeSettingData: function (callBack) {
        if (!localStorage.getItem('elementTypeSettingData')) {
            R.ajaxPostJson('/getData', {key: 'ElementTypeSetting',random: JSON.stringify(R.random)}, function (res) {

                if (res.code === -1) R.goError(res.msg, res.errPage);
                if (res.code === 1) return R.goMsgWarn(res.msg);
                if (!res.data || res.data === '') return;

                localStorage.setItem('elementTypeSettingData', res.data);
                callBack(R.aesDecryptObj(res.data));
            });
            // $.ajaxSettings.async = false;
            // $.post('/getData', {key: 'ElementTypeSetting'}, function (res) {
            //
            //     if (res.code === -1) R.goError(res.msg, res.errPage);
            //     if (res.code === 1) return R.goMsgWarn(res.msg);
            //     if (!res.data || res.data === '') return;
            //
            //     localStorage.setItem('elementTypeSettingData', res.data);
            //     return rs = R.aesDecryptObj(res.data);
            // }, 'json');
            // $.ajaxSettings.async = true;
        } else {
            callBack(R.aesDecryptObj(localStorage.getItem('elementTypeSettingData')));
        }
    },
    getElementTypeTemplateData: function (callBack) {
        if (!localStorage.getItem('elementTypeTemplateData')) {
            R.ajaxPostJson('/getData', {key: 'ElementTypeTemplate',random: JSON.stringify(R.random)}, function (res) {

                if (res.code === -1) R.goError(res.msg, res.errPage);
                if (res.code === 1) return R.goMsgWarn(res.msg);
                if (!res.data || res.data === '') return;

                localStorage.setItem('elementTypeTemplateData', res.data);
                callBack(R.aesDecryptObj(res.data));
            });
            // $.ajaxSettings.async = false;
            // $.post('/getData', {key: 'ElementTypeTemplate'}, function (res) {
            //
            //     if (res.code === -1) R.goError(res.msg, res.errPage);
            //     if (res.code === 1) return R.goMsgWarn(res.msg);
            //     if (!res.data || res.data === '') return;
            //
            //     localStorage.setItem('elementTypeTemplateData', res.data);
            //     return rs = R.aesDecryptObj(res.data);
            // }, 'json');
            // $.ajaxSettings.async = true;
        } else {
            callBack(R.aesDecryptObj(localStorage.getItem('elementTypeTemplateData')));
        }
    },

    elementTypeSetting: ['string', 'textArea', 'decimal', 'int', 'phoneNumber', 'telephoneNumber', 'email', 'dateTime', 'radio', 'checkbox', 'select', 'selects', 'imgCode', 'phoneCode', 'password', 'hidden', 'switch', 'url', 'chinese', 'json', 'uuid', 'sysUser', 'sysTime', 'handleCell'],
    elementTypeSettingName: ['单行输入', '多行输入', '数字', '整数', '手机号码', '固定电话', '电子邮箱', '日期', '单项选择', '多项选择', '下拉列表', '下拉多选', '图形验证码', '手机验证码', '密码', '隐藏值', '开关', '网址', '中文', '对象', 'ID', '系统用户', '系统时间', '操作列'],
    elementTypeSettingTemplate: ['textRow', 'textArea', 'textCell', 'textCell', 'textCell', 'textCell', 'textCell', 'dateTime', 'radio', 'checkbox', 'select', 'selects', 'imgCode', 'phoneCode', 'password', 'hidden', 'switch', 'textRow', 'textRow', 'json', 'uuid', 'sysUser', 'sysTime', 'handleCell'],
    cellsSetting: ['cellTitle', 'cellShow', 'cellDefaultShow', 'cellSort', 'cellAlign', 'cellWidth', 'cellAutoWidth', 'cellAllowSort', 'cellFixed', 'cellDefaulSort', 'cellTemplet', 'cellSearch', 'searchType', 'searchPlaceholder', 'searchLabel', 'searchWidth'],
    sysFields: {
        _id: {
            elementType: 'uuid', fieldName: 'ID', itemName: '_id',
            cellTitle: 'ID', cellShow: 0, cellSort: 20, cellAutoWidth: 1
        },
        CreateTime: {
            elementType: 'sysTime', fieldName: '添加时间', itemName: 'CreateTime',
            cellTitle: '添加时间', cellShow: 1, cellSort: 21, cellAlign: 'center', cellAllowSort: 1, cellAutoWidth: 1,
            cellTemplet: 'YMDHM'
        },
        CreateUser: {
            elementType: 'sysUser', fieldName: '创建者', itemName: 'CreateUser',
            cellTitle: '创建者', cellShow: 1, cellSort: 22, cellAlign: 'center', cellAllowSort: 1, cellAutoWidth: 1
        },
        ModifyTime: {
            elementType: 'sysTime', fieldName: '修改时间', itemName: 'ModifyTime',
            cellTitle: '修改时间', cellShow: 1, cellDefaultShow: 1, cellSort: 23, cellAlign: 'center',
            cellAllowSort: 1, cellAutoWidth: 1, cellTemplet: 'YMDHM'
        },
        ModifyUser: {
            elementType: 'sysUser', fieldName: '修改者', itemName: 'ModifyUser',
            cellTitle: '修改者', cellShow: 1, cellDefaultShow: 1, cellSort: 24, cellAlign: 'center',
            cellAllowSort: 1, cellAutoWidth: 1
        },
        _HandleCell: {
            elementType: 'handleCell', fieldName: '操作', itemName: '_HandleCell',
            cellTitle: '操作', cellShow: 1, cellSort: 25, cellAlign: 'center',
            cellWidth: 160, cellAutoWidth: 0, cellFixed: 'right'
        }
    },
    layoutChange: function (jsonObj, layout, merge) {
        var elementType = jsonObj.itemData.elementType;
        R.getElementTypeSettingData(function (callbackElementTypeSettingData) {
            var defaultlayout = callbackElementTypeSettingData[elementType].layout;

            if (defaultlayout !== '') {
                jsonObj.itemData.layout = layout;
                if (layout === 'row' && merge === 1 && defaultlayout === 'cell') {
                    jsonObj.itemData.layout = 'cell';
                }

                var row = jsonObj.child.length;
                if (layout === 'row' && (merge === 1 && defaultlayout === 'row' || merge === 0) && row === 3 && jsonObj.itemData.tipShow !== undefined) {
                    jsonObj.child[1].child.push(R.jsonClone(jsonObj.child[2]));
                    jsonObj.child.splice(2, 1);
                }
                if (layout === 'cell' && row === 2 && jsonObj.itemData.tipShow !== undefined) {
                    jsonObj.child.push(R.jsonClone(jsonObj.child[1].child[1]));
                    jsonObj.child[1].child.splice(1, 1);
                }
            }

            if (merge === 2) {
                jsonObj.itemData.layout = '';
                jsonObj.class = 'layui-inline';
            } else {
                jsonObj.class = 'layui-form-item';
            }

            if (elementType === 'radio' || elementType === 'checkbox' || layout === 'row' && (merge === 1 && defaultlayout === 'row' || merge === 0) && defaultlayout !== '') {
                jsonObj.child[1].class = 'layui-input-block';
            } else {
                jsonObj.child[1].class = 'layui-input-inline';
            }
        });
    },
    updateFormConfig: function (jsonList, elementTypeSettingData, elementTypeTemplateData, marge, type) {
        //更新表单数据
        for (var i = 0; i < jsonList.length; i++) {
            var json = jsonList[i];
            if (!R.hasObject(json)) return;
            if (json.array) {
                R.updateFormConfig(json.array, elementTypeSettingData, elementTypeTemplateData, true, type);
            }
            if (json.itemData) {
                var defaultTemplate = elementTypeTemplateData[R.elementTypeSettingTemplate[$.inArray(json.itemData.elementType, R.elementTypeSetting)]];

                if (type === 2 && json.itemData.elementType === 'hidden') defaultTemplate = elementTypeTemplateData[R.elementTypeSettingTemplate[$.inArray(json.itemData.dataType, R.elementTypeSetting)]];

                if (!defaultTemplate) {
                    jsonList.splice(i, 1);
                    i--;
                    continue;
                }
                var newTemplate = R.jsonClone(defaultTemplate);
                newTemplate.itemId = json.itemId;
                if (json.relevanceId) newTemplate.relevanceId = json.relevanceId;
                newTemplate.itemData = R.jsonClone(json.itemData);

                if (marge) R.layoutChange(newTemplate, 'cell', 2);
                else if (type !== 2) R.layoutChange(newTemplate, newTemplate.itemData.layout, 0)

                jsonList.splice(i, 1, newTemplate);

                var objKeys = Object.keys(json.itemData);
                var defaultSetting = elementTypeSettingData[json.itemData.elementType];
                if (!defaultSetting) {
                    jsonList.splice(i, 1);
                    i--;
                    continue;
                }

                var defaultSettingKeys = Object.keys(defaultSetting);
                $.each(objKeys, function (k, v) {
                    if ($.inArray(v, defaultSettingKeys) === -1) delete json.itemData[v];
                });

                var newData = $.extend({}, elementTypeSettingData[json.itemData.elementType], json.itemData);
                json.itemData = newData;
            }
        }
    },
    getFormFields: function (jsonList, oldFields) {
        var list = [];
        $.each(jsonList, function (idx, json) {
            if (json.array) {
                $.merge(list, R.getFormFields(json.array, oldFields));
            }
            if (json.itemData) {
                var item = R.jsonClone(json.itemData);
                $.each(oldFields, function (idx, obj) {
                    if (item.itemName === obj.itemName) {
                        item = $.extend({}, obj, item);
                        return;
                    }
                });
                list.push(item);
            }
        });
        return list;
    },
    buildFormFields: function (formFields) {
        var hasCreateTime = false, hasModifyTime = false, hasId = false, hasHandleCell = false, hasModifyUser = false,
            hasCreateUser = false;
        $.each(formFields, function (idx, json) {
            if (!json.cellShow && json.cellShow !== 0 && $.inArray(json.elementType, ['hidden', 'password']) === -1) {
                json.cellShow = 1;
            }

            if (!json.cellDefaultShow && json.cellDefaultShow !== 0 && $.inArray(json.elementType, ['textArea', 'imgCode', 'phoneCode']) > -1) {
                json.cellDefaultShow = 1;
            }

            if (!json.cellTitle) {
                json.cellTitle = json.fieldName;
            }

            if (!json.cellSort) {
                json.cellSort = idx + 1;
            }

            if (!json.cellAlign) {
                if ($.inArray(json.elementType, ['phoneNumber', 'telephoneNumber', 'dateTime', 'radio', 'switch']) > -1 || $.inArray(json.dataType, ['sysTime', 'json']) > -1) json.cellAlign = 'center';
                else if ($.inArray(json.elementType, ['decimal', 'int']) > -1 || $.inArray(json.dataType, ['decimal', 'int']) > -1) json.cellAlign = 'right';
                else json.cellAlign = 'left';
            }

            if (!json.cellAutoWidth && json.cellAutoWidth !== 0) json.cellAutoWidth = 1;

            if (!json.cellAllowSort && json.cellAllowSort !== 0 && ($.inArray(json.elementType, ['decimal', 'int', 'dateTime', 'radio', 'switch', 'phoneNumber', 'email', 'sysUser', 'sysTime']) > -1 || $.inArray(json.dataType, ['decimal', 'int', 'sysTime']) > -1)) json.cellAllowSort = 1;

            if (!json.cellTemplet && (json.elementType === 'sysTime' || json.dataType === 'sysTime'))
                json.cellTemplet = 'YMDHMS';

            if (json.itemName === '_id') hasId = true;
            if (json.itemName === 'CreateTime') hasCreateTime = true;
            if (json.itemName === 'ModifyTime') hasModifyTime = true;
            if (json.itemName === 'CreateUser') hasCreateUser = true;
            if (json.itemName === 'ModifyUser') hasModifyUser = true;
            if (json.itemName === '_HandleCell') hasHandleCell = true;
        });

        if (!hasId) formFields.push(R.jsonClone(R.sysFields._id));
        if (!hasCreateTime) formFields.push(R.jsonClone(R.sysFields.CreateTime));
        if (!hasCreateUser) formFields.push(R.jsonClone(R.sysFields.CreateUser));
        if (!hasModifyTime) formFields.push(R.jsonClone(R.sysFields.ModifyTime));
        if (!hasModifyUser) formFields.push(R.jsonClone(R.sysFields.ModifyUser));
        if (!hasHandleCell) formFields.push(R.jsonClone(R.sysFields._HandleCell));

        formFields.sort(function (x, y) {
            return x.cellSort - y.cellSort
        });

        return formFields;
    },
    updateFormFields: function (formFields) {
        R.getElementTypeSettingData(function (callbackData) {
            var elementTypeSettingData = callbackData;

            for (var i = 0; i < formFields.length; i++) {
                var json = formFields[i];
                var objKeys = Object.keys(json);

                var defaultSetting = null;

                if ($.inArray(json.itemName, ['_id', 'CreateTime', 'ModifyTime', 'CreateUser', 'ModifyUser', '_HandleCell']) > -1) defaultSetting = R.sysFields[json.itemName];
                else defaultSetting = elementTypeSettingData[json.elementType];

                if (!defaultSetting) {
                    formFields.splice(i, 1);
                    i = i - 1;
                    continue;
                }
                var defaultSettingKeys = $.merge(Object.keys(defaultSetting), R.cellsSetting);
                $.each(objKeys, function (k, v) {
                    if ($.inArray(v, defaultSettingKeys) === -1) delete json[v];
                });
            }
        });
    },
    restFormFields: function (formFields) {
        R.getElementTypeSettingData(function (callbackData) {
            var elementTypeSettingData = callbackData;

            for (var i = 0; i < formFields.length; i++) {
                var json = formFields[i];
                var objKeys = Object.keys(json);

                var defaultSetting = null;

                if ($.inArray(json.itemName, ['_id', 'CreateTime', 'ModifyTime', 'CreateUser', 'ModifyUser', '_HandleCell']) === -1) defaultSetting = elementTypeSettingData[json.elementType];

                if (!defaultSetting) {
                    formFields.splice(i, 1);
                    i = i - 1;
                    continue;
                }

                var defaultSettingKeys = Object.keys(defaultSetting);
                $.each(objKeys, function (k, v) {
                    if ($.inArray(v, defaultSettingKeys) === -1) delete json[v];
                });
            }
            R.buildFormFields(formFields);
        });
    },
    getTableCols: function (cols, formFields) {
        $.each(formFields, function (idx, json) {
            if (json.cellShow) {
                var col = {};
                if (json.elementType === 'handleCell') col.toolbar = '#handleCell';
                else col.field = json.itemName;

                col.title = json.cellTitle;

                if (json.cellDefaultShow) col.hide = true;

                if (json.cellAlign) col.align = json.cellAlign;

                if (json.cellWidth) {
                    if (json.cellAutoWidth) col.minWidth = parseInt(json.cellWidth);
                    else col.width = parseInt(json.cellWidth);
                }

                if (json.cellAllowSort) col.sort = true;

                if (json.cellFixed) col.fixed = json.cellFixed;

                if (json.cellTemplet)
                    col.templet = function (d) {
                        return R.cellTemplet(json.cellTemplet, d[this.field]);
                    };

                if (json.elementType === 'switch')
                    col.templet = function (d) {
                        var arry = json.switchText.split('|');
                        var v = (d[this.field] === '1' ? 0 : 1);
                        return arry[v];
                    };

                cols.push(col);
            }
        });
        return cols;
    },
    bindTableSearch: function (formFields) {
        var searchData = jslinq(formFields).where(function (p) {
            return p.cellSearch && p.cellShow === 1
        }).toList();
        var html = '';
        $('.re-search-form .layui-form-item').children().remove();
        $.each(searchData, function (idx, json) {
            html += '<div class="layui-line">';
            if (json.searchLabel) html += '<label class="layui-form-label">' + json.searchPlaceholder + '</label>';
            html += '<div class="layui-input-inline" style="width:' + (json.searchWidth ? json.searchWidth : 160) + 'px">';
            if ($.inArray(json.elementType, ['radio', 'checkbox', 'switch', 'select', 'selects']) > -1) {
                html += '<select name="' + json.itemName + '" lay-search="">' +
                    '<option value="">' + json.searchPlaceholder + '</option>';

                if (json.elementType === 'switch') {
                    var strArr = R.trimAll(json.switchText).split('|');
                    html += '<option value="' + 1 + '">' + strArr[0] + '</option>';
                    html += '<option value="' + 0 + '">' + strArr[1] + '</option>';
                } else {
                    var strArr = R.trimAll(json.options).split(',');

                    $.each(strArr, function (k, v) {
                        html += '<option value="' + v + '">' + v + '</option>';
                    });
                }

                html += '</select></div></div>';
            } else if (json.elementType === 'dateTime' || json.elementType === 'sysTime' || json.dataType === 'sysTime') {
                var dateType = 'date';
                if (json.dateType) dateType = json.dateType;
                else if (json.elementType === 'sysTime' || json.dataType === 'sysTime') dateType = 'datetime';

                var dateFormat = 'yyyy-MM-dd';
                if (json.dateFormat) dateFormat = json.dateFormat;
                else if (json.elementType === 'sysTime' || json.dataType === 'sysTime') dateFormat = 'yyyy-MM-dd HH:mm:ss';

                if (json.searchType === 'between') {
                    html += '<input type="text" name="' + json.itemName + '_0" placeholder="' + json.searchPlaceholder + '" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '<div class="layui-form-mid">-</div>' +
                        '<div class="layui-input-inline" style="width:' + (json.searchWidth ? json.searchWidth : 160) + 'px">' +
                        '<input type="text" name="' + json.itemName + '_1" placeholder="' + json.searchPlaceholder + '" autocomplete="off" class="layui-input">' +
                        '</div></div>';
                    laydate.render({
                        elem: '.re-search-form [name="' + json.itemName + '_0"]',
                        trigger: 'click',
                        type: dateType,
                        format: dateFormat
                    });
                    laydate.render({
                        elem: '.re-search-form [name="' + json.itemName + '_1"]',
                        trigger: 'click',
                        type: dateType,
                        format: dateFormat
                    });
                }
                else {
                    html += '<input type="text" name="' + json.itemName + '" placeholder="' + json.searchPlaceholder + '" autocomplete="off" class="layui-input">' +
                        '</div></div>';

                    laydate.render({
                        elem: '.re-search-form [name="' + json.itemName + '"]',
                        trigger: 'click',
                        type: dateType,
                        format: dateFormat
                    });
                }
            } else {
                if (json.searchType === 'between') {
                    html += '<input type="text" name="' + json.itemName + '_0" placeholder="' + json.searchPlaceholder + '" autocomplete="off" class="layui-input">' +
                        '</div>' +
                        '<div class="layui-form-mid">-</div>' +
                        '<div class="layui-input-inline" style="width:' + (json.searchWidth ? json.searchWidth : 160) + 'px">' +
                        '<input type="text" name="' + json.itemName + '_1" placeholder="' + json.searchPlaceholder + '" autocomplete="off" class="layui-input">' +
                        '</div></div>';
                } else {
                    html += '<input type="text" name="' + json.itemName + '" placeholder="' + json.searchPlaceholder + '" autocomplete="off" class="layui-input">' +
                        '</div></div>';
                }
            }
        });
        html += '<div class="layui-line layui-hide">' +
            '<div class="layui-btn-group">' +
            '<button class="layui-btn layui-btn-sm" lay-submit="" lay-filter="searchSubmit">查询</button>' +
            '<button class="layui-btn layui-btn-sm layui-btn-primary" type="reset" lay-filter="searchReset">重置</button>' +
            '</div>' +
            '</div>';
        $('.re-search-form .layui-form-item').prepend(html);
        form.render();
    },
    getTableSort: function (formFields) {
        return jslinq(formFields).where(function (p) {
            return p.cellDefaulSort
        }).select(function (p) {
            return p.itemName
        }).firstOrDefault();
    },

    cellTemplet: function (fun, val) {
        return eval('R.cellTemplet_' + fun + '(val)');
    },

    cellTemplet_thousands: function (v) {
        if (v) return v.replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,');
    },
    cellTemplet_RMB: function (v) {
        if (v) return '￥' + v.replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,');
    },
    cellTemplet_dollar: function (v) {
        if (v) return '$' + v.replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,');
    },

    cellTemplet_link: function (v) {
        if (v) return '<a href="' + v + '" target="_blank" class="layui-table-link" >浏览</a>';
        return '';
    },
    cellTemplet_json: function (v) {
        if (R.hasObject(v)) return "<a href='javascript:;' onclick='R.openJsonView(" + JSON.stringify(v) + ")' class='layui-table-link' >查看</a>";
        return '';
    },
    openJsonView: function (data) {
        R.setJsonViewData(data);
        layer.open({
            type: 2,
            title: '数据查看',
            content: 'jsonView.html',
            area: ['100%', '100%'],
            maxmin: true
        });
    },

    cellTemplet_Y: function (v) {
        return R.getYMDHMS(v).substr(0, 4);
    },
    cellTemplet_YM: function (v) {
        return R.getYMDHMS(v).substr(0, 7);
    },
    cellTemplet_YMD: function (v) {
        return R.getYMDHMS(v).substr(0, 10);
    },
    cellTemplet_YMDH: function (v) {
        return R.getYMDHMS(v).substr(0, 13);
    },
    cellTemplet_YMDHM: function (v) {
        return R.getYMDHMS(v).substr(0, 16);
    },
    cellTemplet_YMDHMS: function (v) {
        return R.getYMDHMS(v).substr(0, 19);
    },
    getYMDHMS: function (time) {
        if (!time) return '';
        var date = new Date(time);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;

        var YMD = year + '-' + month + '-' + day;

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        var HMS = hours + ':' + minutes + ':' + seconds + '.' + date.getMilliseconds();

        return YMD + ' ' + HMS;
    }
}
