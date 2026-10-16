const canvas = document.getElementById('bubbleCanvas');
const ctx = canvas.getContext('2d');
let w, h;
let bubbles = [];
const mouse = { x: null, y: null, radius: 120 };

const colorList = [
  'rgba(255, 183, 77, 0.35)',
  'rgba(255, 124, 184, 0.35)',
  'rgba(127, 218, 255, 0.4)',
  'rgba(172, 255, 204, 0.38)',
  'rgba(183, 148, 255, 0.35)',
  'rgba(255, 234, 112, 0.42)'
];

function resizeCanvas(){
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Bubble {
  constructor(x,y){
    this.x = x || Math.random() * w;
    this.y = y || h + 50;
    this.radius = Math.random() * 22 + 6;
    this.color = colorList[Math.floor(Math.random() * colorList.length)];
    this.speedX = (Math.random() - 0.5) * 0.6;
    this.speedY = -(Math.random() * 0.7 + 0.4);
    this.alpha = 0;
    this.fadeSpeed = 0.008;
  }
  update(){
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < mouse.radius){
      const force = (mouse.radius - dist)/mouse.radius;
      this.x -= dx * force * 0.04;
      this.y -= dy * force * 0.04;
    }

    this.x += this.speedX;
    this.y += this.speedY;
    if(this.alpha < 0.6) this.alpha += this.fadeSpeed;
    if(this.y < -this.radius){
      this.alpha -= this.fadeSpeed;
      if(this.alpha <= 0) return false;
    }
    return true;
  }
  draw(){
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x - this.radius*0.35, this.y - this.radius*0.35, this.radius*0.25,0,Math.PI*2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
    ctx.restore();
  }
}

for(let i=0;i<30;i++){
  bubbles.push(new Bubble());
}

window.addEventListener('mousemove', (e)=>{
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mouseout', ()=>{
  mouse.x = null;
  mouse.y = null;
});
window.addEventListener('click', (e)=>{
  bubbles.push(new Bubble(e.clientX, e.clientY));
});

function animate(){
  ctx.clearRect(0,0,w,h);
  for(let i=bubbles.length-1;i>=0;i--){
    if(!bubbles[i].update()){
      bubbles.splice(i,1);
    }else{
      bubbles[i].draw();
    }
  }
  if(bubbles.length < 30){
    bubbles.push(new Bubble());
  }
  requestAnimationFrame(animate);
}
animate();
