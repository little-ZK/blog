if(window.innerWidth > 768){
  window.addEventListener('mousemove',e=>{
    const banner = document.querySelector('body.home #page-header .page-header-bg');
    if(!banner) return;
    const x = (e.clientX - window.innerWidth/2)/60;
    const y = (e.clientY - window.innerHeight/2)/60;
    banner.style.transform = `translate(${x}px,${y}px)`;
  })
}
