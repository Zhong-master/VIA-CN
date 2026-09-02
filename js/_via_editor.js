/**
 * @class
 * @classdesc Editor for metadata and attributes
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 14 Jan. 2019
 */
function _via_editor(data, view_annotator, container) {
  this._ID = '_via_editor';
  this.d  = data;
  this.va = view_annotator;
  this.c  = container;

  // initialise event listeners
  this.d.on_event('file_show', this._ID, this.on_event_file_show.bind(this));
  this.d.on_event('metadata_add', this._ID, this.on_event_metadata_add.bind(this));
  this.d.on_event('metadata_del', this._ID, this.on_event_metadata_del.bind(this));
  this.d.on_event('attribute_update', this._ID, this.on_event_attribute_update.bind(this));
  this.d.on_event('attribute_del', this._ID, this.on_event_attribute_del.bind(this));
  this.d.on_event('attribute_add', this._ID, this.on_event_attribute_add.bind(this));
}

_via_editor.prototype.TYPE = { 'METADATA':2, 'ATTRIBUTE':3 };


_via_editor.prototype.toggle = function() {
  if ( this.c.classList.contains('hide') ) {
    this.show();
  } else {
    this.hide();
  }
}

_via_editor.prototype.hide = function() {
  this.c.innerHTML = '';
  this.c.classList.add('hide');
}
_via_editor.prototype.show = function() {
  this.c.classList.remove('hide');
  this.c.innerHTML = '';

  // 工具栏：关闭按钮
  var toolbar = document.createElement('div');
  toolbar.setAttribute('class', 'toolbar');
  var close_button = document.createElement('button');
  close_button.setAttribute('class', 'text_button');
  close_button.innerHTML = '&times;';
  close_button.addEventListener('click', this.toggle.bind(this));
  toolbar.appendChild(close_button);
  this.c.appendChild(toolbar);

  // 类别管理容器
  var cat_container = document.createElement('div');
  cat_container.setAttribute('class', 'category_manager');
  this.c.appendChild(cat_container);

  // 创建区
  var create_panel = document.createElement('div');
  create_panel.setAttribute('class', 'category_create_panel');
  var title = document.createElement('h2');
  title.innerHTML = '创建类别';
  create_panel.appendChild(title);

  var name_input = document.createElement('input');
  name_input.setAttribute('type', 'text');
  name_input.setAttribute('placeholder', '类别名称（如：猫）');
  name_input.setAttribute('id', 'category_name_input');
  create_panel.appendChild(name_input);

  var type_label = document.createElement('label');
  type_label.innerHTML = '标注类型';
  type_label.setAttribute('class', 'category_field_label');
  create_panel.appendChild(type_label);
  var type_select = document.createElement('select');
  type_select.setAttribute('id', 'category_type_select');
  var t_opts = [
    [ _VIA_CATEGORY_TYPE.CLASSIFICATION, '图像分类' ],
    [ _VIA_CATEGORY_TYPE.DETECTION, '目标检测' ],
    [ _VIA_CATEGORY_TYPE.SEGMENTATION, '图像分割' ],
  ];
  for ( var i = 0; i < t_opts.length; ++i ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', t_opts[i][0]);
    oi.innerHTML = t_opts[i][1];
    type_select.appendChild(oi);
  }
  create_panel.appendChild(type_select);

  var color_label = document.createElement('label');
  color_label.innerHTML = '颜色';
  color_label.setAttribute('class', 'category_field_label');
  create_panel.appendChild(color_label);
  var color_input = document.createElement('input');
  color_input.setAttribute('type', 'color');
  color_input.setAttribute('id', 'category_color_input');
  color_input.setAttribute('value', '#4d9fff');
  create_panel.appendChild(color_input);

  var create_btn = document.createElement('button');
  create_btn.setAttribute('class', 'category_create_btn');
  create_btn.innerHTML = '创建类别';
  var self = this;
  create_btn.addEventListener('click', function() {
    var name = name_input.value.trim();
    if ( !name ) {
      _via_util_msg_show('请输入类别名称');
      return;
    }
    var type = parseInt(type_select.value);
    var color = color_input.value;
    if ( window.via && window.via.category ) {
      window.via.category.add(name, type, color).then(function(oid) {
        _via_util_msg_show('已创建类别: ' + name);
        name_input.value = '';
        window.via.category.select(oid);
        self.attributes_update();
      }, function(err) {
        _via_util_msg_show(err);
      });
    }
  });
  create_panel.appendChild(create_btn);
  cat_container.appendChild(create_panel);

  // 类别列表
  var list_title = document.createElement('h2');
  list_title.innerHTML = '类别列表';
  cat_container.appendChild(list_title);
  this.category_list = document.createElement('div');
  this.category_list.setAttribute('class', 'category_list_panel');
  cat_container.appendChild(this.category_list);

  this.attributes_update();
}

//
// Editor content selector
//
_via_editor.prototype.on_editor_content_select = function(selector) {
  var element;
  switch(selector.target.name) {
  case 'metadata':
    element = this.metadata_container;
    break;
  case 'attribute':
    element = this.attribute_container;
    break;
  }

  if ( selector.target.checked ) {
    element.classList.remove('hide');
  } else {
    element.classList.add('hide');
  }
}

//
// metadata
//
_via_editor.prototype.metadata_clear = function() {
  this.metadata_view.innerHTML = '';
}

_via_editor.prototype.metadata_update = function() {
  this.metadata_clear();

  if ( this.va.vid ) {
    // fetch all metadata associated with this.va.vid
    this.d._cache_update_mid_list();
    var metadata_count = this.d.cache.mid_list[this.va.vid].length;
    console.log(metadata_count)
    if ( metadata_count ) {
      // add header
      this.metadata_view.appendChild( this.get_metadata_header() );

      // add each metadata
      var tbody = document.createElement('tbody');
      var metadata_index = 1;
      var mid;
      for ( var mindex in this.d.cache.mid_list[this.va.vid] ) {
        mid = this.d.cache.mid_list[this.va.vid][mindex];
        tbody.appendChild( this.metadata_get(mid, metadata_index) );
        metadata_index = metadata_index + 1;
      }
      this.metadata_view.appendChild(tbody);
    } else {
      this.metadata_view.innerHTML = '<tr><td>No metadata added yet!</td></tr>';
    }
  } else {
    this.metadata_view.innerHTML = '<tr><td><i>No metadata added yet!</i></td></tr>';
  }
}

_via_editor.prototype.metadata_get = function(mid, metadata_index) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-mid', mid);

  // column: the action tools for metadata (like delete)
  var action_tools_container = document.createElement('td');
  this.get_metadata_action_tools(action_tools_container, mid);
  tr.appendChild( action_tools_container );

  // column: index of this metadata
  var metadata_index_container = document.createElement('td');
  metadata_index_container.innerHTML = metadata_index;
  metadata_index_container.setAttribute('title', mid);
  tr.appendChild(metadata_index_container);

  // column: z (temporal coordinate)
  var tcoordinate = document.createElement('td');
  tcoordinate.innerHTML = this.d.store.metadata[mid].z.join(', ');
  tr.appendChild(tcoordinate);

  // column: xy (spatial coordinate)
  var scoordinate = document.createElement('td');
  scoordinate.innerHTML = this.d.store.metadata[mid].xy.join(', ');
  tr.appendChild(scoordinate);

  // subsequent columns: what (i.e. the attributes for this metadata)
  for ( var aid in this.d.store.attribute ) {
    var td = document.createElement('td');
    td.appendChild( this.get_attribute_html_element(mid, aid) );
    tr.appendChild(td);
  }

  return tr;
}

_via_editor.prototype.get_metadata_action_tools = function(container, mid) {
  var del = _via_util_get_svg_button('micon_delete', '删除元数据');
  del.setAttribute('data-mid', mid);
  del.addEventListener('click', this.metadata_del.bind(this));
  container.appendChild(del);

  /*
  var edit = _via_util_get_svg_button('micon_edit', '选择要编辑的元数据');
  edit.setAttribute('data-fid', fid);
  edit.setAttribute('data-mid', mid);
  edit.addEventListener('click', this.metadata_edit.bind(this));
  container.appendChild(edit);
  */
}

_via_editor.prototype.get_metadata_header = function() {
  var tr = document.createElement('tr');
  tr.appendChild( this.html_element('th', '') );
  tr.appendChild( this.html_element('th', '#') );
  tr.appendChild( this.html_element('th', '时间坐标') );
  tr.appendChild( this.html_element('th', '空间坐标') );

  for ( var aid in this.d.store.attribute ) {
    tr.appendChild( this.html_element('th',
                                      this.d.store.attribute[aid].aname)
                  );
  }

  var thead = document.createElement('thead');
  thead.appendChild(tr);
  return thead;
}

_via_editor.prototype.html_element = function(name, text) {
  var e = document.createElement(name);
  e.innerHTML = text;
  return e;
}

//
// Metadata preview
//

_via_editor.prototype.jump_to_metadata = function(e) {
  var fid = e.target.dataset.fid;
  var mid = e.target.dataset.mid;
  var where_index = e.target.dataset.where_index;
  if ( this.d.metadata_store[fid][mid].where_target() === _VIA_WHERE_TARGET.SEGMENT &&
       this.d.metadata_store[fid][mid].where_target() === _VIA_WHERE_SHAPE.TIME
     ) {
    this.a.preload[fid].media_annotator.media.currentTime = this.d.metadata_store[fid][mid].where[where_index];
  }
}

//
// attribute
//
_via_editor.prototype.attribute_clear = function() {
  this.attribute_view.innerHTML = '';
}

_via_editor.prototype.attributes_update = function() {
  if ( this.c.classList.contains('hide') ) {
    return;
  }
  if ( !this.category_list ) {
    return;
  }
  this.category_list.innerHTML = '';

  if ( !window.via || !window.via.category ) {
    return;
  }
  var categories = window.via.category.get_categories();
  if ( !categories.length ) {
    this.category_list.innerHTML = '<div class="category_manager_empty">暂无类别，请在上方创建</div>';
    return;
  }
  var self = this;
  var selected = window.via.category.selected;
  for ( var i = 0; i < categories.length; ++i ) {
    var cat = categories[i];
    var item = document.createElement('div');
    item.setAttribute('class', 'category_row' + (cat.id === selected ? ' category_row_active' : ''));
    item.setAttribute('data-oid', cat.id);

    var dot = document.createElement('span');
    dot.setAttribute('class', 'category_row_dot');
    dot.setAttribute('style', 'background:' + cat.color);
    item.appendChild(dot);

    var info = document.createElement('div');
    info.setAttribute('class', 'category_row_info');
    var nm = document.createElement('div');
    nm.setAttribute('class', 'category_row_name');
    nm.textContent = cat.name;
    info.appendChild(nm);
    var tp = document.createElement('div');
    tp.setAttribute('class', 'category_row_type');
    var type_names = { '0':'图像分类', '1':'目标检测', '2':'图像分割' };
    tp.textContent = type_names[cat.type] || '目标检测';
    info.appendChild(tp);
    item.appendChild(info);

    // 选中按钮
    var sel_btn = document.createElement('button');
    sel_btn.setAttribute('class', 'category_row_select');
    sel_btn.innerHTML = cat.id === selected ? '✓ 当前' : '选择';
    sel_btn.addEventListener('click', (function(oid) {
      return function() {
        window.via.category.select(oid);
        self.attributes_update();
      };
    })(cat.id));
    item.appendChild(sel_btn);

    // 删除按钮
    var del_btn = document.createElement('button');
    del_btn.setAttribute('class', 'category_row_delete');
    del_btn.innerHTML = '✕';
    del_btn.setAttribute('title', '删除类别');
    del_btn.addEventListener('click', (function(oid) {
      return function() {
        window.via.category.remove(oid).then(function() {
          self.attributes_update();
        });
      };
    })(cat.id));
    item.appendChild(del_btn);

    this.category_list.appendChild(item);
  }
}

_via_editor.prototype.get_attribute = function(aid) {
  var card = document.createElement('div');
  card.setAttribute('class', 'attribute_card');
  card.setAttribute('data-aid', aid);

  // 卡片头：删除工具 + 属性 ID + 名称
  var card_head = document.createElement('div');
  card_head.setAttribute('class', 'attribute_card_head');

  var action_tools = document.createElement('div');
  action_tools.setAttribute('class', 'attribute_card_actions');
  this.get_attribute_action_tools(action_tools, aid);
  card_head.appendChild(action_tools);

  var aname = document.createElement('input');
  aname.setAttribute('type', 'text');
  aname.setAttribute('data-aid', aid);
  aname.setAttribute('data-varname', 'aname');
  aname.setAttribute('class', 'attribute_card_name');
  aname.setAttribute('value', this.d.store.attribute[aid].aname);
  aname.setAttribute('title', '属性名称');
  aname.addEventListener('change', this.attribute_on_change.bind(this));
  card_head.appendChild(aname);

  card.appendChild(card_head);

  // 输入类型
  var type_row = this._attribute_field_row('输入类型', 'type');
  var type_select = document.createElement('select');
  type_select.setAttribute('data-aid', aid);
  type_select.setAttribute('data-varname', 'type');
  type_select.addEventListener('change', this.attribute_update_type.bind(this));
  var type_str;
  for ( type_str in _VIA_ATTRIBUTE_TYPE ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', _VIA_ATTRIBUTE_TYPE[type_str]);
    oi.innerHTML = type_str;
    if ( _VIA_ATTRIBUTE_TYPE[type_str] === this.d.store.attribute[aid].type ) {
      oi.setAttribute('selected', '');
    }
    type_select.appendChild(oi);
  }
  type_row.value.appendChild(type_select);
  card.appendChild(type_row);

  // 锚点（Anchor）
  var anchor_row = this._attribute_field_row('锚点', 'anchor');
  var anchor_select = document.createElement('select');
  anchor_select.setAttribute('data-aid', aid);
  anchor_select.setAttribute('data-varname', 'anchor_id');
  anchor_select.addEventListener('change', this.attribute_on_change.bind(this));
  var option_selected = false;
  for ( var anchor_id in _VIA_ATTRIBUTE_ANCHOR ) {
    if ( _VIA_ATTRIBUTE_ANCHOR[anchor_id] !== '__FUTURE__' ) {
      var oi2 = document.createElement('option');
      oi2.setAttribute('value', anchor_id);
      oi2.innerHTML = _VIA_ATTRIBUTE_ANCHOR[anchor_id];
      if ( anchor_id === this.d.store.attribute[aid].anchor_id ) {
        oi2.setAttribute('selected', '');
        option_selected = true;
      }
      anchor_select.appendChild(oi2);
    }
  }
  if ( ! option_selected ) {
    anchor_select.selectedIndex = -1;
  }
  anchor_row.value.appendChild(anchor_select);
  card.appendChild(anchor_row);

  // 描述
  var desc_row = this._attribute_field_row('描述', 'desc');
  var desc = document.createElement('input');
  desc.setAttribute('type', 'text');
  desc.setAttribute('data-aid', aid);
  desc.setAttribute('data-varname', 'desc');
  desc.setAttribute('value', this.d.store.attribute[aid].desc);
  desc.addEventListener('change', this.attribute_on_change.bind(this));
  desc_row.value.appendChild(desc);
  card.appendChild(desc_row);

  // 选项
  var options_row = this._attribute_field_row('选项', 'options');
  if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.TEXT ) {
    options_row.value.appendChild( document.createTextNode('-') );
  } else {
    var option_input = document.createElement('textarea');
    option_input.setAttribute('data-aid', aid);
    option_input.setAttribute('data-varname', 'options');
    option_input.setAttribute('rows', '2');
    option_input.setAttribute('placeholder', 'e.g. a,*b,c,d');
    option_input.setAttribute('title', 'Enter options as comma separated value with the default option prefixed using an *. For example: "a,*b,c"');
    option_input.addEventListener('change', this.attribute_on_change.bind(this));
    option_input.innerHTML = _via_util_obj_to_csv(this.d.store.attribute[aid].options,
                                                  this.d.store.attribute[aid].default_option_id);
    options_row.value.appendChild(option_input);
  }
  card.appendChild(options_row);

  // 默认值
  var default_row = this._attribute_field_row('默认值', 'default');
  if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.TEXT ) {
    default_row.value.appendChild( document.createTextNode('-') );
  } else {
    var default_value = this.d.store.attribute[aid].options[ this.d.store.attribute[aid].default_option_id ];
    if ( typeof(default_value) === 'undefined' ) {
      default_row.value.appendChild( document.createTextNode('未定义') );
    } else {
      default_row.value.appendChild( document.createTextNode(default_value) );
    }
  }
  card.appendChild(default_row);

  // 预览
  var preview_row = this._attribute_field_row('预览', 'preview');
  preview_row.value.appendChild( this.get_attribute_html_element(aid) );
  card.appendChild(preview_row);

  return card;
}

// 卡片字段行辅助：标签 + 内容容器
_via_editor.prototype._attribute_field_row = function(label_text, field_name) {
  var row = document.createElement('div');
  row.setAttribute('class', 'attribute_field');
  if ( field_name ) {
    row.setAttribute('data-field', field_name);
  }

  var label = document.createElement('label');
  label.setAttribute('class', 'attribute_field_label');
  label.innerHTML = label_text;
  row.appendChild(label);

  var value = document.createElement('div');
  value.setAttribute('class', 'attribute_field_value');
  row.appendChild(value);

  // 返回 field 容器；控件直接 append 到 row 会落入 value 区
  // 通过在 row 上挂 value 引用，调用方用 row.value.append(...)
  row.value = value;
  return row;
}

_via_editor.prototype.get_attribute_html_element = function(aid) {
  var dval  = this.d.store.attribute[aid].default_option_id;
  var atype = this.d.store.attribute[aid].type;
  var el;

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    el = document.createElement('textarea');
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = this.d.store.attribute[aid].options[oid];
      if ( oid === this.d.store.attribute[aid].default_option_id ) {
        oi.setAttribute('selected', 'true');
      }
      el.appendChild(oi);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('value', oid);
      radio.setAttribute('data-aid', aid);
      radio.setAttribute('name', this.d.store.attribute[aid].aname);
      if ( oid === this.d.store.attribute[aid].default_option_id ) {
        radio.setAttribute('checked', 'true');
      }

      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(radio);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.CHECKBOX:
    el = document.createElement('div');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('value', oid);
      checkbox.setAttribute('data-aid', aid);
      checkbox.setAttribute('name', this.d.store.attribute[aid].aname);
      if ( oid === this.d.store.attribute[aid].default_option_id ) {
        checkbox.setAttribute('checked', 'true');
      }

      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(checkbox);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  default:
    console.log('属性类型 ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = '';
  }
  el.setAttribute('data-aid', aid);
  return el;
}

_via_editor.prototype.get_attribute_name_entry_panel = function() {
  var c = document.createElement('div');
  c.setAttribute('class', 'attribute_entry');

  this.new_attribute_name_input = document.createElement('input');
  this.new_attribute_name_input.setAttribute('type', 'text');
  this.new_attribute_name_input.setAttribute('placeholder', '新属性名称');
  c.appendChild(this.new_attribute_name_input);

  var add = document.createElement('button');
  add.setAttribute('class', 'text-button');
  add.innerHTML = 'Create';
  add.addEventListener('click', this.on_attribute_create.bind(this));
  c.appendChild(add);

  return c;
}

_via_editor.prototype.get_attribute_action_tools = function(container, aid) {
  var del = _via_util_get_svg_button('micon_delete', '删除属性');
  del.setAttribute('data-aid', aid);
  del.addEventListener('click', this.attribute_del.bind(this));
  container.appendChild(del);
}

_via_editor.prototype.update_attribute_for = function(aid) {
  var tbody = this.attribute_view.getElementsByTagName('tbody')[0];
  var n = tbody.childNodes.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( tbody.childNodes[i].dataset.aid === aid ) {
      var new_attribute = this.get_attribute(aid);
      tbody.replaceChild( new_attribute, tbody.childNodes[i] );
      break;
    }
  }
}

_via_editor.prototype.attribute_on_change = function(e) {
  var varname = e.target.dataset.varname;
  var vartype = e.target.type;
  var aid = e.target.dataset.aid;

  switch(vartype) {
  case 'text':
    this.d.store.attribute[aid][varname] = e.target.value;
    break;
  case 'textarea':
    if ( varname === 'options' ) {
      var options_csv = e.target.value;
      this.d.attribute_update_options_from_csv(aid, options_csv).then(function(ok) {
      }.bind(this));
    }
    break;
  case 'select':
  case 'select-one':
    if ( varname === 'anchor_id' ) {
      var new_anchor_id = e.target.options[e.target.selectedIndex].value;
      this.d.attribute_update_anchor_id(aid, new_anchor_id);
    }
    break;
  default:
    console.warn('Unknown varname=' + varname + ', vartype=' + vartype);
  }

  this.attributes_update();
}

//
// Listeners for data update events
//
_via_editor.prototype.metadata_del = function(e) {
  var fid = e.currentTarget.dataset.fid;
  var mid = e.currentTarget.dataset.mid;
  this.d.metadata_del(fid, mid).then( function(ok) {
    // we don't need to do anything when metadata delete is successful
  }.bind(this), function(err) {
    console.log(err)
  }.bind(this));
}

_via_editor.prototype.metadata_edit = function(e) {
  var fid = e.target.parentNode.dataset.fid;
  var mid = e.target.parentNode.dataset.mid;
  console.log('@todo: edit metadata: fid=' + fid + ', mid=' + mid);
}

_via_editor.prototype.on_attribute_create = function(e) {
  var new_attribute_name = this.new_attribute_name_input.value;
  this.d.attribute_add(new_attribute_name,
                       _VIA_DEFAULT_ATTRIBUTE_ANCHOR_ID,
                       _VIA_ATTRIBUTE_TYPE.TEXT).then( function(ok) {
    this.attributes_update();
    // attribute was added
  }.bind(this), function(err) {
    console.log(err);
  }.bind(this));
}

_via_editor.prototype.attribute_del = function(e) {
  var aid = e.currentTarget.dataset.aid;
  this.d.attribute_del(aid).then( function(ok) {
    // we don't need to do anything when attribute delete is successful
  }.bind(this), function(err) {
    console.log(err)
  }.bind(this));
}

_via_editor.prototype.attribute_update_options = function(e) {
  var aid = e.target.dataset.aid;
  var new_options_csv = e.target.value;
  this.d.attribute_update_options(aid, new_options_csv);
}

_via_editor.prototype.attribute_update_type = function(e) {
  var aid = e.target.dataset.aid;
  var new_type = parseInt(e.target.options[ e.target.selectedIndex ].value);
  var self = this;
  // 标记：类型切换时跳过事件触发的整卡重建，只做局部刷新
  this._skip_next_attribute_rebuild = true;
  this.d.attribute_update_type(aid, new_type).then(function() {
    self._skip_next_attribute_rebuild = false;
    self._refresh_type_dependent_fields(aid);
  }, function(err) {
    self._skip_next_attribute_rebuild = false;
    self.attributes_update();
  });
}

// 仅重建某卡片中依赖输入类型的字段（选项/默认值/预览），保留其他字段不重建
_via_editor.prototype._refresh_type_dependent_fields = function(aid) {
  var card = this.attribute_view.querySelector('.attribute_card[data-aid="' + aid + '"]');
  if ( !card ) {
    this.attributes_update();
    return;
  }

  // 重建选项字段
  var options_row = card.querySelector('.attribute_field[data-field="options"]');
  if ( options_row ) {
    options_row.value.innerHTML = '';
    if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.TEXT ) {
      options_row.value.appendChild( document.createTextNode('-') );
    } else {
      var option_input = document.createElement('textarea');
      option_input.setAttribute('data-aid', aid);
      option_input.setAttribute('data-varname', 'options');
      option_input.setAttribute('rows', '2');
      option_input.setAttribute('placeholder', 'e.g. a,*b,c,d');
      option_input.setAttribute('title', 'Enter options as comma separated value with the default option prefixed using an *. For example: "a,*b,c"');
      option_input.addEventListener('change', this.attribute_on_change.bind(this));
      option_input.innerHTML = _via_util_obj_to_csv(this.d.store.attribute[aid].options,
                                                    this.d.store.attribute[aid].default_option_id);
      options_row.value.appendChild(option_input);
    }
  }

  // 重建默认值字段
  var default_row = card.querySelector('.attribute_field[data-field="default"]');
  if ( default_row ) {
    default_row.value.innerHTML = '';
    if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.TEXT ) {
      default_row.value.appendChild( document.createTextNode('-') );
    } else {
      var default_value = this.d.store.attribute[aid].options[ this.d.store.attribute[aid].default_option_id ];
      if ( typeof(default_value) === 'undefined' ) {
        default_row.value.appendChild( document.createTextNode('未定义') );
      } else {
        default_row.value.appendChild( document.createTextNode(default_value) );
      }
    }
  }

  // 重建预览字段
  var preview_row = card.querySelector('.attribute_field[data-field="preview"]');
  if ( preview_row ) {
    preview_row.value.innerHTML = '';
    preview_row.value.appendChild( this.get_attribute_html_element(aid) );
  }
}

_via_editor.prototype.on_event_attribute_update = function(data, event_payload) {
  // 类型切换已走局部刷新，跳过此处整卡重建
  if ( this._skip_next_attribute_rebuild ) {
    return;
  }
  this.attributes_update();
}

_via_editor.prototype.on_event_attribute_del = function(data, event_payload) {
  this.attributes_update();
}

_via_editor.prototype.on_event_attribute_add = function(data, event_payload) {
  this.attributes_update();
}

_via_editor.prototype.on_event_metadata_add = function(data, event_payload) {
  //this.metadata_update();
}

_via_editor.prototype.on_event_metadata_del = function(data, event_payload) {
  //this.metadata_update();
}

_via_editor.prototype.on_event_file_show = function(data, event_payload) {
  //this.metadata_update();
}
