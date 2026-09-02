/**
 *
 * @class
 * @classdesc VIA
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 12 May 2019
 *
 */

'use strict'

function _via(via_container) {
  this._ID = '_via';

  console.log('正在初始化 VGG 图像标注器（VIA）版本 ' + _VIA_VERSION)
  this.via_container = via_container;

  // 手工具模式（拖拽平移）
  this.hand_mode = false;

  this.d  = new _via_data();

  if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
    // ADD DEBUG CODE HERE (IF NEEDED)
  }

  //// define the html containers
  this.control_panel_container = document.createElement('div');
  this.control_panel_container.setAttribute('id', 'via_control_panel_container');
  this.via_container.appendChild(this.control_panel_container);

  // 左侧边栏：形状选择 + 缩放按钮
  this.left_sidebar = document.createElement('div');
  this.left_sidebar.setAttribute('id', 'via_left_sidebar');
  this.via_container.appendChild(this.left_sidebar);

  this.view_container = document.createElement('div');
  this.view_container.setAttribute('id', 'view_container');
  this.via_container.appendChild(this.view_container);

  this.editor_container = document.createElement('div');
  this.editor_container.setAttribute('id', 'editor_container');
  this.editor_container.classList.add('hide');
  this.via_container.appendChild(this.editor_container);

  // 右侧边栏折叠手柄（始终可见，用于展开/缩回属性编辑器）
  this.editor_handle = document.createElement('div');
  this.editor_handle.setAttribute('id', 'via_editor_handle');
  this.editor_handle.setAttribute('title', '属性编辑器');
  this.editor_handle.innerHTML = '<svg class="handle_icon" viewBox="0 0 24 24"><use xlink:href="#micon_insertcomment"></use></svg>';
  this.editor_handle.addEventListener('click', function() {
    this.editor.toggle();
  }.bind(this));
  this.via_container.appendChild(this.editor_handle);

  this.message_container = document.createElement('div');
  this.message_container.setAttribute('id', '_via_message_container');
  this.message_container.setAttribute('class', 'message_container');
  this.message_container.addEventListener('click', _via_util_msg_hide);
  this.message_panel = document.createElement('div');
  this.message_panel.setAttribute('id', '_via_message');
  this.message_container.appendChild(this.message_panel);
  this.via_container.appendChild(this.message_container);

  //// initialise content creators and managers
  this.ie = new _via_import_export(this.d);

  // 类别管理器
  this.category = new _via_category(this);
  var self = this;
  this.category.init().then(function() {
    self._render_category_overlay();
    self._sync_hand_mode();
    // 项目导入/加载后重新读取类别配置（颜色/类型/选中）
    self.d.on_event('project_loaded', '_via_category_reload', function() {
      self.category.on_project_loaded();
    });
  }).catch(function(e) {
    console.warn('类别初始化: ' + e);
  });

  this.va = new _via_view_annotator(this.d, this.view_container);
  this.editor = new _via_editor(this.d, this.va, this.editor_container);

  // 右下角半透明快捷键浮窗（视图渲染会清空容器，故封装方法并在视图切换后重挂）
  this._render_shortcut_overlay();
  this.va.on_event('view_show', this._ID, function() {
    this._render_shortcut_overlay();
    this._render_category_overlay();
    this._sync_hand_mode();
  }.bind(this));
  this.va.on_event('view_next', this._ID, function() {
    this._render_shortcut_overlay();
    this._render_category_overlay();
    this._sync_hand_mode();
  }.bind(this));
  this.va.on_event('view_prev', this._ID, function() {
    this._render_shortcut_overlay();
    this._render_category_overlay();
    this._sync_hand_mode();
  }.bind(this));

  this.view_manager_container = document.createElement('div');
  this.view_manager_container.setAttribute('id', 'view_manager_container');
  this.vm = new _via_view_manager(this.d, this.va, this.view_manager_container);
  this.vm._init();

  // 底部缩略图栏
  this.thumbnail_bar = document.createElement('div');
  this.thumbnail_bar.setAttribute('id', 'via_thumbnail_bar');
  this.via_container.appendChild(this.thumbnail_bar);
  this.vm._bind_thumbnail_bar(this.thumbnail_bar);
  this.vm._thumbnail_bar_update();

  // control panel shows the view_manager_container
  this.cp = new _via_control_panel(this.control_panel_container, this);
  // 形状 + 缩放按钮注入左侧边栏
  this.cp._add_region_shape_selector();
  // 默认选中拖拽平移（不画框），取消所有形状选中
  this.cp._set_hand_mode_ui(true);
  this.cp._clear_shape_selection();

  // event handlers for buttons in the control panel
  this.cp.on_event('region_shape', this._ID, function(data, event_payload) {
    this.va.set_region_draw_shape(event_payload.shape);
  }.bind(this));
  this.cp.on_event('editor_toggle', this._ID, function(data, event_payload) {
    this.editor.toggle();
  }.bind(this));
  this.cp.on_event('zoom_in', this._ID, function(data, event_payload) {
    if(this.va.view_mode === _VIA_VIEW_MODE.IMAGE1) {
      this.va.file_annotator[0][0]._zoom_in();
    }
  }.bind(this));
  this.cp.on_event('zoom_out', this._ID, function(data, event_payload) {
    if(this.va.view_mode === _VIA_VIEW_MODE.IMAGE1) {
      this.va.file_annotator[0][0]._zoom_out();
    }
  }.bind(this));
  this.cp.on_event('fit_screen', this._ID, function(data, event_payload) {
    if(this.va.view_mode === _VIA_VIEW_MODE.IMAGE1) {
      this.va.file_annotator[0][0]._zoom_fit_screen();
    }
  }.bind(this));
  this.cp.on_event('hand_toggle', this._ID, function(data, event_payload) {
    // 手模式状态由控制面板 _set_hand_mode_ui 统一管理（单选互斥）
    // 这里仅确保 file_annotator 同步拖拽模式
    if(this.va.view_mode === _VIA_VIEW_MODE.IMAGE1 &&
       this.va.file_annotator[0] && this.va.file_annotator[0][0]) {
      this.va.file_annotator[0][0]._set_hand_mode(this.hand_mode);
    }
  }.bind(this));

  // keyboard event handlers
  //this.via_container.focus()
  //this.via_container.addEventListener('keydown', this._keydown_handler.bind(this));
  window.addEventListener('keydown', this._keydown_handler.bind(this)); // @todo: should be attached only to VIA application container

  // 点击非输入框区域时主动让输入框失焦，避免光标停留在输入框导致快捷键失效
  document.addEventListener('mousedown', function(e) {
    var tag = e.target.tagName;
    if ( tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' ) {
      if ( document.activeElement &&
           (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') ) {
        document.activeElement.blur();
      }
    }
  }, true); // capture 阶段，优先于 VIA 内部处理

  // load any external modules (e.g. demo) which should be defined as follows
  // function _via_load_submodules()
  if (typeof _via_load_submodules === 'function') {
    console.log('VIA submodule detected, invoking _via_load_submodules()');
    this._load_submodule = new Promise( function(ok_callback, err_callback) {
      try {
        _via_load_submodules.call(this);
      }
      catch(err) {
        console.warn('VIA 子模块加载失败：' + err);
        err_callback(err);
      }
    }.bind(this));
  } else {
    // debug code (disabled for release)
    if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
      //this.s.pull(''); // load shared project
      //this.d.project_load_json(_via_dp[2]['store']); // video
      //this.d.project_load_json(_via_dp[1]['store']); // audio
      //this.d.project_load_json(_via_dp[4]['store']); // image
      //this.d.project_load_json(_via_dp[3]['store']); // pair

      /*
      setTimeout( function() {
      //this.va.view_show('1');
      //this.editor.show();
      //this.cp._page_show_import_export();
      //this.cp._share_show_info();
      }.bind(this), 200);
      */
    }
  }

  // ready
  _via_util_msg_show(_VIA_NAME + ' (' + _VIA_NAME_SHORT + ') ' + _VIA_VERSION + ' ready.');
}

_via.prototype._hook_on_browser_resize = function() {
  if ( typeof(this.va.vid) !== 'undefined' ) {
    this.va.view_show(this.va.vid);
  }
}

_via.prototype._keydown_handler = function(e) {
  // avoid handling events when text input field is in focus
  if ( e.target.type !== 'text' &&
       e.target.type !== 'textarea'
     ) {
    // R 键：适应屏幕高度或宽度
    if ( e.key === 'r' || e.key === 'R' ) {
      if ( this.va && this.va.file_annotator[0] && this.va.file_annotator[0][0] ) {
        e.preventDefault();
        this.va.file_annotator[0][0]._zoom_fit_screen();
        return;
      }
    }
    // W 键：激活拖拽平移
    if ( e.key === 'w' || e.key === 'W' ) {
      e.preventDefault();
      if ( this.cp ) {
        this.cp._activate_hand_mode();
      }
      return;
    }
    // Backspace 键：移除当前文件
    if ( e.key === 'Backspace' ) {
      e.preventDefault();
      if ( this.d && this.va && this.va.vid ) {
        this.d.view_del(this.va.vid).then(function(ok) {
          _via_util_msg_show('已移除当前文件');
        }, function(err) {
          _via_util_msg_show('移除文件失败', true);
        });
      }
      return;
    }
    // Delete 键：删除已选中的绘制图形
    if ( e.key === 'Delete' ) {
      e.preventDefault();
      if ( this.va && this.va.file_annotator[0] && this.va.file_annotator[0][0] ) {
        var fa = this.va.file_annotator[0][0];
        if ( fa.selected_mid_list && fa.selected_mid_list.length ) {
          fa._creg_del_sel_regions();
          _via_util_msg_show('已删除选中图形');
        } else if ( fa.last_added_mid_list && fa.last_added_mid_list.length ) {
          // 无选中时删除最后添加的图形
          var last_mid = fa.last_added_mid_list.pop();
          fa._creg_select(last_mid);
          fa._creg_del_sel_regions();
          _via_util_msg_show('已删除最后添加的图形');
        } else {
          _via_util_msg_show('没有可删除的图形', true);
        }
      }
      return;
    }
    // 大键盘数字键 1-9：选择绘制形状（按左侧边栏顺序：矩形→极端矩形→圆形→极端圆形→椭圆→线条→多边形→折线→点）
    var shape_key_map = {
      '1': 'RECTANGLE',
      '2': 'EXTREME_RECTANGLE',
      '3': 'CIRCLE',
      '4': 'EXTREME_CIRCLE',
      '5': 'ELLIPSE',
      '6': 'LINE',
      '7': 'POLYGON',
      '8': 'POLYLINE',
      '9': 'POINT',
    };
    if ( shape_key_map.hasOwnProperty(e.key) ) {
      e.preventDefault();
      if ( this.cp ) {
        this.cp._set_region_shape(shape_key_map[e.key]);
      }
      return;
    }
    this.va._on_event_keydown(e);
  }
}

_via.prototype._render_shortcut_overlay = function() {
  if ( !this.shortcut_overlay ) {
    this.shortcut_overlay = document.createElement('div');
    this.shortcut_overlay.setAttribute('id', 'via_shortcut_overlay');
    this.shortcut_overlay.innerHTML =
      '<div class="shortcut_title">快捷键</div>' +
      '<div class="shortcut_row"><span class="key">r</span> 适应屏幕</div>' +
      '<div class="shortcut_row"><span class="key">w</span> 拖拽平移</div>' +
      '<div class="shortcut_row"><span class="key">a</span>/<span class="key">d</span> 切换文件</div>' +
      '<div class="shortcut_row"><span class="key">1</span>-<span class="key">9</span> 选择形状</div>' +
      '<div class="shortcut_row"><span class="key">Backspace</span> 移除当前文件</div>' +
      '<div class="shortcut_row"><span class="key">Delete</span> 删除选中图形</div>';
  }
  // 视图渲染会清空容器，每次都重新挂载
  if ( this.view_container && !this.view_container.contains(this.shortcut_overlay) ) {
    this.view_container.appendChild(this.shortcut_overlay);
  }
}

// 视图切换后，把手模式状态同步到新建的 file_annotator
_via.prototype._sync_hand_mode = function() {
  if ( this.cp ) {
    this.cp._set_hand_mode_ui(this.cp.hand_selected);
  }
}

// 左下角类别浮窗：展示所有类别，点击选中
_via.prototype._render_category_overlay = function() {
  if ( !this.category ) return;
  var categories = this.category.get_categories();
  var overlay = this.category_overlay;
  if ( !overlay ) {
    overlay = document.createElement('div');
    overlay.setAttribute('id', 'via_category_overlay');
    overlay.innerHTML = '<div class="category_title">类别</div><div class="category_list"></div>';
    this.category_overlay = overlay;
  }
  // 视图渲染会清空容器，若浮窗不在 DOM 则重新挂载
  if ( this.view_container && !this.view_container.contains(overlay) ) {
    this.view_container.appendChild(overlay);
  }
  var list = overlay.querySelector('.category_list');
  list.innerHTML = '';
  if ( !categories.length ) {
    list.innerHTML = '<div class="category_empty">暂无类别，请在右侧边栏创建</div>';
    return;
  }
  var selected = this.category.selected;
  var self = this;
  for ( var i = 0; i < categories.length; ++i ) {
    var cat = categories[i];
    var item = document.createElement('div');
    item.setAttribute('class', 'category_item' + (cat.id === selected ? ' category_active' : ''));
    item.setAttribute('data-oid', cat.id);
    item.innerHTML = '<span class="category_dot" style="background:' + cat.color + '"></span><span class="category_name">' + this._escape_html(cat.name) + '</span>';
    item.addEventListener('click', (function(oid) {
      return function() {
        self.category.select(oid);
      };
    })(cat.id));
    list.appendChild(item);
  }
}

_via.prototype._escape_html = function(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
