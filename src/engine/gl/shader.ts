const VS=`#version 300 es
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0,1);}`;
const FS=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D t;uniform float time,curve,scan,bloom;const vec2 S=vec2(320,180);
vec2 sharpUV(vec2 uv,vec2 ts,float sc){vec2 p=uv*ts;vec2 f=clamp((fract(p)-.5)*sc+.5,0.,1.);return(floor(p)+f)/ts;}
vec2 barrel(vec2 uv,float k){vec2 c=uv-.5;return uv+c*dot(c,c)*k;}
void main(){vec2 u=barrel(uv,curve);if(u.x<0.||u.x>1.||u.y<0.||u.y>1.){o=vec4(0,0,0,1);return;}
 vec2 su=sharpUV(u,S,3.);float cv=.0012;
 vec3 c=vec3(texture(t,su+vec2(cv,0)).r,texture(t,su).g,texture(t,su-vec2(cv,0)).b);
 vec3 b=vec3(0);for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++)b+=texture(t,u+vec2(i,j)/S*1.5).rgb;b/=25.;c+=b*bloom;
 float sl=.5+.5*sin(u.y*S.y*6.2831);c*=1.-scan*(1.-sl);
 c*=.96+.04*sin(time*110.);c*=1.-.55*dot(uv-.5,uv-.5)*2.;
 float m=mod(floor(gl_FragCoord.x),3.);c*=vec3(m==0.?1.:.82,m==1.?1.:.82,m==2.?1.:.82);
 o=vec4(c*1.12,1);}`;
export interface Screen{ present(src:HTMLCanvasElement,t:number):void; gl:boolean; params:{curve:number;scan:number;bloom:number}; }
export function createScreen(out:HTMLCanvasElement):Screen{
  const params={curve:.18,scan:.35,bloom:.25};
  const gl=out.getContext('webgl2',{antialias:false});
  if(!gl){ out.width=320;out.height=180;const g=out.getContext('2d')!;out.style.filter='contrast(1.1) saturate(1.2)';
    return {gl:false,params,present(s){g.drawImage(s,0,0);}}; }
  const sh=(ty:number,s:string)=>{const x=gl.createShader(ty)!;gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x)||'shader');return x;};
  const pr=gl.createProgram()!;gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const U=(n:string)=>gl.getUniformLocation(pr,n);
  return {gl:true,params,present(src,t){
    const w=Math.max(1,out.clientWidth*devicePixelRatio|0),h=Math.max(1,out.clientHeight*devicePixelRatio|0);if(out.width!==w||out.height!==h){out.width=w;out.height=h;}
    gl.viewport(0,0,w,h);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
    gl.uniform1f(U('time'),t/1000);gl.uniform1f(U('curve'),params.curve);gl.uniform1f(U('scan'),params.scan);gl.uniform1f(U('bloom'),params.bloom);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}};
}
