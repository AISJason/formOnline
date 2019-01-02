var formId = R.getQueryPara('formId');

//当前编辑数据
var activeEditData = null, elementTypeSettingData = null, elementTypeTemplateData = null;
//预览表单数据
var formItemsData = [];

var layer = layui.layer,
    form = layui.form,
    laydate = layui.laydate,
    formSelects = layui.formSelects;

//表单验证
form.verify(R.verify);
//开关事件
form.on('switch(switchChange)', function (data) {
    $(this).parent().next().hide();
    $(this).parent().next().find('input:text').val('');
    if (this.checked)
        $(this).parent().next().show();

    $('[lay-filter="elementEditFormSubmit"]').click();
});
//改变布局事件
form.on('radio(changeLayout)', function (data) {
    if (activeEditData.itemData.layout === data.value) return;

    R.layoutChange(activeEditData, $(this).val(), 0);

    viewAndElementViewHtmlUpdate();
    R.bindFormHtml(activeEditData, 0);
    form.render();
});
//改变隐藏值数据类型
form.on('radio(changeDataType)', function (data) {
    if (activeEditData.itemData.dataType === data.value) return;

    $('[lay-filter="elementEditFormSubmit"]').click();
});
//改变复选框风格事件
form.on('radio(changeCheckboxTheme)', function (data) {
    if (activeEditData.itemData.checkboxTheme === data.value) return;

    $('[lay-filter="elementEditFormSubmit"]').click();
});
//改变日期格式事件
form.on('select(changeDateFormat)', function (data) {
    if (activeEditData.itemData.dateFormat === data.value) return;

    switch (data.value) {
        case 'yyyy':
            $('[name="dateType"]').val('year');
            break;
        case 'yyyy-MM':
            $('[name="dateType"]').val('month');
            break;
        case 'yyyy-MM-dd':
            $('[name="dateType"]').val('date');
            break;
        case 'HH':
        case 'HH:mm':
        case 'HH:mm:ss':
            $('[name="dateType"]').val('time');
            break;
        case 'yyyy-MM-dd HH':
        case 'yyyy-MM-dd HH:mm':
        case 'yyyy-MM-dd HH:mm:ss':
            $('[name="dateType"]').val('datetime');
            break;
        default:
            $('[name="dateType"]').val('date');
            break;
    }

    $('[lay-filter="elementEditFormSubmit"]').click();
});

//提交组件编辑表单
form.on('submit(elementEditFormSubmit)', function (data) {
    if (!activeEditData) return;
    var defaultData = elementTypeSettingData[activeEditData.itemData.elementType];

    if (!data.field.placeholderShow && data.field.placeholderText)
        data.field.placeholderText = '';

    if (data.field.placeholderShow && data.field.placeholderText === '')
        data.field.placeholderText = defaultData.placeholderText;


    if (data.field.tipShow && data.field.tipText === '')
        data.field.tipText = defaultData.tipText;

    var fields = R.getFormData('elementEdit');
    $.extend(data.field, fields);

    var defaultKeys = Object.keys(defaultData);
    var objKeys = Object.keys(data.field);
    $.each(objKeys, function (k, v) {
        if ($.inArray(v, defaultKeys) === -1) delete data.field[v];
    });

    $.extend(activeEditData.itemData, data.field);

    R.bindFormHtml(activeEditData, 0);
    form.render();

    R.updateJsonListObjByItemId(formItemsData, activeEditData, activeEditData.itemId);
    return false;
});
//提交组件预览表单
form.on('submit(elementViewFormSubmit)', function (data) {
    return false;
});

//选择组件添加
elementTypeSelect = function () {
    $('[REElementTypeSetting]').click(function () {

        var REElementTypeSetting = $(this).attr('REElementTypeSetting');

        if (REElementTypeSetting === 'imgCode' && $('[lay-verify="imgCode"]').length > 0) return R.msgWarn('已存在图形验证码，请勿重复添加...');

        var REElementTypeTemplate = $(this).attr('REElementTypeTemplate');

        var relevanceId = '';
        if (REElementTypeSetting === 'phoneCode') {
            relevanceId = addElement('phoneNumber', 'textCell');
        }
        addElement(REElementTypeSetting, REElementTypeTemplate, relevanceId);
    });
};
//添加组件
addElement = function (REElementTypeSetting, REElementTypeTemplate, relevanceId) {
    var templateJson = elementTypeTemplateData[REElementTypeTemplate];
    if (!templateJson) return;

    var settingJson = elementTypeSettingData[REElementTypeSetting];
    if (!settingJson) return;

    activeEditData = R.jsonClone(templateJson);

    $.extend(activeEditData.itemData, activeEditData.itemData, settingJson);

    if (relevanceId) activeEditData.relevanceId = relevanceId;

    viewAndElementViewHtmlUpdate();

    R.bindFormHtml(activeEditData, 0);
    formItemsDataUpdate(activeEditData.itemId);
    form.render();

    elementEditHtmlReset();
    return activeEditData.itemId;
};
//更新预览表单和组件预览表单
viewAndElementViewHtmlUpdate = function () {
    var html = R.getFormHtml(activeEditData);

    if ($('.re-element-view-form >div').length > 1)
        $('.re-element-view-form >div:first').remove();

    $('.re-element-view-form').prepend(html);

    //预览表单当前选中项
    var activeObj = $('.re-view-form .re-drag-active-edit');
    if (activeObj.parent().hasClass('re-drag-merge')) {
        activeObj = activeObj.parent();
    }
    //更新添加预览表单项
    var editObj = $('.re-view-form [reitemid="' + activeEditData.itemId + '"]');
    if (editObj.html()) {
        editObj.before(html);
        editObj.remove();
    }
    else if (activeObj.html())
        activeObj.after(html);
    else
        $('.re-view-form').append(html);

    elementViewDragClassClear();
    activeEditClass();

    formItemsDataUpdate(activeObj.attr('reitemid'));
};
//选择组件添加更新数据
formItemsDataUpdate = function (newItemId) {
    if (formItemsData.length === 0 || !newItemId)
        formItemsData.push(R.jsonClone(activeEditData));
    else if (activeEditData.itemId !== newItemId)
        R.updateJsonListObjIndex(formItemsData, activeEditData, activeEditData.itemId, newItemId, 1);
    else
        R.updateJsonListObjByItemId(formItemsData, activeEditData, activeEditData.itemId);
};
//更新组件预览和组件编辑
elementViewAndEditHtmlUpdate = function (html, itemId) {
    if (activeEditData !== null && itemId === activeEditData.itemId) return;

    if ($('.re-element-view-form >div').length > 1)
        $('.re-element-view-form >div:first').remove();

    if (html !== '') {
        $('.re-element-view-form').prepend(html);

        activeEditData = R.getJsonObjFromListByItemId(formItemsData, itemId);

        R.bindFormHtml(activeEditData, 0);
        form.render();

        elementViewDragClassClear();
        activeEditClass();

        elementEditHtmlReset();
    }
};

//初始化组件编辑表单
elementEditHtmlUpdate = function () {
    $('.re-element-edit-form >div').hide();

    $('.re-element-edit-form').on('input propertychange', '[lay-filter="changeValue"]', function () {
        if ($(this).attr('name') === 'itemName' && $.trim($(this).val()) !== '' && $('[name="' + $.trim($(this).val()) + '"]').length > 0 && !$('[name="' + $.trim($(this).val()) + '"]').closest('[reitemid]').hasClass('re-drag-active-edit')) return R.msgWarn('字段ID已重复，请更改...');
        if ($(this).attr('name') === 'fieldName' && $('[name="placeholderText"]').is(':visible')) {
            $('[name="placeholderText"]').val('请输入' + $(this).val());
        }
        $('[lay-filter="elementEditFormSubmit"]').click();
    });

    $('.re-element-edit-form').on('input propertychange', '[lay-filter="changeOptions"]', function () {
        optionsCheckedUpdate($(this).val());
        $('[lay-filter="elementEditFormSubmit"]').click();
    });
};
//重置组件编辑表单
elementEditHtmlReset = function () {

    R.loadFormData(activeEditData.itemData, 'elementEdit');

    $('.re-element-edit-form >div').hide();
    $.each(activeEditData.itemData, function (k, v) {
        if (!(k === 'layout' && v === '' || k === 'dataType' && activeEditData.itemData.elementType !== 'hidden'))
            $('.re-element-edit-form [REElementTypeEdit="' + k + '"]').show();
    });

    optionsCheckedUpdate(activeEditData.itemData.options);

    //初始化组件编辑开关事件
    $('.re-element-edit-form [lay-filter="switchChange"]').each(function () {
        $(this).parent().next().hide();
        if (this.checked)
            $(this).parent().next().show();
    });
};

//初始化当前编辑项样式
activeEditClass = function () {
    if (activeEditData !== null) {
        $('.re-drag-active-edit').removeClass('re-drag-active-edit');
        $('[reitemid="' + activeEditData.itemId + '"]').addClass('re-drag-active-edit');
        $('.re-element-list').find('.active').removeClass('active');
        $('[REElementTypeSetting="' + activeEditData.itemData.elementType + '"]').children().addClass('active');
    }
};
//初始组件预览表单样式
elementViewDragClassClear = function () {
    $('.re-element-view-form >div:first').removeClass('re-drag-area');
    $('.re-element-view-form >div:first').find('.edit-area').removeClass('edit-area');
    $('.re-element-view-form >div:first').find('.drag-area').removeClass('drag-area');

    if ($('.re-element-view-form >div:first').hasClass('layui-inline')) {
        $('.re-element-view-form >div:first').removeClass('layui-inline');
        $('.re-element-view-form >div:first').addClass('layui-form-item');
    }
};
//初始化默认选项
optionsCheckedUpdate = function (optionsStr) {
    if (activeEditData.itemData.optionsChecked !== undefined) {
        var strArr = R.trimAll(optionsStr).split(',');
        var tempAry = [];
        var dataAry = [];

        $.each(strArr, function (k, v) {
            if (v !== '' && $.inArray(v, tempAry) === -1) {
                dataAry.push({name: v, value: v});
                tempAry.push(v);
            }
        });

        formSelects.render('optionsChecked', {radio: activeEditData.itemData.elementType === 'radio' ? true : false});
        formSelects.data('optionsChecked', 'local', {
            arr: dataAry
        });
        formSelects.value('optionsChecked', activeEditData.itemData.optionsChecked.split(','));

        formSelects.on('optionsChecked', function (id, vals, val, isAdd, isDisabled) {
            $('[lay-filter="elementEditFormSubmit"]').click();
        }, true);
    }
};

//初始化行拖拽
dragRow = function () {
    $('.re-view-form').dad({
        targetClass: '.layui-form-item',
        childrenClass: 'layui-form-item',
        dragArea: '.drag-area',
        editArea: '.edit-area',
        activeItemCallback: elementViewAndEditHtmlUpdate,
        moveItemCallback: activeEditMove
    }).addDropzone('.re-drag-dropzone', function (e) {
        e.remove();
        var itemId = activeEditData.itemId;
        activeEditRemove(itemId);
        if ($('[relevanceid="' + itemId + '"]').length > 0) {
            activeEditRemove($('[relevanceId="' + itemId + '"]').attr('reitemid'));
        }
    });
};
//初始化列拖拽
dragCell = function () {
    $('.re-view-form .re-drag-merge').each(function () {
        if (!$(this).hasClass('re-drag-active')) {
            $(this).dad({
                targetClass: '.layui-inline',
                childrenClass: 'layui-inline',
                dragArea: '.drag-area',
                editArea: '.edit-area',
                activeItemCallback: elementViewAndEditHtmlUpdate,
                moveItemCallback: activeEditMove
            }).addDropzone('.re-drag-dropzone', function (e) {
                e.remove();
                var itemId = activeEditData.itemId;
                activeEditRemove(itemId);
                if ($('[relevanceid="' + itemId + '"]').length > 0) {
                    activeEditRemove($('[relevanceId="' + itemId + '"]').attr('reitemid'));
                }
            });
        }
    });
};
//拖拽更新数据位置
activeEditMove = function (moveObj) {
    R.delJsonListObjByItemId(formItemsData, activeEditData.itemId);
    R.updateJsonListObjIndex(formItemsData, activeEditData, activeEditData.itemId, moveObj.newItemId, moveObj.moveStep);
};
//拖拽删除
activeEditRemove = function (itemid) {
    var activeItem = itemid;
    if ($('.re-view-form [reitemid="' + activeItem + '"]').parent().hasClass('re-drag-merge') && $('.re-view-form [reitemid="' + activeItem + '"]').siblings().length === 1) {
        activeItem = $('.re-view-form [reitemid="' + activeItem + '"]').parent().attr('reitemid');
    }

    $('.re-view-form [reitemid="' + activeItem + '"]').remove();

    $('.re-element-list').find('.active').removeClass('active');

    if ($('.re-element-view-form >div').length > 1)
        $('.re-element-view-form >div:first').remove();

    $('.re-element-edit-form >div').hide();

    activeEditData = null;
    R.delJsonListObjByItemId(formItemsData, activeItem);
};

//合并行
layoutMerge = function () {
    var activeObj = $('.re-view-form .re-drag-active-edit');
    if (!activeObj.html()) return R.msgWarn('请先选中行。');
    var nextObj, prevObj, mergeData;
    var hasNext;

    if (activeObj.parent().hasClass('re-drag-merge'))
        activeObj = activeObj.parent();

    var mergeJson = {};

    nextObj = activeObj.next();
    if (nextObj.parent().hasClass('re-drag-merge'))
        nextObj = nextObj.parent();
    hasNext = nextObj.hasClass('layui-form-item');
    if (hasNext) {
        mergeData = nextObj;
        mergeJson = R.getJsonObjFromListByItemId(formItemsData, nextObj.attr('reitemid'));
    }
    else {
        prevObj = activeObj.prev();
        if (prevObj.parent().hasClass('re-drag-merge'))
            prevObj = prevObj.parent();
        if (prevObj.hasClass('layui-form-item')) {
            mergeData = prevObj;
            mergeJson = R.getJsonObjFromListByItemId(formItemsData, prevObj.attr('reitemid'));
        }
        else return R.msgWarn('没有可合并的行');
    }

    var activeJson = R.getJsonObjFromListByItemId(formItemsData, activeObj.attr('reitemid'));

    var newJson = {
        tag: 'div', class: 'layui-form-item re-drag-merge', itemId: '', array: []
    };

    var isPush = false;

    if (activeJson.array) {
        newJson = activeJson;
        if (hasNext) {
            if (mergeJson.array) {
                $.each(mergeJson.array, function (idx, json) {
                    newJson.array.push(json);
                })
            }
            else
                newJson.array.push(mergeJson);
        } else {
            if (mergeJson.array) {
                $.each(mergeJson.array, function (idx, json) {
                    newJson.array.splice(idx, 0, json);
                })
            }
            else
                newJson.array.splice(0, 0, mergeJson);
        }
        R.delJsonListObjByItemId(formItemsData, mergeJson.itemId);
    }
    else if (mergeJson.array) {
        newJson = mergeJson;
        if (hasNext)
            newJson.array.splice(0, 0, activeJson);
        else
            newJson.array.push(activeJson);

        R.delJsonListObjByItemId(formItemsData, activeJson.itemId);
    }
    else {
        if (hasNext)
            newJson.array.push(activeJson, mergeJson);
        else
            newJson.array.push(mergeJson, activeJson);

        R.delJsonListObjByItemId(formItemsData, mergeJson.itemId);

        isPush = true;
    }

    $.each(newJson.array, function (idx, json) {
        R.layoutChange(json, 'cell', 2);
    });

    var html = R.getFormHtml(newJson);

    activeObj.after(html);
    activeObj.remove();
    mergeData.remove();
    activeEditClass();

    $.each(newJson.array, function (idx, json) {
        R.bindFormHtml(json, 0);
    });
    form.render();

    dragCell();

    if (isPush)
        R.updateJsonListObjByItemId(formItemsData, newJson, activeJson.itemId);
    else
        R.updateJsonListObjByItemId(formItemsData, newJson, newJson.itemId);

    activeEditData = R.getJsonObjFromListByItemId(formItemsData, activeEditData.itemId);

    elementEditHtmlReset();
};
//拆分行
layoutSplit = function () {
    var activeObj = $('.re-view-form .re-drag-active-edit');
    if (!activeObj.html()) return R.msgWarn('请先选中待拆分的行。');

    if (activeObj.parent().hasClass('re-drag-merge'))
        activeObj = activeObj.parent();
    else return R.msgWarn('没有可拆分的合并。');

    var activeJson = R.getJsonObjFromListByItemId(formItemsData, activeObj.attr('reitemid'));

    $.each(activeJson.array, function (idx, json) {
        R.layoutChange(json, 'row', 1);
        var html = R.getFormHtml(json);
        activeObj.before(html);
        R.bindFormHtml(json, 0);
        R.updateJsonListObjIndex(formItemsData, json, json.itemId, activeJson.itemId, 0);
    });
    form.render();
    activeObj.remove();
    activeEditClass();

    R.delJsonListObjByItemId(formItemsData, activeJson.itemId);

    activeEditData = R.getJsonObjFromListByItemId(formItemsData, activeEditData.itemId);

    elementEditHtmlReset();
};
//更新预览表单
layoutUpdate = function () {
    $('.re-view-form >div.layui-form-item').remove();
    var html = R.getFormHtml(formItemsData);
    $('.re-view-form').prepend(html);

    $.each(formItemsData, function (idx, json) {
        R.bindFormHtml(json, 0);
    });
    form.render();

    activeEditClass();
    dragCell();
};

var formManageData = null;
R.getFormManageData(formId, function (callbackFormManageData) {
    formManageData = callbackFormManageData;
});

//预览表单
formView = function () {
    localStorage.setItem('formTestData', R.aesEncryptObj(formItemsData));
    layer.open({
        type: 2,
        title: '表单预览',
        content: 'formTest.html?autoHeight=' + (formManageData.openFull === 0 ? true : false),
        area: [formManageData.formWidth + 'px', formManageData.formHeight + 'px'],
        offset: 'b',
        maxmin: true,
        success: function (layero, index) {
            if (formManageData.openFull === 1) layer.full(index);
        }
    });
};

//提交表单
formSubmit = function () {
    if (formItemsData.length === 0) return R.msgWarn('请先设计表单。');

    var oldFields = [];
    if (localStorage.getItem(formId)) oldFields = R.aesDecryptObj(localStorage.getItem(formId)).formFields;
    var formFieldsData = R.getFormFields(formItemsData, oldFields);
    $.each(oldFields, function (idx, json) {
        if ($.inArray(json.itemName, ['_id', 'CreateTime', 'ModifyTime', 'CreateUser', 'ModifyUser', '_HandleCell']) > -1) formFieldsData.push($.extend(R.jsonClone(R.sysFields[json.itemName]), json));
    });
    $.post('/saveFormConfig', {
        _id: formId,
        formConfig: JSON.stringify(formItemsData),
        formFields: JSON.stringify(formFieldsData)
    }, function (res) {

        if (res.code === -1) R.goError(res.msg, res.errPage);
        if (res.code === 1) return R.goMsgWarn(res.msg);
        if (res.code === 0) {
            formId = res.result;
            localStorage.removeItem(formId);
            R.getFormConfig(formId);
            layer.open({
                type: 2,
                title: '提交表单设计',
                content: 'form1.html?formId=' + formId + '&autoHeight=true',
                area: ['800px', '600px'],
                offset: '20px',
                maxmin: true,
                end: function () {
                    parent.layer.closeAll();
                }
            });
        }

    }, 'json');
};

getInitData = function () {
    if (formId !== null && formId !== '') {
        R.getFormConfig(formId, function (callbackFormConfigData) {
            formItemsData = callbackFormConfigData.formConfig;
            R.updateFormConfig(formItemsData, elementTypeSettingData, elementTypeTemplateData);
            layoutUpdate();
        });
    }
};

newForm = function () {
    formItemsData = [];
    formId = '';
    layoutUpdate();
};

dragRow();
dragCell();
elementTypeSelect();
// R.getElementTypeSettingData(function(callbackElementTypeSettingData) {
elementTypeSettingData = {
    string: {
        elementType: 'string', fieldName: '单行输入', fieldShow: 1,
        placeholderText: '请输入内容', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 50,
        layout: 'row', tipShow: '', tipText: '请输入内容',
        required: 1, requiredCustom: '', requiredMsg: '',
        minLenShow: '', minLen: '', maxLenShow: '', maxLen: '',
        regularShow: '', regular: '', regularMsg: '', uniqueness: ''
    },
    textArea: {
        elementType: 'textArea', fieldName: '多行输入', fieldShow: 1,
        placeholderText: '请输入内容', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 600,
        layout: 'row', tipShow: '', tipText: '请输入内容',
        required: 1, requiredCustom: '', requiredMsg: '',
        minLenShow: '', minLen: '', maxLenShow: '', maxLen: ''
    },
    decimal: {
        elementType: 'decimal', fieldName: '数字', fieldShow: 1,
        placeholderText: '请输入数字', placeholderShow: 1,
        itemName: '', dataType: 'decimal', decimalPlaceShow: 1, decimalPlace: 2,
        layout: 'cell', tipShow: '', tipText: '请输入数字',
        required: 1, requiredCustom: '', requiredMsg: '',
        minValShow: '', minVal: '', maxValShow: '', maxVal: ''
    },
    int: {
        elementType: 'int', fieldName: '整数', fieldShow: 1,
        placeholderText: '请输入整数', placeholderShow: 1,
        itemName: '', dataType: 'int', defaultVal: '',
        layout: 'cell', tipShow: '', tipText: '请输入整数',
        required: 1, requiredCustom: '', requiredMsg: '',
        minValShow: '', minVal: '', maxValShow: '', maxVal: ''
    },
    chinese: {
        elementType: 'chinese', fieldName: '中文', fieldShow: 1,
        placeholderText: '请输入中文', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 50,
        layout: 'row', tipShow: '', tipText: '请输入中文',
        required: 1, requiredCustom: '', requiredMsg: '',
        minLenShow: '', minLen: '', maxLenShow: '', maxLen: ''
    },
    url: {
        elementType: 'url', fieldName: '网址', fieldShow: 1,
        placeholderText: '请输入网址', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 400,
        layout: 'row', tipShow: '', tipText: '请输入网址',
        required: 1, requiredCustom: '', requiredMsg: ''
    },
    email: {
        elementType: 'email', fieldName: '电子邮箱', fieldShow: 1,
        placeholderText: '请输入电子邮箱', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 50,
        layout: 'cell', tipShow: '', tipText: '请输入电子邮箱',
        minLenShow: '', minLen: '', maxLenShow: '', maxLen: '',
        required: 1, requiredCustom: '', requiredMsg: '', uniqueness: ''
    },
    phoneNumber: {
        elementType: 'phoneNumber', fieldName: '手机号码', fieldShow: 1,
        placeholderText: '请输入手机号码', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 11,
        layout: 'cell', tipShow: '', tipText: '请输入手机号码',
        required: 1, requiredCustom: '', requiredMsg: '', uniqueness: ''
    },
    telephoneNumber: {
        elementType: 'telephoneNumber', fieldName: '固定电话', fieldShow: 1,
        placeholderText: '请输入固定电话', placeholderShow: 1,
        itemName: '', dataType: 'string', defaultLength: 13,
        layout: 'cell', tipShow: '', tipText: '请输入固定电话',
        required: 1, requiredCustom: '', requiredMsg: ''
    },

    dateTime: {
        elementType: 'dateTime', fieldName: '日期', fieldShow: 1,
        placeholderText: '请选择日期', placeholderShow: 1,
        itemName: '', dataType: 'dateTime', dateType: 'date', dateFormat: 'yyyy-MM-dd',
        layout: 'cell', tipShow: '', tipText: '请选择日期',
        choose: 1, chooseCustom: '', chooseMsg: '',
    },

    switch: {
        elementType: 'switch', fieldName: '开关', fieldShow: 1,
        itemName: '', dataType: 'int', switchText: '开|关', switchDefault: 1,
        layout: ''
    },

    radio: {
        elementType: 'radio', fieldName: '单项选择', fieldShow: 1,
        itemName: '', dataType: 'string', options: '选项1,选项2,选项3', optionsChecked: '',
        layout: '',
        choose: 1, chooseCustom: '', chooseMsg: ''
    },
    checkbox: {
        elementType: 'checkbox', fieldName: '多项选择', fieldShow: 1,
        itemName: '', dataType: 'string', options: '选项1,选项2,选项3', optionsChecked: '',
        layout: '', checkboxTheme: 0,
        choose: 1, chooseCustom: '', chooseMsg: '',
        minCheckedShow: 1, minChecked: '', maxCheckedShow: 1, maxChecked: '',
    },
    select: {
        elementType: 'select', fieldName: '下拉列表', fieldShow: 1,
        itemName: '', dataType: 'string', options: '选项1,选项2,选项3', optionsTip: '请选择',
        layout: 'cell', optionsSearch: 1,
        choose: 1, chooseCustom: '', chooseMsg: ''
    },
    selects: {
        elementType: 'selects', fieldName: '下拉多选', fieldShow: 1,
        itemName: '', dataType: 'string', options: '选项1,选项2,选项3', optionsTip: '请选择',
        layout: 'row', optionsSearch: 1,
        choose: 1, chooseCustom: '', chooseMsg: '',
        minCheckedShow: 1, minChecked: '', maxCheckedShow: 1, maxChecked: ''
    },

    imgCode: {
        elementType: 'imgCode', fieldName: '验证码', fieldShow: 1,
        placeholderText: '请输入图形验证码', placeholderShow: 1,
        itemName: '', dataType: 'string', expiresTime: 5, codeLength: 5,
        layout: ''
    },
    phoneCode: {
        elementType: 'phoneCode', fieldName: '手机验证码', fieldShow: 1,
        placeholderText: '请输入手机验证码', placeholderShow: 1,
        itemName: '', dataType: 'string', expiresTime: 5, codeLength: 6,
        layout: ''
    },

    password: {
        elementType: 'password', fieldName: '密码', fieldShow: 1,
        placeholderText: '请输入密码', placeholderShow: 1,
        itemName: '', dataType: 'password',
        layout: 'cell', tipShow: '', tipText: '请输入密码',
        required: 1, requiredCustom: '', requiredMsg: '',
        minLenShow: '', minLen: '', maxLenShow: '', maxLen: '',
        regularShow: '', regular: '', regularMsg: ''
    },
    hidden: {
        elementType: 'hidden', fieldName: '隐藏值', fieldShow: 1,
        itemName: '', dataType: 'string',
        layout: ''
    },
    json: {
        elementType: 'json', fieldName: '对象', fieldShow: 1,
        placeholderText: '请输入内容', placeholderShow: 1,
        itemName: '', dataType: 'json', defaultLength: '600',
        layout: 'row', tipShow: '', tipText: '请输入内容',
        required: 1, requiredCustom: '', requiredMsg: '',
        minLenShow: '', minLen: '', maxLenShow: '', maxLen: ''
    },
};
// });
// R.getElementTypeTemplateData(function(callbackElementTypeTemplateData) {
elementTypeTemplateData = {
    textRow: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-block',
                child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'text', autocomplete: 'off',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText', bindverify: ''
                    },
                    {
                        tag: 'div', class: 'layui-form-mid layui-word-aux',
                        bindtext: 'tipText', bindhide: 'tipShow'
                    }]
            }]
    },
    textArea: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-block',
                child: [
                    {
                        tag: 'textarea', class: 'layui-textarea',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText', bindverify: ''
                    },
                    {
                        tag: 'div', class: 'layui-form-mid layui-word-aux',
                        bindtext: 'tipText', bindhide: 'tipShow'
                    }]
            }]
    },
    textCell: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline',
                child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'text', autocomplete: 'off',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText', bindverify: ''
                    }]
            },
            {tag: 'div', class: 'layui-form-mid layui-word-aux', bindtext: 'tipText', bindhide: 'tipShow'}]
    },
    dateTime: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline',
                child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'text', autocomplete: 'off',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText', bindverify: '',
                        binddatetime: ''
                    }]
            },
            {tag: 'div', class: 'layui-form-mid layui-word-aux', bindtext: 'tipText', bindhide: 'tipShow'}]
    },
    switch: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline',
                child: [
                    {
                        tag: 'input', type: 'checkbox', bindfield: '', bindname: '', bindswitch: ''
                    }]
            }]
    },
    radio: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-block',
                bindfield: '', bindcheckbox: '', bindverify: '',
                child: [
                    {
                        tag: 'input', type: 'radio', retype: 'radio'
                    }]
            }]
    },
    checkbox: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-block',
                bindfield: '', bindcheckbox: '', bindverify: '',
                child: [
                    {
                        tag: 'input', type: 'checkbox', retype: 'checkbox'
                    }]
            }]
    },
    select: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline',
                child: [
                    {
                        tag: 'select', bindfield: '', bindname: '', bindselect: '', bindverify: '',
                    }]
            }]
    },
    selects: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-block',
                child: [
                    {
                        tag: 'select', retype: 'selects',
                        bindfield: '', bindname: '', bindselects: '', bindverify: ''
                    }]
            }]
    },
    imgCode: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemName: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline', child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'text', autocomplete: 'off',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText',
                        bindimgcode: '', retype: 'imgCode'
                    }
                ]
            }, {
                tag: 'div', class: 'layui-inline'
            }
        ]
    },
    phoneCode: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemName: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline', child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'text', autocomplete: 'off',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText',
                        bindphonecode: '', retype: 'phoneCode'
                    }
                ]
            }, {
                tag: 'div', class: 'layui-inline', child: [
                    {
                        tag: 'div', class: 'layui-form-mid layui-word-aux',
                        child: [{tag: 'a'}]
                    }
                ]
            }
        ]
    },
    password: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline',
                child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'password', autocomplete: 'off',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText', bindverify: ''
                    }]
            },
            {tag: 'div', class: 'layui-form-mid layui-word-aux', bindtext: 'tipText', bindhide: 'tipShow'}]
    },
    hidden: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-inline',
                child: [
                    {
                        tag: 'input', class: 'layui-input', type: 'hidden', bindname: '', bindhidden: ''
                    }]
            }]
    },
    json: {
        tag: 'div', class: 'layui-form-item', itemId: '', itemData: {},
        child: [
            {tag: 'label', class: 'layui-form-label', bindtext: 'fieldName', bindhide: 'fieldShow'},
            {
                tag: 'div', class: 'layui-input-block',
                child: [
                    {
                        tag: 'textarea', class: 'layui-textarea', retype: 'json',
                        bindfield: '', bindname: '', bindplaceholder: 'placeholderText', bindverify: ''
                    }]
            }]
    },
};
// });
getInitData();
elementEditHtmlUpdate();