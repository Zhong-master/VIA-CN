/**
 *
 * @class
 * @classdesc VIA Control Panel
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 16 May 2019
 *
 */

function _via_control_panel(control_panel_container, via) {
  this._ID = '_via_control_panel_';
  this.c   = control_panel_container;
  this.via = via;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this._init();
}

_via_control_panel.prototype._init = function(type) {
  this.c.innerHTML = '';

  var logo_panel = document.createElement('div');
  logo_panel.setAttribute('class', 'logo');
  logo_panel.innerHTML = '<a href="http://www.robots.ox.ac.uk/~vgg/software/via/" title="VGG Image Annotator (VIA)" target="_blank">VIA</a>'
  this.c.appendChild(logo_panel);

  this.c.appendChild(this.via.vm.c);
  this._add_view_manager_tools();

  this._add_spacer();

  this._add_project_tools();

  this._add_spacer();

}

_via_control_panel.prototype._add_spacer = function() {
  var spacer = document.createElement('div');
  spacer.setAttribute('class', 'spacer');
  this.c.appendChild(spacer);
}

_via_control_panel.prototype._add_view_manager_tools = function() {
  var add_media_local = _via_util_get_svg_button('micon_add_circle', '添加本地音频或视频文件', 'add_media_local');
  add_media_local.addEventListener('click', this.via.vm._on_add_media_local.bind(this.via.vm));
  this.c.appendChild(add_media_local);

  var add_media_bulk = _via_util_get_svg_button('micon_lib_add', '批量添加文件地址（每行一个，支持本地/远程文件）', 'add_media_bulk');
  //add_media_bulk.addEventListener('click', this.via.vm._on_add_media_bulk.bind(this.via.vm));
  add_media_bulk.addEventListener('click', function() {
    var action_map = {
      'via_page_fileuri_button_bulk_add':this._page_on_action_fileuri_bulk_add.bind(this),
    }
    _via_util_page_show('page_fileuri_bulk_add', action_map);
  }.bind(this));
  this.c.appendChild(add_media_bulk);

  var del_view = _via_util_get_svg_button('micon_remove_circle', '移除当前文件', 'remove_media');
  del_view.addEventListener('click', this.via.vm._on_del_view.bind(this.via.vm));
  this.c.appendChild(del_view);
}

_via_control_panel.prototype._add_region_shape_selector = function() {
  if ( document.getElementById('shape_point') === null ) {
    return;
  }

  // 形状选择器移到左侧边栏
  var sidebar = document.getElementById('via_left_sidebar');
  if ( !sidebar ) {
    sidebar = this.via.left_sidebar;
  }
  sidebar.innerHTML = '';

  // 工具组（左侧边栏顶部）：适应屏幕 + 手（拖拽平移）
  var zoom_group = document.createElement('div');
  zoom_group.setAttribute('class', 'sidebar_group');

  var fit_screen = _via_util_get_svg_button('micon_fit_screen', '适应屏幕高度或宽度');
  fit_screen.addEventListener('click', function() {
    this.emit_event( 'fit_screen', {}); // control_panel -> view_annotator (bound in _via.js)
  }.bind(this));
  zoom_group.appendChild(fit_screen);

  var hand = _via_util_get_svg_button('micon_hand', '拖拽平移（点击切换）', 'hand_tool');
  hand.addEventListener('click', function() {
    if ( this.hand_selected ) {
      // 已选中：退出手模式，恢复默认矩形
      this._set_hand_mode_ui(false);
      this._set_region_shape('RECTANGLE');
    } else {
      this._activate_hand_mode();
    }
  }.bind(this));
  this.hand_button = hand;
  this.hand_selected = false;
  zoom_group.appendChild(hand);

  sidebar.appendChild(zoom_group);

  // 分割线
  var divider = document.createElement('div');
  divider.setAttribute('class', 'sidebar_divider');
  sidebar.appendChild(divider);

  // 形状选择器
  var shape_group = document.createElement('div');
  shape_group.setAttribute('class', 'sidebar_group');

  var rect = _via_util_get_svg_button('shape_rectangle', '矩形', 'RECTANGLE');
  rect.addEventListener('click', function() {
    this._set_region_shape('RECTANGLE');
  }.bind(this));
  shape_group.appendChild(rect);

  var extreme_rect = _via_util_get_svg_button('shape_extreme_rectangle', '极端矩形：沿矩形物体边界定义四个点', 'EXTREME_RECTANGLE');
  extreme_rect.classList.add('shape_selector');
  extreme_rect.addEventListener('click', function() {
    this._set_region_shape('EXTREME_RECTANGLE');
  }.bind(this));
  shape_group.appendChild(extreme_rect);

  var circle = _via_util_get_svg_button('shape_circle', '圆形', 'CIRCLE');
  circle.addEventListener('click', function() {
    this._set_region_shape('CIRCLE');
  }.bind(this));
  shape_group.appendChild(circle);

  var extreme_circle = _via_util_get_svg_button('shape_extreme_circle', '极端圆形：沿圆形物体圆周定义任意三个点', 'EXTREME_CIRCLE');
  extreme_circle.addEventListener('click', function() {
    this._set_region_shape('EXTREME_CIRCLE');
  }.bind(this));
  shape_group.appendChild(extreme_circle);

  var ellipse = _via_util_get_svg_button('shape_ellipse', '椭圆', 'ELLIPSE');
  ellipse.addEventListener('click', function() {
    this._set_region_shape('ELLIPSE');
  }.bind(this));
  shape_group.appendChild(ellipse);

  var line = _via_util_get_svg_button('shape_line', '线条', 'LINE');
  line.addEventListener('click', function() {
    this._set_region_shape('LINE');
  }.bind(this));
  shape_group.appendChild(line);

  var polygon = _via_util_get_svg_button('shape_polygon', '多边形', 'POLYGON');
  polygon.addEventListener('click', function() {
    this._set_region_shape('POLYGON');
  }.bind(this));
  shape_group.appendChild(polygon);

  var polyline = _via_util_get_svg_button('shape_polyline', '折线', 'POLYLINE');
  polyline.addEventListener('click', function() {
    this._set_region_shape('POLYLINE');
  }.bind(this));
  shape_group.appendChild(polyline);

  var point = _via_util_get_svg_button('shape_point', '点', 'POINT');
  point.addEventListener('click', function() {
    this._set_region_shape('POINT');
  }.bind(this));
  shape_group.appendChild(point);

  sidebar.appendChild(shape_group);

  this.shape_selector_list = { 'POINT':point, 'RECTANGLE':rect, 'EXTREME_RECTANGLE':extreme_rect, 'CIRCLE':circle, 'EXTREME_CIRCLE':extreme_circle, 'ELLIPSE':ellipse, 'LINE':line, 'POLYGON':polygon, 'POLYLINE':polyline };
}

_via_control_panel.prototype._set_region_shape = function(shape) {
  // 选择形状时退出拖拽手模式（单选互斥）
  if ( this.hand_selected ) {
    this._set_hand_mode_ui(false);
  }
  this.emit_event( 'region_shape', {'shape':shape});
  for ( var si in this.shape_selector_list ) {
    if ( si === shape ) {
      this.shape_selector_list[si].classList.add('svg_button_selected');
    } else {
      this.shape_selector_list[si].classList.remove('svg_button_selected');
    }
  }
}

// 清除所有形状按钮的选中状态（用于默认选中手模式）
_via_control_panel.prototype._clear_shape_selection = function() {
  if ( this.shape_selector_list ) {
    for ( var si in this.shape_selector_list ) {
      this.shape_selector_list[si].classList.remove('svg_button_selected');
    }
  }
}

// 手按钮选中状态 UI：高亮/取消高亮，并同步拖拽模式
_via_control_panel.prototype._set_hand_mode_ui = function(selected) {
  this.hand_selected = selected;
  if ( this.hand_button ) {
    if ( selected ) {
      this.hand_button.classList.add('svg_button_selected');
    } else {
      this.hand_button.classList.remove('svg_button_selected');
    }
  }
  // 同步 via 状态与 file_annotator 拖拽模式
  if ( this.via ) {
    this.via.hand_mode = selected;
  }
  if ( this.via.va && this.via.va.file_annotator[0] && this.via.va.file_annotator[0][0] ) {
    this.via.va.file_annotator[0][0]._set_hand_mode(selected);
  }
}

// 激活拖拽手模式：高亮手按钮，取消所有形状选中
_via_control_panel.prototype._activate_hand_mode = function() {
  if ( this.hand_selected ) {
    return;
  }
  this._set_hand_mode_ui(true);
  if ( this.shape_selector_list ) {
    for ( var si in this.shape_selector_list ) {
      this.shape_selector_list[si].classList.remove('svg_button_selected');
    }
  }
  this.emit_event( 'hand_toggle', {});
}

_via_control_panel.prototype._add_project_tools = function() {
  var load = _via_util_get_svg_button('micon_open', '打开 VIA 项目');
  load.addEventListener('click', function() {
    _via_util_file_select_local(_VIA_FILE_SELECT_TYPE.JSON, this._project_load_on_local_file_select.bind(this), false);
  }.bind(this));
  this.c.appendChild(load);

  var save = _via_util_get_svg_button('micon_save', '保存当前 VIA 项目');
  save.addEventListener('click', function() {
    this.via.d.project_save();
  }.bind(this));
  this.c.appendChild(save);

  var import_export_annotation = _via_util_get_svg_button('micon_import_export', '导入或导出标注');
  import_export_annotation.addEventListener('click', this._page_show_import_export.bind(this));
  this.c.appendChild(import_export_annotation);
}

_via_control_panel.prototype._page_show_import_export = function(d) {
  var action_map = {
    'via_page_button_import':this._page_on_action_import.bind(this),
    'via_page_button_export':this._page_on_action_export.bind(this),
  }
  _via_util_page_show('page_import_export', action_map);
}

_via_control_panel.prototype._page_on_action_import = function(d) {
  if ( d._action_id === 'via_page_button_import' ) {
    if ( d.via_page_import_pid !== '' ) {
      this.via.s._project_pull(d.via_page_import_pid).then( function(remote_rev) {
        try {
          var project = JSON.parse(remote_rev);
          // clear remote project identifiers
          project.project.pid = _VIA_PROJECT_ID_MARKER;
          project.project.rev = _VIA_PROJECT_REV_ID_MARKER;
          project.project.rev_timestamp = _VIA_PROJECT_REV_TIMESTAMP_MARKER;
          this.via.d.project_load_json(project);
        }
        catch(e) {
          _via_util_msg_show('服务器响应格式错误：' + e);
        }
      }.bind(this), function(err) {
        _via_util_msg_show(err + ': ' + d.via_page_import_pid);
      }.bind(this));
      return;
    }

    if ( d.via_page_import_via2_project_json.length === 1 ) {
      _via_util_load_text_file(d.via_page_import_via2_project_json[0],
                               this._project_import_via2_on_local_file_read.bind(this)
                              );
      return;
    }
    _via_util_msg_show('要导入共享项目，必须输入其项目 ID。');
  }
}

_via_control_panel.prototype._page_on_action_export = function(d) {
  if ( d._action_id === 'via_page_button_export' ) {
    this.via.ie.export_to_file(d.via_page_export_format);
  }
}

_via_control_panel.prototype._project_load_on_local_file_select = function(e) {
  if ( e.target.files.length === 1 ) {
    _via_util_load_text_file(e.target.files[0], this._project_load_on_local_file_read.bind(this));
  }
}

_via_control_panel.prototype._project_load_on_local_file_read = function(project_data_str) {
  this.via.d.project_load(project_data_str);
}

_via_control_panel.prototype._project_import_via2_on_local_file_read = function(project_data_str) {
  this.via.d.project_import_via2_json(project_data_str);
}

_via_control_panel.prototype._page_on_action_fileuri_bulk_add = function(d) {
  if ( d.via_page_fileuri_urilist.length ) {
    this.fileuri_bulk_add_from_url_list(d.via_page_fileuri_urilist);
  }

  if ( d.via_page_fileuri_importfile.length === 1 ) {
    switch( parseInt(d.via_page_fileuri_filetype) ) {
    case _VIA_FILE_TYPE.IMAGE:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_image_from_file.bind(this));
      break;
    case _VIA_FILE_TYPE.AUDIO:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_audio_from_file.bind(this));
      break;
    case _VIA_FILE_TYPE.VIDEO:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_video_from_file.bind(this));
      break;
    default:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_auto_from_file.bind(this));
    }

  }
}

_via_control_panel.prototype.fileuri_bulk_add_image_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, _VIA_FILE_TYPE.IMAGE);
}

_via_control_panel.prototype.fileuri_bulk_add_audio_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, _VIA_FILE_TYPE.AUDIO);
}

_via_control_panel.prototype.fileuri_bulk_add_video_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, _VIA_FILE_TYPE.VIDEO);
}

_via_control_panel.prototype.fileuri_bulk_add_auto_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, 0);
}

_via_control_panel.prototype.fileuri_bulk_add_from_url_list = function(uri_list_str, type) {
  var uri_list = uri_list_str.split('\n');
  if ( uri_list.length ) {
    var filelist = [];
    for ( var i = 0; i < uri_list.length; ++i ) {
      if ( uri_list[i] === '' ||
           uri_list[i] === ' ' ||
           uri_list[i] === '\n'
         ) {
        continue; // skip
      }
      var filetype;
      if ( type === 0 || typeof(type) === 'undefined' ) {
        filetype = _via_util_infer_file_type_from_filename(uri_list[i]);
      } else {
        filetype = type;
      }

      filelist.push({ 'fname':uri_list[i],
                      'type':filetype,
                      'loc':_via_util_infer_file_loc_from_filename(uri_list[i]),
                      'src':uri_list[i],
                    });
    }
    this.via.vm._file_add_from_filelist(filelist);
  }
}
