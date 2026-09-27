/**
 * @class
 * @classdesc VIA 类别管理器（图像分类/目标检测/图像分割）
 *
 * 类别复用 VIA 的 SELECT 属性机制：
 *  - 一个锚点为空间区域(FILE1_Z0_XY1)的 SELECT 属性承载所有类别
 *  - 该属性的 options = {oid: 类别名}
 *  - 类别颜色存放在 config.ui.category_colors = {oid: '#rrggbb'}
 *  - 当前选中类别存 config.ui.category_selected
 */

'use strict'

// 标注类型
const _VIA_CATEGORY_TYPE = { 'CLASSIFICATION':0, 'DETECTION':1, 'SEGMENTATION':2 };

function _via_category(via) {
  this._ID = '_via_category_';
  this.via = via;
  this.d = via.d;

  this.category_aid = null;         // 类别 SELECT 属性的 aid
  this.category_colors = {};        // { oid: color }
  this.category_types = {};         // { oid: type }
  this.selected = null;             // 当前选中类别 id
}

// 确保类别属性存在（若无则创建）
_via_category.prototype.init = function() {
  var self = this;
  return new Promise(function(ok, err) {
    var cfg = self.d.store.config.ui;
    if ( cfg.hasOwnProperty('category_aid') && cfg.category_aid ) {
      self.category_aid = cfg.category_aid;
      if ( self.d.store.attribute.hasOwnProperty(self.category_aid) ) {
        self._load();
        ok();
        return;
      }
    }
    // 类别属性的锚点取决于标注器类型：
    //  - 成对比较：属性作用于“一组文件”
    //  - 图片/视频：属性作用于单个文件中的空间区域
    var anchor_id = 'FILE1_Z0_XY1';
    if ( document.querySelector('link[href*="via_pair_annotator.css"]') ) {
      anchor_id = 'FILEN_Z0_XY0';
    }
    // 创建类别属性
    self.d.attribute_add('类别', anchor_id, _VIA_ATTRIBUTE_TYPE.SELECT, '标注类别', {}, '').then(function(aid) {
      self.category_aid = aid;
      self.d.store.config.ui.category_aid = aid;
      self.d.store.config.ui.category_colors = {};
      self.d.store.config.ui.category_types = {};
      self.d.store.config.ui.category_selected = '';
      self._load();
      ok();
    }, function(e) {
      err(e);
    });
  });
}

_via_category.prototype._load = function() {
  var cfg = this.d.store.config.ui;
  this.category_colors = cfg.category_colors || {};
  this.category_types = cfg.category_types || {};
  this.selected = cfg.category_selected || null;
  if ( this.selected && !this.d.store.attribute[this.category_aid].options.hasOwnProperty(this.selected) ) {
    this.selected = null;
  }
}

// 项目导入/加载后调用：重新读取类别配置（名称/颜色/类型/选中）
_via_category.prototype.on_project_loaded = function() {
  var self = this;
  this.init().then(function() {
    self._load();
    if ( self.via ) {
      self.via._render_category_overlay();
      if ( self.via.editor && self.via.editor.category_list ) {
        self.via.editor.attributes_update();
      }
    }
  });
}

// 获取类别属性 aid
_via_category.prototype.get_aid = function() {
  return this.category_aid;
}

// 类别列表（按 options 顺序）
_via_category.prototype.get_categories = function() {
  if ( !this.category_aid ) return [];
  var attr = this.d.store.attribute[this.category_aid];
  if ( !attr ) return [];
  var list = [];
  for ( var oid in attr.options ) {
    list.push({ id: oid, name: attr.options[oid], color: this.category_colors[oid] || '#4d9fff', type: this.category_types[oid] !== undefined ? this.category_types[oid] : _VIA_CATEGORY_TYPE.DETECTION });
  }
  return list;
}

// 当前选中类别
_via_category.prototype.get_selected = function() {
  if ( !this.selected ) return null;
  var attr = this.d.store.attribute[this.category_aid];
  if ( !attr || !attr.options.hasOwnProperty(this.selected) ) return null;
  return { id: this.selected, name: attr.options[this.selected], color: this.category_colors[this.selected] || '#4d9fff' };
}

// 选中类别
_via_category.prototype.select = function(oid) {
  this.selected = oid;
  this.d.store.config.ui.category_selected = oid;
  this.via._render_category_overlay();
  // 若绘制已启用，同步默认值
  if ( this.via.va && this.via.va.file_annotator[0] && this.via.va.file_annotator[0][0] ) {
    this.via.va.file_annotator[0][0]._category_selected_changed();
  }
}

// 添加类别
_via_category.prototype.add = function(name, type, color) {
  var self = this;
  return new Promise(function(ok, err) {
    var attr = self.d.store.attribute[self.category_aid];
    if ( !attr ) { err('类别属性未初始化'); return; }
    // 检查重名
    for ( var oid in attr.options ) {
      if ( attr.options[oid] === name ) { err('类别已存在'); return; }
    }
    self.d.attribute_update_options_from_csv(self.category_aid, self._options_to_csv(attr, name)).then(function() {
      // 找到新类别的 oid（options 最后一项）
      var new_attr = self.d.store.attribute[self.category_aid];
      var new_oid = null;
      for ( var o in new_attr.options ) {
        if ( new_attr.options[o] === name ) { new_oid = o; break; }
      }
      if ( new_oid ) {
        self.category_colors[new_oid] = color;
        self.category_types[new_oid] = type;
        self.d.store.config.ui.category_colors = self.category_colors;
        self.d.store.config.ui.category_types = self.category_types;
      }
      self.via._render_category_overlay();
      ok(new_oid);
    }, err);
  });
}

// 删除类别
_via_category.prototype.remove = function(oid) {
  var self = this;
  return new Promise(function(ok, err) {
    var attr = self.d.store.attribute[self.category_aid];
    if ( !attr ) { err('未初始化'); return; }
    var options = {};
    for ( var o in attr.options ) {
      if ( o !== oid ) options[o] = attr.options[o];
    }
    self.d.attribute_update_options(self.category_aid, options).then(function() {
      delete self.category_colors[oid];
      delete self.category_types[oid];
      self.d.store.config.ui.category_colors = self.category_colors;
      self.d.store.config.ui.category_types = self.category_types;
      if ( self.selected === oid ) {
        self.selected = null;
        self.d.store.config.ui.category_selected = '';
      }
      self.via._render_category_overlay();
      ok();
    }, err);
  });
}

// 重命名类别
_via_category.prototype.rename = function(oid, new_name) {
  var self = this;
  return new Promise(function(ok, err) {
    var attr = self.d.store.attribute[self.category_aid];
    if ( !attr ) { err('未初始化'); return; }
    if ( !attr.options.hasOwnProperty(oid) ) { err('类别不存在'); return; }
    attr.options[oid] = new_name;
    self.d.emit_event('attribute_update', { 'aid': self.category_aid });
    self.via._render_category_overlay();
    ok();
  });
}

// 修改颜色
_via_category.prototype.set_color = function(oid, color) {
  this.category_colors[oid] = color;
  this.d.store.config.ui.category_colors = this.category_colors;
  this.via._render_category_overlay();
}

// 修改标注类型
_via_category.prototype.set_type = function(oid, type) {
  this.category_types[oid] = type;
  this.d.store.config.ui.category_types = this.category_types;
  this.via._render_category_overlay();
}

// 将 options 转成 CSV（保留默认标记）
_via_category.prototype._options_to_csv = function(attr, new_name) {
  var parts = [];
  for ( var oid in attr.options ) {
    var v = attr.options[oid];
    if ( oid === attr.default_option_id ) {
      parts.push('*' + v);
    } else {
      parts.push(v);
    }
  }
  parts.push(new_name);
  return parts.join(',');
}

// 供 file_annotator 绘制时取默认类别
_via_category.prototype.get_selected_for_draw = function() {
  return this.selected;
}

// 供渲染层：根据 metadata 的 av 取类别颜色
_via_category.prototype.get_color_for_av = function(av) {
  if ( !this.category_aid || !av ) return null;
  if ( av.hasOwnProperty(this.category_aid) ) {
    var oid = av[this.category_aid];
    return this.category_colors[oid] || null;
  }
  return null;
}
