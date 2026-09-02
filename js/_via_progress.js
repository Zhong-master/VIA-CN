/**
 * @class
 * @classdesc VIA 进度提示组件（模态框 + 进度条）
 * 用于项目保存/加载、标注导出等耗时操作，提供真实的进度反馈
 */

'use strict'

var _via_progress = {
  container: null,
  bar: null,
  label: null,

  // 显示进度框
  show: function(title, subtitle) {
    if ( !this.container ) {
      this.container = document.createElement('div');
      this.container.setAttribute('id', 'via_progress_container');
      this.container.innerHTML =
        '<div class="via_progress_panel">' +
          '<div class="via_progress_title"></div>' +
          '<div class="via_progress_bar_wrap"><div class="via_progress_bar"></div></div>' +
          '<div class="via_progress_label">准备中...</div>' +
        '</div>';
      this.bar = this.container.querySelector('.via_progress_bar');
      this.label = this.container.querySelector('.via_progress_label');
      this.title_el = this.container.querySelector('.via_progress_title');
      document.body.appendChild(this.container);
    }
    this.title_el.textContent = title || '处理中';
    this.label.textContent = subtitle || '请稍候...';
    this.bar.style.width = '0%';
    this.container.style.display = 'flex';
    // 强制渲染进度框，再执行耗时操作
    return new Promise(function(ok) {
      setTimeout(ok, 30);
    });
  },

  // 更新进度（percent 0-100）
  update: function(percent, text) {
    if ( !this.container ) return;
    var p = Math.max(0, Math.min(100, percent));
    this.bar.style.width = p + '%';
    if ( text ) {
      this.label.textContent = text;
    }
  },

  // 完成：进度条满格，显示成功文字
  done: function(text) {
    if ( !this.container ) return;
    this.bar.style.width = '100%';
    this.label.textContent = text || '完成';
    // 短暂显示后隐藏
    setTimeout(function() {
      _via_progress.hide();
    }, 800);
  },

  // 隐藏
  hide: function() {
    if ( this.container ) {
      this.container.style.display = 'none';
    }
  },

  // 失败提示
  fail: function(text) {
    if ( !this.container ) return;
    this.label.textContent = text || '失败';
    this.label.style.color = '#ff6b6b';
    setTimeout(function() {
      _via_progress.hide();
      _via_progress.label.style.color = '';
    }, 2000);
  }
};
