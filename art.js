(function(root){
  'use strict';
  const images=new Map();
  const url=group=>`assets/life-${String(group+1).padStart(2,'0')}.png`;
  function image(group){
    if(!images.has(group)){
      const img=new Image();images.set(group,img);
      img.onload=()=>root.dispatchEvent(new CustomEvent('life-art-ready',{detail:group}));
      img.src=url(group);
    }
    const img=images.get(group);
    return img.complete&&img.naturalWidth>0?img:null;
  }
  function cell(life,img){return {x:(life.variant%5)*img.naturalWidth/5,y:Math.floor(life.variant/5)*img.naturalHeight/4,w:img.naturalWidth/5,h:img.naturalHeight/4};}
  root.LifeArt={image,url,cell};
})(window);
