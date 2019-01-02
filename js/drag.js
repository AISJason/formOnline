/*!
 * re-drag.js v1 (http://konsolestudio.com/dad)
 * Author William Lima
 */

(function ($) {
    'use strict';
    var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    $.fn.dad = function (opts) {
        var _this = this;
        var defaults = {
            active: true,
            target: '>div',
            targetClass: '.re-drag-item',
            childrenClass: 're-drag-children',
            cloneClass: 're-drag-children-clone',
            placeholder: '',
            containerClass: 're-drag-container',
            dragArea: false,
            editArea: false,
            callback: false,
            activeItemCallback: null,
            moveItemCallback: null
        };

        var options = $.extend({}, defaults, opts);

        $(this).each(function () {
            var active = options.active;
            var $daddy = $(this);
            var targetClass = options.targetClass;
            var $target = $daddy.find(targetClass);
            var childrenClass = options.childrenClass;
            var cloneClass = options.cloneClass;
            // var jQclass = '.' + childrenClass;
            var placeholder = options.placeholder;
            var holderClass = 're-drag-children-placeholder';
            var dragArea = options.dragArea;
            var dragAreaClass = 're-drag-area';
            var editArea = options.editArea;
            var editAreaClass = 're-edit-area';
            var callback = options.callback;
            var activeItemCallback = options.activeItemCallback;
            var moveItemCallback = options.moveItemCallback;
            var moveObj = null;

            // HANDLE MOUSE
            var mouse = {
                x: 0,
                y: 0,
                target: false,
                clone: false,
                placeholder: false,
                cloneoffset: {
                    x: 0,
                    y: 0,
                },
                updatePosition: function (e) {
                    this.x = e.pageX;
                    this.y = e.pageY;
                },

                move: function (e) {
                    this.updatePosition(e);
                    if (this.clone !== false && _this.target !== false) {
                        this.clone.css({
                            left: this.x - this.cloneoffset.x,
                            top: this.y - this.cloneoffset.y,
                        });
                    }
                },
            };

            $(window).on('mousemove touchmove', function (e) {
                var ev = e;

                if (mouse.clone !== false && mouse.target !== false) e.preventDefault();

                if (supportsTouch && e.type == 'touchmove') {
                    ev = e.originalEvent.touches[0];
                    var mouseTarget = document.elementFromPoint(ev.clientX, ev.clientY);

                    $(mouseTarget).trigger('touchenter');
                }

                mouse.move(ev);
            });

            $daddy.addClass(options.containerClass);

            if (!$daddy.hasClass('re-drag-active') && active === true) {
                $daddy.addClass('re-drag-active');
            }
            ;

            _this.addDropzone = function (selector, func) {
                $(selector).on('mouseenter touchenter', function () {
                    if (mouse.target !== false) {
                        mouse.placeholder.css({display: 'none'});
                        mouse.target.css({display: 'none'});
                        $(this).addClass('active');
                    }
                }).on('mouseup touchend', function () {
                    if (mouse.target != false) {
                        mouse.placeholder.css({display: 'block'});
                        mouse.target.css({display: 'block'});
                        func(mouse.target);
                        dadEnd();
                    }
                    ;

                    $(this).removeClass('active');
                }).on('mouseleave touchleave', function () {
                    if (mouse.target !== false) {
                        mouse.placeholder.css({display: 'block'});
                        mouse.target.css({display: 'block'});
                    }

                    $(this).removeClass('active');
                });
            };

            // GET POSITION FUNCTION
            // _this.getPosition = function () {
            //     var positionArray = [];
            //     $(this).find(jQclass).each(function () {
            //         positionArray[$(this).attr('re-drag-id')] = parseInt($(this).attr('re-drag-position'));
            //     });
            //
            //     return positionArray;
            // };

            _this.activate = function () {
                active = true;
                if (!$daddy.hasClass('re-drag-active')) {
                    $daddy.addClass('re-drag-active');
                }

                return _this;
            };

            // DEACTIVATE FUNCTION
            _this.deactivate = function () {
                active = false;
                $daddy.removeClass('re-drag-active');
                return _this;
            };

            // DEFAULT DROPPING
            $daddy.on('DOMNodeInserted', function (e) {
                var $thisTarget = $(e.target);
                // if (!$thisTarget.hasClass(childrenClass) && !$thisTarget.hasClass(holderClass)&&$thisTarget.hasClass(targetClass.substr(1))) {
                //     $thisTarget.addClass(childrenClass);
                // }
                if ((dragArea === false || !$thisTarget.hasClass(dragArea)) && $thisTarget.hasClass(childrenClass) && !$thisTarget.hasClass(dragAreaClass) && !$thisTarget.hasClass('re-drag-merge')) {
                    $thisTarget.addClass(dragAreaClass);
                } else if (dragArea !== false && !$thisTarget.hasClass(dragAreaClass)) {
                    $thisTarget.find(dragArea).addClass(dragAreaClass);
                }
                //
                // if(editArea!==false&&!$thisTarget.hasClass(editAreaClass))
                //     $thisTarget.find(editArea).addClass(editAreaClass);
            });

            $(document).on('mouseup touchend', function () {
                dadEnd();
            });

            // ORDER ELEMENTS
            var order = 1;
            $target.addClass(childrenClass);//.each(function () {
            // if ($(this).data('re-drag-id') == undefined) {
            //     $(this).attr('re-drag-id', order);
            // }
            //
            // $(this).attr('re-drag-position', order);
            // order++;
            //});

            // CREATE REORDER FUNCTION
            function updatePosition(e) {
                // var order = 1;
                // e.find(jQclass).each(function () {
                //     $(this).attr('re-drag-position', order);
                //     order++;
                // });
            }

            // END EVENT
            function dadEnd() {
                if (mouse.target != false && mouse.clone != false) {
                    if (callback != false) {
                        callback(mouse.target);
                    }

                    var appear = mouse.target;
                    var desappear = mouse.clone;
                    var holder = mouse.placeholder;
                    var bLeft = 0;
                    var bTop = 0;

                    // Maybe we will use this in the future
                    //Math.floor(parseFloat($daddy.css('border-left-width')));
                    //Math.floor(parseFloat($daddy.css('border-top-width')));
                    if ($.contains($daddy[0], mouse.target[0])) {
                        mouse.clone.animate({
                            top: mouse.target.offset().top - $daddy.offset().top - bTop,
                            left: mouse.target.offset().left - $daddy.offset().left - bLeft,
                        }, 300, function () {
                            appear.css({
                                visibility: 'visible',
                            }).removeClass('active');
                            desappear.remove();
                        });

                        if (moveObj && moveItemCallback)
                            moveItemCallback(moveObj);

                    } else {
                        mouse.clone.fadeOut(300, function () {
                            desappear.remove();
                        });
                    }

                    holder.remove();
                    mouse.clone = false;
                    mouse.placeholder = false;
                    mouse.target = false;
                    updatePosition($daddy);
                }

                $('html, body').removeClass('re-drag-noSelect');
            }

            // UPDATE EVENT
            function dadUpdate(obj) {
                moveObj = null;
                if (mouse.target !== false && mouse.clone !== false) {
                    var $origin = $('<span style="display:none"></span>');
                    var $newplace = $('<span style="display:none"></span>');


                    if (obj.prevAll().hasClass('active')) {
                        obj.after($newplace);
                        moveObj = {newItemId: $(obj).attr('reitemid'), moveStep: 1}
                    } else {
                        obj.before($newplace);
                        moveObj = {newItemId: $(obj).attr('reitemid'), moveStep: 0}
                    }

                    mouse.target.before($origin);
                    $newplace.before(mouse.target);

                    // UPDATE PLACEHOLDER
                    mouse.placeholder.css({
                        top: mouse.target.offset().top - $daddy.offset().top,
                        left: mouse.target.offset().left - $daddy.offset().left,
                        width: mouse.target.outerWidth() - 10,
                        height: mouse.target.outerHeight() - 10,
                    });

                    $origin.remove();
                    $newplace.remove();
                }
            }

            // GRABBING EVENT
            var jq = (dragArea !== false && $daddy.find(dragAreaClass).length > 0) ? dragArea : targetClass;
            $daddy.find(jq).addClass(dragAreaClass);
            $daddy.on('mousedown touchstart', editArea, function (e) {
                e.stopPropagation();
            });
            $daddy.on('mousedown touchstart', jq, function (e) {
                if (!$(this).closest(targetClass).html() || $(this).closest(targetClass).hasClass('re-drag-merge'))
                    return;

                if (activeItemCallback != null) {
                    activeItemCallback($(this).closest('[reitemid]').prop('outerHTML'), $(this).closest('[reitemid]').attr('reitemid'));
                }
                // For touchstart we must update "mouse" position
                if (e.type == 'touchstart') {
                    mouse.updatePosition(e.originalEvent.touches[0]);
                }
                if (mouse.target == false && active == true && (e.which == 1 || e.type == 'touchstart')) {
                    var $self = $(this);

                    // GET TARGET
                    if (dragArea !== false && $daddy.find(dragAreaClass).length > 0) {
                        mouse.target = $daddy.find(targetClass).has(this);
                    } else {
                        mouse.target = $self;
                    }
                    // ADD CLONE
                    mouse.clone = mouse.target.clone();
                    mouse.target.css({visibility: 'hidden'}).addClass('active');
                    mouse.clone.addClass(cloneClass);
                    $daddy.append(mouse.clone);

                    // ADD PLACEHOLDER
                    var $placeholder = $('<div></div>');
                    mouse.placeholder = $placeholder;
                    mouse.placeholder.addClass(holderClass);
                    mouse.placeholder.css({
                        top: mouse.target.offset().top - $daddy.offset().top,
                        left: mouse.target.offset().left - $daddy.offset().left,
                        width: mouse.target.outerWidth() - 10,
                        height: mouse.target.outerHeight() - 10,
                        lineHeight: mouse.target.height() - 18 + 'px',
                        textAlign: 'center'
                    }).text(placeholder);

                    $daddy.append(mouse.placeholder);

                    // GET OFFSET FOR CLONE
                    var bLeft = Math.floor(parseFloat($daddy.css('border-left-width')));
                    var bTop = Math.floor(parseFloat($daddy.css('border-top-width')));
                    var difx = mouse.x - mouse.target.offset().left + $daddy.offset().left + bLeft;
                    var dify = mouse.y - mouse.target.offset().top + $daddy.offset().top + bTop;
                    mouse.cloneoffset.x = difx;
                    mouse.cloneoffset.y = dify;

                    // REMOVE THE CHILDREN DAD CLASS AND SET THE POSITION ON SCREEN
                    mouse.clone.removeClass(childrenClass).css({
                        position: 'absolute',
                        top: mouse.y - mouse.cloneoffset.y,
                        left: mouse.x - mouse.cloneoffset.x,
                    });

                    // UNABLE THE TEXT SELECTION AND SET THE GRAB CURSOR
                    $('html,body').addClass('re-drag-noSelect');
                }
                //e.stopPropagation();
            });

            $daddy.on('mouseenter touchenter', '.' + childrenClass, function () {
                dadUpdate($(this));
            });
        });

        return this;
    };
})(jQuery);
