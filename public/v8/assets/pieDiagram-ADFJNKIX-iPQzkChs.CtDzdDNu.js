import{u as G,l as I,c as U,a as Z,i as j,s as H,o as K,x as u,Z as O,r as Q,Y as X,J as ee,q as te,_ as ae,h as P,y as ie,w as y,b as F,L as re}from"./mermaid-4DMBBIKO-aeQWcf01.hEMfBQ84.js";import{t as ne}from"./chunk-4BX2VUAB-td2OqKA1.DBSBiVWL.js";import{F as le}from"./treemap-KMMF4GRG-B5KZi85L.BHQhpbHC.js";import{h as oe}from"./ordinal-B6-f3MAq.DAOx55Wy.js";import"./draw.1LjimNmP.js";import"./charts.D6xE-8ZL.js";import"./graphql.DVg4m3qB.js";import"./icons.S3_PtPfx.js";import"./pdf.-AIUeXwf.js";import"./pivot.CceBwBAf.js";import"./result-helper.BcR65Z3h.js";import"./zh-HK-E62DVLB3.C13dU2nJ.js";import"./min-DgiN0H8F.BRNpAMkt.js";import"./init-DjUOC4st.CSqNXydp.js";function se(e,a){return a<e?-1:a>e?1:a>=e?0:NaN}function pe(e){return e}function ce(){var e=pe,a=se,f=null,o=y(0),s=y(F),w=y(0);function l(t){var r,p=(t=re(t)).length,d,v,h=0,c=new Array(p),n=new Array(p),x=+o.apply(this,arguments),S=Math.min(F,Math.max(-F,s.apply(this,arguments)-x)),m,b=Math.min(Math.abs(S)/p,w.apply(this,arguments)),D=b*(S<0?-1:1),g;for(r=0;r<p;++r)(g=n[c[r]=r]=+e(t[r],r,t))>0&&(h+=g);for(a!=null?c.sort(function($,A){return a(n[$],n[A])}):f!=null&&c.sort(function($,A){return f(t[$],t[A])}),r=0,v=h?(S-p*D)/h:0;r<p;++r,x=m)d=c[r],g=n[d],m=x+(g>0?g*v:0)+D,n[d]={data:t[d],index:r,value:g,startAngle:x,endAngle:m,padAngle:b};return n}return l.value=function(t){return arguments.length?(e=typeof t=="function"?t:y(+t),l):e},l.sortValues=function(t){return arguments.length?(a=t,f=null,l):a},l.sort=function(t){return arguments.length?(f=t,a=null,l):f},l.startAngle=function(t){return arguments.length?(o=typeof t=="function"?t:y(+t),l):o},l.endAngle=function(t){return arguments.length?(s=typeof t=="function"?t:y(+t),l):s},l.padAngle=function(t){return arguments.length?(w=typeof t=="function"?t:y(+t),l):w},l}var ue=G.pie,R={sections:new Map,showData:!1},T=R.sections,L=R.showData,de=structuredClone(ue),ge=u(()=>structuredClone(de),"getConfig"),fe=u(()=>{T=new Map,L=R.showData,Q()},"clear"),me=u(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);T.has(e)||(T.set(e,a),O.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),he=u(()=>T,"getSections"),xe=u(e=>{L=e},"setShowData"),ye=u(()=>L,"getShowData"),V={getConfig:ge,clear:fe,setDiagramTitle:I,getDiagramTitle:U,setAccTitle:Z,getAccTitle:j,setAccDescription:H,getAccDescription:K,addSection:me,getSections:he,setShowData:xe,getShowData:ye},we=u((e,a)=>{ne(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ve={parse:u(async e=>{const a=await le("pie",e);O.debug(a),we(a,V)},"parse")},Se=u(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),$e=Se,Ae=u(e=>{const a=[...e.values()].reduce((o,s)=>o+s,0),f=[...e.entries()].map(([o,s])=>({label:o,value:s})).filter(o=>o.value/a*100>=1).sort((o,s)=>s.value-o.value);return ce().value(o=>o.value)(f)},"createPieArcs"),be=u((e,a,f,o)=>{O.debug(`rendering pie chart
`+e);const s=o.db,w=X(),l=ee(s.getConfig(),w.pie),t=40,r=18,p=4,d=450,v=d,h=te(a),c=h.append("g");c.attr("transform","translate("+v/2+","+d/2+")");const{themeVariables:n}=w;let[x]=ae(n.pieOuterStrokeWidth);x??(x=2);const S=l.textPosition,m=Math.min(v,d)/2-t,b=P().innerRadius(0).outerRadius(m),D=P().innerRadius(m*S).outerRadius(m*S);c.append("circle").attr("cx",0).attr("cy",0).attr("r",m+x/2).attr("class","pieOuterCircle");const g=s.getSections(),$=Ae(g),A=[n.pie1,n.pie2,n.pie3,n.pie4,n.pie5,n.pie6,n.pie7,n.pie8,n.pie9,n.pie10,n.pie11,n.pie12];let C=0;g.forEach(i=>{C+=i});const W=$.filter(i=>(i.data.value/C*100).toFixed(0)!=="0"),k=oe(A);c.selectAll("mySlices").data(W).enter().append("path").attr("d",b).attr("fill",i=>k(i.data.label)).attr("class","pieCircle"),c.selectAll("mySlices").data(W).enter().append("text").text(i=>(i.data.value/C*100).toFixed(0)+"%").attr("transform",i=>"translate("+D.centroid(i)+")").style("text-anchor","middle").attr("class","slice"),c.append("text").text(s.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const N=[...g.entries()].map(([i,z])=>({label:i,value:z})),M=c.selectAll(".legend").data(N).enter().append("g").attr("class","legend").attr("transform",(i,z)=>{const E=r+p,q=E*N.length/2,J=12*r,Y=z*E-q;return"translate("+J+","+Y+")"});M.append("rect").attr("width",r).attr("height",r).style("fill",i=>k(i.label)).style("stroke",i=>k(i.label)),M.append("text").attr("x",r+p).attr("y",r-p).text(i=>s.getShowData()?`${i.label} [${i.value}]`:i.label);const _=Math.max(...M.selectAll("text").nodes().map(i=>(i==null?void 0:i.getBoundingClientRect().width)??0)),B=v+t+r+p+_;h.attr("viewBox",`0 0 ${B} ${d}`),ie(h,d,B,l.useMaxWidth)},"draw"),De={draw:be},Ve={parser:ve,db:V,renderer:De,styles:$e};export{Ve as diagram};
