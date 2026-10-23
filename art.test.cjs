const test=require('node:test'),assert=require('node:assert/strict'),{inflateSync}=require('node:zlib');
const data=require('./art-data.js'),art=require('./art.js');
test('340 extracted sprites contain their full bodies with no shared neighbour pixels',()=>{
  assert.equal(data.atlases.length,17);
  for(const atlas of data.atlases){
    assert.equal(atlas.sprites.length,20);const runs=inflateSync(Buffer.from(atlas.mask,'base64'));
    const occupied=new Uint8Array(atlas.width*atlas.height);let offset=0;
    atlas.sprites.forEach((sprite,variant)=>{
      const [sx,sy,w,h]=sprite.bounds,[x0,y0,x1,y1]=sprite.core;
      assert.ok(sx<=x0&&sy<=y0&&sx+w>=x1&&sy+h>=y1,'Full silhouette core retained');
      const end=offset+atlas.lengths[variant]*2;let pixels=0;
      for(;offset<end;offset+=6){
        const y=runs.readUInt16LE(offset),x=runs.readUInt16LE(offset+2),length=runs.readUInt16LE(offset+4);
        assert.ok(y<h&&x+length<=w);
        for(let i=0;i<length;i++){const pos=(sy+y)*atlas.width+sx+x+i;assert.equal(occupied[pos],0,'Adjacent species must be excluded');occupied[pos]=variant+1;pixels++;}
      }
      assert.equal(pixels,sprite.pixels);assert.ok(pixels>200);
      const p=art.placement(sprite.bounds);
      assert.ok(p.x>=data.padding-1e-9&&p.y>=data.padding-1e-9&&p.x+p.w<=data.tile-data.padding+1e-9&&p.y+p.h<=data.tile-data.padding+1e-9);
      assert.ok(Math.abs(p.w/p.h-w/h)<1e-9,'Aspect ratio retained');
    });
    assert.equal(offset,runs.length);
  }
});
test('thickhead dinosaur head crosses its former grid boundary and is now included',()=>{
  const sprite=data.atlases[7].sprites[16];assert.ok(sprite.bounds[1]<data.atlases[7].height*3/4);
  const p=art.placement(sprite.bounds);assert.ok(p.y>=20);
});

