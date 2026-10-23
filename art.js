(function(root){
  'use strict';
  const data=typeof module!=='undefined'&&module.exports?require('./art-data.js'):root.LifeArtData;
  const images=new Map();
  const url=group=>data.atlases[group].url;
  function placement(bounds){
    const scale=(data.tile-2*data.padding)/Math.max(bounds[2],bounds[3]);
    const w=bounds[2]*scale,h=bounds[3]*scale;
    return {x:(data.tile-w)/2,y:(data.tile-h)/2,w,h};
  }
  async function prepare(img,group){
    const atlas=data.atlases[group];
    const bytes=Uint8Array.from(atob(atlas.mask),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    const runs=new DataView(await new Response(stream).arrayBuffer());
    const canvas=document.createElement('canvas');canvas.width=data.tile*5;canvas.height=data.tile*4;
    const ctx=canvas.getContext('2d');let offset=0;
    atlas.sprites.forEach((sprite,variant)=>{
      const [sx,sy,w,h]=sprite.bounds,tile=document.createElement('canvas');tile.width=w;tile.height=h;
      const cut=tile.getContext('2d');cut.beginPath();
      const end=offset+atlas.lengths[variant]*2;
      for(;offset<end;offset+=6)cut.rect(runs.getUint16(offset+2,true),runs.getUint16(offset,true),runs.getUint16(offset+4,true),1);
      cut.clip();cut.drawImage(img,-sx,-sy);
      const p=placement(sprite.bounds);
      ctx.drawImage(tile,(variant%5)*data.tile+p.x,Math.floor(variant/5)*data.tile+p.y,p.w,p.h);
    });
    images.get(group).canvas=canvas;
    root.dispatchEvent(new CustomEvent('life-art-ready',{detail:group}));
  }
  function image(group){
    if(!images.has(group)){
      const img=new Image();images.set(group,{img,canvas:null});
      img.onload=()=>prepare(img,group).catch(error=>console.error('Species artwork could not be prepared',group,error));
      img.src=url(group);
    }
    return images.get(group).canvas;
  }
  function cell(life,img){const w=(img.naturalWidth||img.width)/5,h=(img.naturalHeight||img.height)/4;return {x:(life.variant%5)*w,y:Math.floor(life.variant/5)*h,w,h};}
  function paint(canvas,group,variant){
    const atlas=image(group);if(!atlas)return false;
    const r=cell({variant},atlas),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(atlas,r.x,r.y,r.w,r.h,0,0,canvas.width,canvas.height);return true;
  }
  const api={image,url,cell,paint,placement};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LifeArt=api;
})(typeof window==='undefined'?globalThis:window);
