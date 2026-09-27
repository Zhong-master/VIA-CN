/**
 *
 * @class
 * @classdesc View manager
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 5 Apr. 2019
 *
 */

'use strict';

function _via_view_manager(data, view_annotator, container) {
  this._ID = '_via_view_manager_';
  this.d = data;
  this.va = view_annotator;
  this.c = container;

  this.view_selector_vid_list = [];
  var is_view_filtered_by_regex = false;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this.d.on_event('project_loaded', this._ID, this._on_event_project_loaded.bind(this));
  this.d.on_event('project_updated', this._ID, this._on_event_project_updated.bind(this));
  this.d.on_event('view_bulk_add', this._ID, this._on_event_view_bulk_add.bind(this));
  this.d.on_event('view_del', this._ID, this._on_event_view_del.bind(this));
  this.va.on_event('view_show', this._ID, this._on_event_view_show.bind(this));
  this.va.on_event('view_next', this._ID, this._on_event_view_next.bind(this));
  this.va.on_event('view_prev', this._ID, this._on_event_view_prev.bind(this));
  this.d.on_event('metadata_add', this._ID, this._on_event_metadata_change.bind(this));
  this.d.on_event('metadata_update', this._ID, this._on_event_metadata_change.bind(this));
  this.d.on_event('metadata_update_bulk', this._ID, this._on_event_metadata_change.bind(this));
  this.d.on_event('metadata_delete_bulk', this._ID, this._on_event_metadata_change.bind(this));
  this.d.on_event('metadata_delete_all', this._ID, this._on_event_metadata_change.bind(this));

  this._init_ui_elements();
}

_via_view_manager.prototype._init = function() {
  this._init_ui_elements();
  this._view_selector_update();
}

_via_view_manager.prototype._init_ui_elements = function() {
  this.pname = document.createElement('input');
  this.pname.setAttribute('type', 'text');
  this.pname.setAttribute('id', 'via_project_name_input');
  this.pname.setAttribute('value', this.d.store.project.pname);
  this.pname.setAttribute('title', '项目名称（点击修改）');
  this.pname.addEventListener('change', this._on_pname_change.bind(this));

  // 文件切换改用底部缩略图栏，不再使用下拉框和搜索框
  this.c.innerHTML = '';
  this.c.appendChild(this.pname);
}

//
// UI elements change listeners
//
_via_view_manager.prototype._on_pname_change = function(e) {
  this.d.store.project.pname = e.target.value.trim();
}

_via_view_manager.prototype._on_next_view = function() {
  if ( this.view_selector_vid_list.length ) {
    var vindex = this.view_selector_vid_list.indexOf(this.va.vid);
    var next_vindex = (vindex + 1) % this.view_selector_vid_list.length;
    this.va.view_show( this.view_selector_vid_list[next_vindex] );
  }
}

_via_view_manager.prototype._on_prev_view = function() {
  if ( this.view_selector_vid_list.length ) {
    var vindex = this.view_selector_vid_list.indexOf(this.va.vid);
    var prev_vindex = vindex - 1;
    if ( prev_vindex < 0 ) {
      prev_vindex = this.view_selector_vid_list.length - 1;
    }
    this.va.view_show( this.view_selector_vid_list[prev_vindex] );
  }
}

_via_view_manager.prototype._on_event_view_show = function(data, event_payload) {
  var vid = event_payload.vid.toString();
  this._thumbnail_bar_highlight(vid);
}

_via_view_manager.prototype._on_event_view_next = function(data, event_payload) {
  this._on_next_view();
}

_via_view_manager.prototype._on_event_view_prev = function(data, event_payload) {
  this._on_prev_view();
}

_via_view_manager.prototype._on_event_project_loaded = function(data, event_payload) {
  this._init_ui_elements();
  this._view_selector_update();
  if ( this.d.store.project.vid_list.length ) {
    // 从末尾向前找第一个已标注的视图；无则回退第一个
    var last_annot_vid = null;
    for ( var i = this.d.store.project.vid_list.length - 1; i >= 0; --i ) {
      var vid = this.d.store.project.vid_list[i];
      var mid_list = this.d.cache.mid_list[vid];
      if ( mid_list && mid_list.length ) {
        last_annot_vid = vid;
        break;
      }
    }
    this.va.view_show( last_annot_vid || this.d.store.project.vid_list[0] );
  }
}

_via_view_manager.prototype._on_event_project_updated = function(data, event_payload) {
  var current_vid = this.va.vid;
  this._init_ui_elements();
  this._view_selector_update();
  if ( this.d.store.project.vid_list.length ) {
    if ( current_vid in this.d.store.project.vid_list ) {
      this.va.view_show( current_vid );
    } else {
      // show first view by default
      this.va.view_show( this.d.store.project.vid_list[0] );
    }
  }
}

_via_view_manager.prototype._on_event_metadata_change = function(data, event_payload) {
  // 标注增删：重绘缩略图栏以更新边框色，并恢复当前视图高亮
  this._thumbnail_bar_update();
  if ( this.va.vid ) {
    this._thumbnail_bar_highlight(this.va.vid);
  }
}

_via_view_manager.prototype._view_selector_update = function() {
  // 文件切换已改用底部缩略图栏
  this._thumbnail_bar_update();
}

//
// 底部缩略图栏
//
_via_view_manager.prototype._bind_thumbnail_bar = function(container) {
  this.thumbnail_bar = container;
}

_via_view_manager.prototype._thumbnail_bar_update = function() {
  if ( !this.thumbnail_bar ) {
    return;
  }
  this.thumbnail_bar.innerHTML = '';
  this.view_selector_vid_list = [];

  var vid_list = this.d.store.project.vid_list;
  for ( var vindex = 0; vindex < vid_list.length; ++vindex ) {
    var vid = vid_list[vindex];
    this.view_selector_vid_list.push(vid);
    this.thumbnail_bar.appendChild( this._thumbnail_bar_item(vindex, vid) );
  }
}

_via_view_manager.prototype._thumbnail_annot_state = function(vid) {
  var mid_list = this.d.cache.mid_list[vid];
  if ( !mid_list || !mid_list.length ) {
    return '';                                   // 无标注
  }
  for ( var i = 0; i < mid_list.length; ++i ) {
    if ( !this.d.store.metadata.hasOwnProperty(mid_list[i]) ) {
      continue;
    }
    var av = this.d.store.metadata[mid_list[i]].av;
    for ( var aid in av ) {
      return 'thumbnail_annot';                  // 有属性 → 绿
    }
  }
  return 'thumbnail_annot_partial';              // 仅画框 → 黄
}

_via_view_manager.prototype._thumbnail_bar_item = function(vindex, vid) {
  var card = document.createElement('div');
  card.setAttribute('class', 'thumbnail_card');
  card.setAttribute('data-vid', vid);

  var annot_state = this._thumbnail_annot_state(vid);
  if ( annot_state ) {
    card.classList.add(annot_state);
  }

  var file_count = this.d.store.view[vid].fid_list.length;
  var fid = this.d.store.view[vid].fid_list[0];
  var ftype = this.d.store.file[fid].type;
  var fname = this.d.store.file[fid].fname;

  var media_box = document.createElement('div');
  media_box.setAttribute('class', 'thumbnail_media');

  try {
    var src = this.d.file_get_src(fid);
    if ( ftype === _VIA_FILE_TYPE.IMAGE ) {
      var img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('loading', 'lazy');
      img.alt = '';
      media_box.appendChild(img);
    } else if ( ftype === _VIA_FILE_TYPE.VIDEO ) {
      var video = document.createElement('video');
      video.setAttribute('src', src);
      video.setAttribute('preload', 'metadata');
      video.setAttribute('muted', 'true');
      video.alt = '';
      media_box.appendChild(video);
      // 尝试加载第一帧
      video.addEventListener('loadeddata', function() {
        this.currentTime = 0.1;
      });
    } else {
      // 音频：显示图标
      media_box.innerHTML = '<svg class="thumbnail_audio_icon" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
    }
  } catch(e) {
    media_box.innerHTML = '<span class="thumbnail_error">?</span>';
  }

  var label = document.createElement('div');
  label.setAttribute('class', 'thumbnail_label');
  var display_name = fname;
  try { display_name = decodeURI(fname); } catch(e) {}
  label.innerHTML = (parseInt(vindex)+1) + '. ' + display_name;
  label.setAttribute('title', display_name);

  card.appendChild(media_box);
  card.appendChild(label);

  var self = this;
  card.addEventListener('click', function() {
    self.va.view_show(this.getAttribute('data-vid'));
  });
  return card;
}

_via_view_manager.prototype._thumbnail_bar_highlight = function(vid) {
  if ( !this.thumbnail_bar ) {
    return;
  }
  var cards = this.thumbnail_bar.querySelectorAll('.thumbnail_card');
  for ( var i = 0; i < cards.length; ++i ) {
    if ( cards[i].getAttribute('data-vid') === vid ) {
      cards[i].classList.add('thumbnail_active');
      // 自动滚动到底栏，使当前选中缩略图可见（居中）
      if ( this.thumbnail_bar.scrollTo ) {
        var card_left = cards[i].offsetLeft;
        var card_w = cards[i].offsetWidth;
        var bar_w = this.thumbnail_bar.clientWidth;
        this.thumbnail_bar.scrollTo({
          left: card_left - (bar_w - card_w) / 2,
          behavior: 'smooth'
        });
      }
    } else {
      cards[i].classList.remove('thumbnail_active');
    }
  }
}

_via_view_manager.prototype._file_add_from_filelist = function(filelist) {
  this.d.view_bulk_add_from_filelist(filelist).then( function(ok) {
    var filetype_summary = {};
    var fid, ftype_str;
    for ( var findex in ok.fid_list ) {
      fid = ok.fid_list[findex];
      ftype_str = _via_util_file_type_to_str( this.d.store.file[fid].type );
      if ( ! filetype_summary.hasOwnProperty(ftype_str) ) {
        filetype_summary[ftype_str] = 0;
      }
      filetype_summary[ftype_str] = filetype_summary[ftype_str] + 1;
    }
    _via_util_msg_show('已添加 ' + ok.fid_list.length + ' 个文件。' + JSON.stringify(filetype_summary));
  }.bind(this), function(err) {
    _via_util_msg_show('添加文件失败！[' + err + ']');
    console.warn(err);
  }.bind(this));
}

_via_view_manager.prototype._on_add_media_local = function() {
  _via_util_file_select_local(_VIA_FILE_SELECT_TYPE.IMAGE | _VIA_FILE_SELECT_TYPE.VIDEO | _VIA_FILE_SELECT_TYPE.AUDIO,
                              this._file_add_local.bind(this),
                              true);
}

_via_view_manager.prototype._file_add_local = function(e) {
  var files = e.target.files;
  var filelist = [];
  for ( var findex = 0; findex < files.length; ++findex ) {
    filelist.push({ 'fname':files[findex].name,
                    'type':_via_util_infer_file_type_from_filename(files[findex].name),
                    'loc':_VIA_FILE_LOC.LOCAL,
                    'src':files[findex],
                  });
  }
  this._file_add_from_filelist(filelist);
}

_via_view_manager.prototype._on_event_view_bulk_add = function(data, event_payload) {
  this._view_selector_update();
  this.d._cache_update();
  if ( event_payload.vid_list.length ) {
    this.va.view_show( event_payload.vid_list[0] );
  }
}

_via_view_manager.prototype._on_add_media_remote = function() {
  var url = window.prompt('Enter URL of an image, audio or video (e.g. http://www....)',
                          '');
  var filelist = [ {'fname':url,
                    'type':_via_util_infer_file_type_from_filename(url),
                    'loc':_VIA_FILE_LOC.URIHTTP,
                    'src':url,
                   }
                 ];

  this._file_add_from_filelist(filelist);
}

_via_view_manager.prototype._on_add_media_bulk = function() {
  _via_util_file_select_local(_VIA_FILE_SELECT_TYPE.TEXT,
                              this._on_add_media_bulk_file_selected.bind(this), false);
}

_via_view_manager.prototype._on_add_media_bulk_file_selected = function(e) {
  if ( e.target.files.length ) {
    _via_util_load_text_file(e.target.files[0], this._on_add_media_bulk_file_load.bind(this));
  }
}

_via_view_manager.prototype._on_add_media_bulk_file_load = function(file_data) {
  var url_list = file_data.split('\n');
  if ( url_list.length ) {
    var filelist = [];
    for ( var i = 0; i < url_list.length; ++i ) {
      if ( url_list[i] === '' ||
           url_list[i] === ' ' ||
           url_list[i] === '\n'
         ) {
        continue; // skip
      }
      filelist.push({ 'fname':url_list[i],
                      'type':_via_util_infer_file_type_from_filename(url_list[i]),
                      'loc':_via_util_infer_file_loc_from_filename(url_list[i]),
                      'src':url_list[i],
                    });
    }
    this._file_add_from_filelist(filelist);
  }
}

_via_view_manager.prototype._on_del_view = function() {
  this.d.view_del(this.va.vid).then( function(ok) {
    _via_util_msg_show('已删除视图 ' + ( parseInt(ok.vindex) + 1));
  }.bind(this), function(err) {
    console.warn(err);
  }.bind(this));
}

_via_view_manager.prototype._on_event_view_del = function(data, event_payload) {
  this._view_selector_update();
  var vindex = event_payload.vindex;
  if ( this.d.store.project.vid_list.length ) {
    if ( vindex < this.d.store.project.vid_list.length ) {
      this.va.view_show( this.d.store.project.vid_list[vindex] );
    } else {
      this.va.view_show( this.d.store.project.vid_list[ this.d.store.project.vid_list.length - 1 ] );
    }
  } else {
    this.va._init();
  }
}
