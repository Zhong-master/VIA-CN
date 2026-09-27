/**
 * @class
 * @classdesc 基于浏览器 localStorage 的标注自动保存 / 恢复
 *
 * 与 VIA 3.0.13 的数据模型（this.d.store = 项目 JSON）对齐：
 *  - 任何会改变项目内容的事件都会触发一次防抖保存
 *  - 只保存项目结构（文件信息、视图、属性、类别、标注），不保存本地图片的二进制内容
 *  - 下次打开页面时自动恢复上次会话，避免刷新丢失标注
 *
 * @author VIA-CN
 */

'use strict'

function _via_store_localstorage(data) {
  this.d = data;
  this.STORE_KEY = '_via_cn_project';
  this.STORE_TS_KEY = '_via_cn_project_ts';
  this.SAVE_DELAY = 500; // ms, 防抖

  this.available = false;
  this._save_timer = null;

  // 这些事件意味着项目内容发生了变化
  this._event_list = ['metadata_add', 'metadata_update', 'metadata_add_bulk',
                      'metadata_update_bulk', 'metadata_delete', 'metadata_delete_bulk',
                      'metadata_delete_all', 'attribute_add', 'attribute_del',
                      'attribute_update', 'file_add', 'file_update', 'view_add',
                      'view_bulk_add', 'view_del', 'project_updated'];
}

// 不同标注器（图片/视频/音频/成对）使用各自独立的存储键，
// 避免在同一个域名下把图片项目恢复进视频/成对页面
_via_store_localstorage.prototype._page_type = function() {
  var links = document.querySelectorAll('link[rel="stylesheet"]');
  for ( var i = 0; i < links.length; ++i ) {
    var href = links[i].getAttribute('href') || '';
    var m = href.match(/via_([a-z]+)_annotator\.css/);
    if ( m ) {
      return m[1];
    }
  }
  return 'default';
}

_via_store_localstorage.prototype._init = function() {
  var page_type = this._page_type();
  this.STORE_KEY = '_via_cn_project_' + page_type;
  this.STORE_TS_KEY = '_via_cn_project_ts_' + page_type;

  this.available = this.is_store_available();
  if ( this.available ) {
    for ( var i = 0; i < this._event_list.length; ++i ) {
      this.d.on_event(this._event_list[i], '_via_store_localstorage_',
                      this._schedule_save.bind(this));
    }
  }
  return this.available;
}

// source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
_via_store_localstorage.prototype.is_store_available = function() {
  try {
    var storage = window['localStorage'];
    var x = '__via_storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return false;
  }
}

// 事件触发后延迟保存，避免连续操作时频繁写入
_via_store_localstorage.prototype._schedule_save = function() {
  if ( !this.available ) {
    return;
  }
  if ( this._save_timer ) {
    clearTimeout(this._save_timer);
  }
  this._save_timer = setTimeout( function() {
    this._save_timer = null;
    this.save();
  }.bind(this), this.SAVE_DELAY);
}

// 返回可安全序列化的项目副本：去掉本地/内嵌媒体的二进制内容
_via_store_localstorage.prototype._serializable_store = function() {
  var copy = JSON.parse(JSON.stringify(this.d.store));
  for ( var fid in copy.file ) {
    var f = copy.file[fid];
    if ( f.loc === _VIA_FILE_LOC.LOCAL || f.loc === _VIA_FILE_LOC.INLINE ) {
      f.src = '';
    }
  }
  return copy;
}

_via_store_localstorage.prototype.save = function() {
  if ( !this.available ) {
    return false;
  }
  // 空项目不保存，避免下次打开时“恢复”出一个空会话
  var file_count = this.d.store.file ? Object.keys(this.d.store.file).length : 0;
  var metadata_count = this.d.store.metadata ? Object.keys(this.d.store.metadata).length : 0;
  if ( file_count === 0 && metadata_count === 0 ) {
    return false;
  }
  try {
    var project_str = JSON.stringify(this._serializable_store());
    window.localStorage.setItem(this.STORE_KEY, project_str);
    window.localStorage.setItem(this.STORE_TS_KEY, String(Date.now()));
    return true;
  }
  catch(e) {
    // 多为超出配额：清掉旧副本，避免反复失败拖慢页面
    try {
      this.clear();
    }
    catch(e2) {}
    console.warn('本地自动保存失败（可能是存储配额不足）：' + e);
    return false;
  }
}

_via_store_localstorage.prototype.load = function() {
  if ( !this.available ) {
    return null;
  }
  var project_str = window.localStorage.getItem(this.STORE_KEY);
  if ( !project_str ) {
    return null;
  }
  try {
    return JSON.parse(project_str);
  }
  catch(e) {
    console.warn('本地自动保存的数据已损坏，已忽略：' + e);
    this.clear();
    return null;
  }
}

_via_store_localstorage.prototype.timestamp = function() {
  if ( !this.available ) {
    return 0;
  }
  var t = window.localStorage.getItem(this.STORE_TS_KEY);
  return t ? parseInt(t, 10) : 0;
}

_via_store_localstorage.prototype.clear = function() {
  if ( !this.available ) {
    return;
  }
  window.localStorage.removeItem(this.STORE_KEY);
  window.localStorage.removeItem(this.STORE_TS_KEY);
}
