import $ from 'static/common/jquery/jquery-3.6.0.min';
import * as w2ui from "static/common/w2ui/w2ui-2.0.es6.min";
import NCPTab from "static/ncp.tabs";

function WebApp() {

    const that = {
        WebInit: false,
        isLocked: false,
        Data: {
            sessionId: window.location.hash.substring(1) ? window.location.hash.substring(1) : null,
            uID: null
        }
    }

    that.Init = () => {
        if ( that.WebInit ) return;
        // получаем данные о сессии пользователя

        that.Interface.Init();
    };

    that.Interface = {

        Tabs: null,

        Init: () => {
            const pstyle = 'border-bottom: 3px solid #efefef; padding: 0px';
            that.w2uiData.Layout = new w2ui.w2layout({
                box: '#WA_layout',
                name: 'WA_layout',
                panels: [
                    { type: 'top', size: 41, style: pstyle, html: '<div id="WA_toolbar">toolbar</div>' },
                    { type: 'main', html: '<div id="WA_tabs"></div>' }
                ]
            });
            that.Interface.WA_toolbar();
            that.Interface.Tabs = NCPTab({
                real: 'WebApp.Interface.Tabs',
                name: 'WA_tabs',
                target: '#WA_tabs'
            });
            that.WebInit = true;
        },

        initUser: (uID) => {
            if ( that.Data.uID !== null && that.Data.uID !== uID) {
                that.Interface.requestPageReload();
                return;
            }
            that.CMSock.sGW_request("userAPI", "getUserInfo", { }, (r) => {
                that.Data = r.data;
                that.Interface.WA_toolbar();
            }, true);
        },

        WA_toolbar: () => {
            if ( that.w2uiData.Toolbar) that.w2uiData.Toolbar.destroy();
            if ( that.Data.uID === null ) {
                that.w2uiData.Toolbar = new w2ui.w2toolbar({
                    box: '#WA_toolbar',
                    name: 'WA_toolbar',
                    items: [
                        {
                            type: 'button',
                            id: 'WA_toolbar_Home',
                            style: 'padding-top:7px',
                            text: '<b>NetCorp Pro</b>',
                            icon: 'fa-brands fa-hive'
                        },
                        {type: 'break'},
                        {type: 'button', id: 'WA_toolbar_Registration', text: 'Новый пользователь', icon: 'fa-solid fa-user-plus'},
                        {type: 'button', id: 'WA_toolbar_Auth', text: 'Авторизация', icon: 'fa-solid fa-key'},
                        {type: 'button', id: 'WA_toolbar_Recover', text: 'Забыли пароль?', icon: 'fa-solid fa-person-circle-question'},
                        {type: 'spacer'},
                        {type: 'button', id: 'WA_toolbar_HelpGuest', text: 'Помощь', icon: 'fa-solid fa-life-ring'},
                    ],
                    onClick(event) {
                        const T = event.target;
                        if ( T === "WA_toolbar_Registration" ) {
                            if ( that.w2uiData.Popup === null ) {
                                that.w2uiData.Popup = w2ui.w2popup.open({
                                    title: 'Регистрация',
                                    body: '<div id="RegisterFormHTML" style="width: 100%; height: 100%;"></div>',
                                    style: 'padding: 15px 0px 0px 0px',
                                    width: 450, height: 270,
                                    showClose: true,
                                    onClose: function (event) {
                                        that.w2uiData.Popup = null;
                                    }
                                }).then((event) => {
                                    that.w2uiData.Forms.RegisterForm.render('#RegisterFormHTML');
                                });
                            }
                        }
                        if ( T === "WA_toolbar_Auth" ) {
                            that.Interface.requestLogin();
                        }
                    }
                });
            } else {
                let items = [];
                items.push({
                    type: 'button',
                    id: 'WA_toolbar_Home',
                    style: 'padding-top:7px',
                    text: '<b>NetCorp Pro</b>',
                    icon: 'fa-brands fa-hive'
                });
                items.push({type: 'break'});
                let Agents = [];
                $.each( that.Data.Agents, function( key, value ) {
                    const id = key;
                    Agents.push({
                        id: key,
                        text: value.text,
                        icon: value.icon
                    });
                });
                items.push({ type: 'menu-radio', id: 'desktop_selector', icon: 'fa-solid fa-building-user',
                    text(item) {
                        let el = item.get(item.selected);
                        return el.text;
                    },
                    selected: 0,
                    overlay: { position: 'bottom|top' },
                    items: Agents
                });
                items.push({type: 'spacer'});
                items.push({ type: 'menu', id: 'item4', text: that.Data.name, icon: 'fa-solid fa-sliders',
                    items: [
                        { id: 'top_right_account', text: 'Учётная запись', icon: 'fa-solid fa-address-card' },
                        { id: 'top_right_exit', text: 'Выход', icon: 'fa-solid fa-right-from-bracket' },
                    ]
                });
                items.push({type: 'button', id: 'WA_toolbar_HelpUser', text: 'Помощь', icon: 'fa-solid fa-life-ring'});
                that.w2uiData.Toolbar = new w2ui.w2toolbar({
                    box: '#WA_toolbar',
                    name: 'WA_toolbar',
                    items: items,
                    onClick(event) {
                        const T = event.target;
                        if ( T === "desktop_selector" ) return;
                        if ( T.startsWith("menuO_selector:", 0) ) {
                            that.CMSock.sGW_request("userAPI", "switchAccount", { target: T.slice(15) }, (r) => {}, true);
                        }
                    },
                    onRender: function(event) {
                        that.CMSock.sGW_request("userAPI", "switchDesktop", { target: 'USER', id: 0 }, (r) => {
                            that.Interface.openDesktop('USER');
                        }, true);
                    }
                });
            }
        },

        requestLogin: () => {
            if ( that.w2uiData.Popup === null ) {
                that.w2uiData.Popup = w2ui.w2popup.open({
                    title: 'Авторизация',
                    body: '<div id="loginFormHTML" style="width: 100%; height: 100%;"></div>',
                    style: 'padding: 15px 0px 0px 0px',
                    width: 450, height: 230,
                    showClose: true,
                    onClose : function (event) {
                        that.w2uiData.Popup = null;
                    }
                }).then((event) => {
                    that.w2uiData.Forms.LoginForm.render('#loginFormHTML');
                });
            }
        },

        request: function (o, callbackFnk, anywayFnk) {

            if ( typeof o.mode == "undefined" ) {
                o.mode == "system";
            }

            if (o.mode == "user") {
                if (user_click != false) return;
                user_click = true;
            }

            var request_mimeType = undefined;
            var request_contentType = undefined;
            var request_cache = undefined;
            var request_processData = undefined;

            var b = o;

            if (o.request_type == "form-data") {
                var request_mimeType = "multipart/form-data";
                var request_contentType = request_cache = request_processData = false;
                b = b.formData;
                Object.keys(o).forEach(function (key) {
                    if ( key != "formData") {
                        b.append(key, o[key]);
                    }
                });
            }

            // session_id inject
            let session_id = functions.get_sess_data('session_id');
            if ( typeof session_id != "undefined" ) b.session_id = session_id;

            $.ajax({
                url: base_href + '/' + o.url,
                type: "POST",
                data: b,
                mimeType: request_mimeType,
                contentType: request_contentType,
                cache: request_cache,
                processData: request_processData,
                error: function(xhr){
                    gen_toast("error", "Ошибка в результате запроса (#1).");
                    if ( typeof anywayFnk == 'function' ){ anywayFnk.call(); }
                },
                success: function(data){

                    // auth hook & request hook
                    if ( typeof data == 'object' && data != null) {
                        if ( "login_status" in data ) {
                            if (data['login_status'] == "inactive") {
                                if ( typeof anywayFnk == 'function' ) {
                                    anywayFnk.call();
                                } else {
                                    location.href = base_href+'?r='+data['login_status_err'];
                                }
                                return;
                            }
                        }
                    }

                    if (o.answer == "json" && !isJson(data) || data == null) {
                        gen_toast("error", "Ошибка в результате запроса (#2).");
                        if ( typeof anywayFnk == 'function' ){ anywayFnk.call(); }
                        return;
                    }

                    // берём обработку ошибок на себя, если ожидается текст
                    if (o.answer == "text" && isJson(data)) {
                        if ( "error_msg" in data ) {
                            gen_toast("error", data['error_msg']);
                            if ( typeof anywayFnk == 'function' ){ anywayFnk.call(); }
                            return;
                        } else {
                            gen_toast("error", "Ошибка в результате запроса (#3).");
                        }
                    }

                    if ( typeof callbackFnk == 'function' ){
                        callbackFnk.call(this, data);
                    }

                },
                complete: function (data) {

                    if (o.mode == "user") {
                        user_click = false;
                    }

                }
            });

        },

        /**
         * @param {{Type: string, Text: string}} o
         */
        Msg: (o) => {

            let heading = "Сообщение";
            let icon = "fa-solid fa-circle-info";
            let color = '';

            if (o.Type === "S") {
                heading = "Действие выполнено!";
                icon = "fa-solid fa-badge-check";
                color = '#00b09b';
            }

            if (o.Type === "E") {
                heading = "Возникла ошибка!";
                icon = "fa-sharp fa-solid fa-circle-xmark";
                color = '#ff6666';
            }

            if (o.Type === "W") {
                heading = "Внимание!";
                icon = "fa-solid fa-circle-exclamation";
            }

            if (o.Type === "I") {
                heading = "Информация";
                color = '#79a6d2';
            }

            if (typeof o.Text == "undefined") o.Text = "Описание ошибки недоступно.";

            if (typeof o.Text == "object") {
                let tmp = "<ul>";
                $.each( o.Text, function( key, value ) {
                    tmp = tmp + "<li>" + value.error + "</li>";
                });
                o.Text = tmp + "</ul>";
                tmp = null;
            }

            let onClick = function(){};
            if ( "onClick" in o ) onClick = o.onClick;

            let onEnd = function(){};
            if ( "onEnd" in o ) onEnd = o.onEnd;

            $.toast({
                text: o.Text, // Text that is to be shown in the toast
                heading: heading, // Optional heading to be shown on the toast
                icon: icon, // Type of toast icon
                showHideTransition: 'fade', // fade, slide or plain
                allowToastClose: true, // Boolean value true or false
                hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
                stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
                position: 'bottom-left', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
                textAlign: 'left',  // Text alignment i.e. left, right or center
                loader: true,  // Whether to show loader or not. True by default
                loaderBg: color,  // Background color of the toast loader
                beforeShow: function () {}, // will be triggered before the toast is shown
                afterShown: function () {}, // will be triggered after the toat has been shown
                beforeHide: function () {}, // will be triggered before the toast gets hidden
                afterHidden: function () {}  // will be triggered after the toast has been hidden
            });

        },

        requestPageReload: (msg) => {
            waitUntil(() => {
                if ( that.w2uiData.Popup === null ) {
                    that.w2uiData.Popup = w2ui.w2popup.open({
                        title: 'Требуется перезагрузка',
                        body: 'Сеанс был завершён, страница обновится через <span id="PageReload_countdown">5</span> сек.',
                        style: 'padding: 15px 0px 0px 0px',
                        width: 450, height: 150,
                        showClose: true,
                        onClose : function (event) {
                            that.w2uiData.Popup = null;
                        }
                    }).then((event) => {
                        let timeleft = 5;
                        let downloadTimer = setInterval(function(){
                            if(timeleft <= 0){
                                clearInterval(downloadTimer);
                                location.reload();
                            }
                            $("#PageReload_countdown").html(`${timeleft}`);
                            timeleft -= 1;
                        }, 1000);
                    });
                    return true;
                } else {
                    return false;
                }
            });
        },

        ifaceLock: () => {
            $.blockUI({ message: '<span class="icon fa-solid fa-spinner fa-spin-pulse"></span> <span>Нет связи с сервером. Идёт подключение...</span>' });
        },

        ifaceUnlock: () => {
            $.unblockUI();
        },

    };

    that.w2uiData = {
        Layout: null,
        Toolbar: null,
        Popup: null,
        Forms: {
            LoginForm: new w2ui.w2form({
                name: 'LoginForm',
                style: 'border: 0px; background-color: transparent;',
                fields: [
                    { field: 'email', type: 'text', required: true, html: { label: 'E-mail' } },
                    { field: 'password', type: 'password', required: true, html: { label: 'Пароль' } }
                ],
                actions:{
                    btn_ok: {
                        text: 'Вход',
                        onClick(event) {
                            const data = that.w2uiData.Forms.LoginForm.record;
                            that.CMSock.sGW_request("userAuth", "doLogin", { email: data.email, password: data.password }, (r) => {
                                w2ui.w2popup.close();
                            }, true);
                        }
                    }
                }
            }),
            RegisterForm: new w2ui.w2form({
                name: 'RegisterForm',
                style: 'border: 0px; background-color: transparent;',
                fields: [
                    { field: 'email', type: 'text', required: true, html: { label: 'E-mail' } },
                    { field: 'password', type: 'password', required: true, html: { label: 'Пароль' } },
                    { field: 'password2', type: 'password', required: true, html: { label: 'Повторите пароль' } }
                ],
                actions:{
                    btn_ok: {
                        text: 'Создать аккаунт',
                        onClick(event) {
                            const data = that.w2uiData.Forms.RegisterForm.record;
                            if ( data.password !== data.password2 ) {
                                that.Interface.Msg({
                                    Type: 'E',
                                    Text: 'Пароли не совпадают'
                                });
                                return;
                            }
                            w2ui.w2popup.lock('Идёт отправка сообщения...');
                            that.CMSock.sGW_request("userRegister", "doRegister", { email: data.email, password: data.password }, (r) => {
                                w2ui.w2popup.unlock();
                                if ( r.Result === 'OK') {
                                    w2ui.w2popup.close();
                                    that.w2uiData.Popup = w2ui.w2popup.open({
                                        title: 'Проверка введённого E-mail',
                                        body: '<div id="loginFormValidateHTML" style="width: 100%; height: 100%;"></div>',
                                        style: 'padding: 15px 0px 0px 0px',
                                        width: 400, height: 180,
                                        showClose: true,
                                        onClose : function (event) {
                                            that.w2uiData.Popup = null;
                                        }
                                    }).then((event) => {
                                        that.w2uiData.Forms.RegisterValidateForm.render('#loginFormValidateHTML');
                                    });
                                    that.Interface.Msg({
                                        Type: 'S',
                                        Text: "Пожалуйста, проверьте ящик и введите полученный код."
                                    });
                                } else {
                                    that.Interface.Msg({
                                        Type: 'I',
                                        Text: r.error_msg
                                    });
                                }
                            });
                        }
                    }
                }
            }),
            RegisterValidateForm: new w2ui.w2form({
                name: 'RegisterValidateForm',
                style: 'border: 0px; background-color: transparent;',
                fields: [
                    { field: 'code', type: 'text', required: true, html: { label: 'Код из письма:' } },
                ],
                actions:{
                    btn_ok: {
                        text: 'Завершить',
                        onClick(event) {
                            const data = that.w2uiData.Forms.RegisterValidateForm.record;
                            if ( !data.code ) {
                                that.Interface.Msg({
                                    Type: 'E',
                                    Text: 'Пожалуйста, введите код из письма в текстовое поле!'
                                });
                                return;
                            }
                            that.CMSock.sGW_request("userRegister", "doRegisterFinal", { email: that.w2uiData.Forms.RegisterForm.record.email, code: data.code }, (r) => {
                                w2ui.w2popup.close();
                                that.Interface.Msg({
                                    Type: 'S',
                                    Text: "Аккаунт активирован."
                                });
                            }, true);
                        }
                    }
                }
            })
        }
    }

    that.isJSON = (data) => {
        try {
            JSON.parse(data);
            return true;
        } catch (error) {
            return false;
        }
    }

    return that;
}

const waitUntil = (condition) => {
    let interval = setInterval(() => {
        if (!condition()) {
            return
        }
        clearInterval(interval)
    }, 100)
}

const htmlOriginal = $.fn.html;
$.fn.html = function(html,callback){
    const ret = htmlOriginal.apply(this, arguments);
    if(typeof callback == "function"){
        callback();
    }
    return ret;
}

export { WebApp };
