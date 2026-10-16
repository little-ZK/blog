/* ==========================================
   全屏彩色交互泡泡（canvas）
   漂浮 + 鼠标推开 + 点击生成 + 自动补充
   ========================================== */
(function() {
  var canvas = document.getElementById('bubbleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w, h;
  var bubbles = [];
  var mouse = { x: null, y: null, radius: 120 };

  // 明亮彩色，柔和低饱和
  var colorList = [
    'rgba(255, 183, 77, 0.38)',
    'rgba(255, 124, 184, 0.38)',
    'rgba(127, 218, 255, 0.42)',
    'rgba(172, 255, 204, 0.40)',
    'rgba(183, 148, 255, 0.38)',
    'rgba(255, 234, 112, 0.45)'
  ];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function Bubble(x, y) {
    this.x = (x !== undefined && x !== null) ? x : Math.random() * w;
    this.y = (y !== undefined && y !== null) ? y : h + 50;
    this.radius = Math.random() * 22 + 6;
    this.color = colorList[Math.floor(Math.random() * colorList.length)];
    this.speedX = (Math.random() - 0.5) * 0.6;
    this.speedY = -(Math.random() * 0.7 + 0.4);
    this.alpha = 0;
    this.fadeSpeed = 0.008;
  }

  Bubble.prototype.update = function() {
    // 鼠标斥力
    if (mouse.x !== null) {
      var dx = mouse.x - this.x;
      var dy = mouse.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        var force = (mouse.radius - dist) / mouse.radius;
        this.x -= dx * force * 0.04;
        this.y -= dy * force * 0.04;
      }
    }

    this.x += this.speedX;
    this.y += this.speedY;

    if (this.alpha < 0.6) this.alpha += this.fadeSpeed;

    // 上浮超出顶部后淡出销毁
    if (this.y < -this.radius) {
      this.alpha -= this.fadeSpeed;
      if (this.alpha <= 0) return false;
    }
    return true;
  };

  Bubble.prototype.draw = function() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    // 高光，果冻质感
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35,
      this.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.restore();
  };

  var targetCount = 30;

  function init() {
    for (var i = 0; i < targetCount; i++) {
      bubbles.push(new Bubble());
    }
  }
  init();

  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseout', function() {
    mouse.x = null;
    mouse.y = null;
  });
  window.addEventListener('click', function(e) {
    bubbles.push(new Bubble(e.clientX, e.clientY));
  });

  function animate() {
    ctx.clearRect(0, 0, w, h);
    for (var i = bubbles.length - 1; i >= 0; i--) {
      if (!bubbles[i].update()) {
        bubbles.splice(i, 1);
      } else {
        bubbles[i].draw();
      }
    }
    if (bubbles.length < targetCount) {
      bubbles.push(new Bubble());
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
