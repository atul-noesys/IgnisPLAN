import{p as q,f as A}from"./flowDb-956e92f1.pxXD8ZR9.js";import{G as F,c as U}from"./graph.OZYxX1eS.js";import{a as B,l as g,e as K,g as S,c as z,A as P,i as L,u as W,s as H,K as X,_ as J}from"./svgDrawCommon-08f97a94.CEFvHcpU.js";import{r as Q}from"./index-3862675e.SVg4wbG0.js";import{bW as Y}from"./react-split.es.BfLjgtnb.js";import{bU as Z}from"./graphql.DVg4m3qB.js";import"./layout.BebsnxpQ.js";import"./draw.1LjimNmP.js";function ye(e,l){return!!e.children(l).length}function ke(e){return E(e.v)+":"+E(e.w)+":"+E(e.name)}var O=/:/g;function E(e){return e?String(e).replace(O,"\\:"):""}function ee(e,l){l&&e.attr("style",l)}function xe(e,l,c){l&&e.attr("class",l).attr("class",c+" "+e.attr("class"))}function me(e,l){var c=l.graph();if(Y(c)){var a=c.transition;if(Z(a))return a(e)}return e}function te(e,l){var c=e.append("foreignObject").attr("width","100000"),a=c.append("xhtml:div");a.attr("xmlns","http://www.w3.org/1999/xhtml");var i=l.label;switch(typeof i){case"function":a.insert(i);break;case"object":a.insert(function(){return i});break;default:a.html(i)}ee(a,l.labelStyle),a.style("display","inline-block"),a.style("white-space","nowrap");var d=a.node().getBoundingClientRect();return c.attr("width",d.width).attr("height",d.height),c}const N=window.d3.curveLinear,C=window.d3.select,re=window.d3.selectAll,V={},le=function(e){const l=Object.keys(e);for(const c of l)V[c]=e[c]},R=async function(e,l,c,a,i,d){const w=a.select(`[id="${c}"]`),n=Object.keys(e);for(const b of n){const r=e[b];let y="default";r.classes.length>0&&(y=r.classes.join(" ")),y=y+" flowchart-label";const u=B(r.styles);let t=r.text!==void 0?r.text:r.id,s;if(g.info("vertex",r,r.labelType),r.labelType==="markdown")g.info("vertex",r,r.labelType);else if(K(S().flowchart.htmlLabels))s=te(w,{label:t}).node(),s.parentNode.removeChild(s);else{const k=i.createElementNS("http://www.w3.org/2000/svg","text");k.setAttribute("style",u.labelStyle.replace("color:","fill:"));const _=t.split(z.lineBreakRegex);for(const $ of _){const v=i.createElementNS("http://www.w3.org/2000/svg","tspan");v.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve"),v.setAttribute("dy","1em"),v.setAttribute("x","1"),v.textContent=$,k.appendChild(v)}s=k}let p=0,o="";switch(r.type){case"round":p=5,o="rect";break;case"square":o="rect";break;case"diamond":o="question";break;case"hexagon":o="hexagon";break;case"odd":o="rect_left_inv_arrow";break;case"lean_right":o="lean_right";break;case"lean_left":o="lean_left";break;case"trapezoid":o="trapezoid";break;case"inv_trapezoid":o="inv_trapezoid";break;case"odd_right":o="rect_left_inv_arrow";break;case"circle":o="circle";break;case"ellipse":o="ellipse";break;case"stadium":o="stadium";break;case"subroutine":o="subroutine";break;case"cylinder":o="cylinder";break;case"group":o="rect";break;case"doublecircle":o="doublecircle";break;default:o="rect"}const T=await P(t,S());l.setNode(r.id,{labelStyle:u.labelStyle,shape:o,labelText:T,labelType:r.labelType,rx:p,ry:p,class:y,style:u.style,id:r.id,link:r.link,linkTarget:r.linkTarget,tooltip:d.db.getTooltip(r.id)||"",domId:d.db.lookUpDomId(r.id),haveCallback:r.haveCallback,width:r.type==="group"?500:void 0,dir:r.dir,type:r.type,props:r.props,padding:S().flowchart.padding}),g.info("setNode",{labelStyle:u.labelStyle,labelType:r.labelType,shape:o,labelText:T,rx:p,ry:p,class:y,style:u.style,id:r.id,domId:d.db.lookUpDomId(r.id),width:r.type==="group"?500:void 0,type:r.type,dir:r.dir,props:r.props,padding:S().flowchart.padding})}},j=async function(e,l,c){g.info("abc78 edges = ",e);let a=0,i={},d,w;if(e.defaultStyle!==void 0){const n=B(e.defaultStyle);d=n.style,w=n.labelStyle}for(const n of e){a++;const b="L-"+n.start+"-"+n.end;i[b]===void 0?(i[b]=0,g.info("abc78 new entry",b,i[b])):(i[b]++,g.info("abc78 new entry",b,i[b]));let r=b+"-"+i[b];g.info("abc78 new link id to be used is",b,r,i[b]);const y="LS-"+n.start,u="LE-"+n.end,t={style:"",labelStyle:""};switch(t.minlen=n.length||1,n.type==="arrow_open"?t.arrowhead="none":t.arrowhead="normal",t.arrowTypeStart="arrow_open",t.arrowTypeEnd="arrow_open",n.type){case"double_arrow_cross":t.arrowTypeStart="arrow_cross";case"arrow_cross":t.arrowTypeEnd="arrow_cross";break;case"double_arrow_point":t.arrowTypeStart="arrow_point";case"arrow_point":t.arrowTypeEnd="arrow_point";break;case"double_arrow_circle":t.arrowTypeStart="arrow_circle";case"arrow_circle":t.arrowTypeEnd="arrow_circle";break}let s="",p="";switch(n.stroke){case"normal":s="fill:none;",d!==void 0&&(s=d),w!==void 0&&(p=w),t.thickness="normal",t.pattern="solid";break;case"dotted":t.thickness="normal",t.pattern="dotted",t.style="fill:none;stroke-width:2px;stroke-dasharray:3;";break;case"thick":t.thickness="thick",t.pattern="solid",t.style="stroke-width: 3.5px;fill:none;";break;case"invisible":t.thickness="invisible",t.pattern="solid",t.style="stroke-width: 0;fill:none;";break}if(n.style!==void 0){const o=B(n.style);s=o.style,p=o.labelStyle}t.style=t.style+=s,t.labelStyle=t.labelStyle+=p,n.interpolate!==void 0?t.curve=L(n.interpolate,N):e.defaultInterpolate!==void 0?t.curve=L(e.defaultInterpolate,N):t.curve=L(V.curve,N),n.text===void 0?n.style!==void 0&&(t.arrowheadStyle="fill: #333"):(t.arrowheadStyle="fill: #333",t.labelpos="c"),t.labelType=n.labelType,t.label=await P(n.text.replace(z.lineBreakRegex,`
`),S()),n.style===void 0&&(t.style=t.style||"stroke: #333; stroke-width: 1.5px;fill:none;"),t.labelStyle=t.labelStyle.replace("color:","fill:"),t.id=r,t.classes="flowchart-link "+y+" "+u,l.setEdge(n.start,n.end,t,a)}},ae=function(e,l){return l.db.getClasses()},oe=async function(e,l,c,a){g.info("Drawing flowchart");let i=a.db.getDirection();i===void 0&&(i="TD");const{securityLevel:d,flowchart:w}=S(),n=w.nodeSpacing||50,b=w.rankSpacing||50;let r;d==="sandbox"&&(r=C("#i"+l));const y=C(d==="sandbox"?r.nodes()[0].contentDocument.body:"body"),u=d==="sandbox"?r.nodes()[0].contentDocument:document,t=new F({multigraph:!0,compound:!0}).setGraph({rankdir:i,nodesep:n,ranksep:b,marginx:0,marginy:0}).setDefaultEdgeLabel(function(){return{}});let s;const p=a.db.getSubGraphs();g.info("Subgraphs - ",p);for(let f=p.length-1;f>=0;f--)s=p[f],g.info("Subgraph - ",s),a.db.addVertex(s.id,{text:s.title,type:s.labelType},"group",void 0,s.classes,s.dir);const o=a.db.getVertices(),T=a.db.getEdges();g.info("Edges",T);let k=0;for(k=p.length-1;k>=0;k--){s=p[k],re("cluster").append("text");for(let f=0;f<s.nodes.length;f++)g.info("Setting up subgraphs",s.nodes[f],s.id),t.setParent(s.nodes[f],s.id)}await R(o,t,l,y,u,a),await j(T,t);const _=y.select(`[id="${l}"]`),$=y.select("#"+l+" g");if(await Q($,t,["point","circle","cross"],"flowchart",l),W.insertTitle(_,"flowchartTitleText",w.titleTopMargin,a.db.getDiagramTitle()),H(t,_,w.diagramPadding,w.useMaxWidth),a.db.indexNodes("subGraph"+k),!w.htmlLabels){const f=u.querySelectorAll('[id="'+l+'"] .edgeLabel .label');for(const x of f){const m=x.getBBox(),h=u.createElementNS("http://www.w3.org/2000/svg","rect");h.setAttribute("rx",0),h.setAttribute("ry",0),h.setAttribute("width",m.width),h.setAttribute("height",m.height),x.insertBefore(h,x.firstChild)}}Object.keys(o).forEach(function(f){const x=o[f];if(x.link){const m=C("#"+l+' [id="'+f+'"]');if(m){const h=u.createElementNS("http://www.w3.org/2000/svg","a");h.setAttributeNS("http://www.w3.org/2000/svg","class",x.classes.join(" ")),h.setAttributeNS("http://www.w3.org/2000/svg","href",x.link),h.setAttributeNS("http://www.w3.org/2000/svg","rel","noopener"),d==="sandbox"?h.setAttributeNS("http://www.w3.org/2000/svg","target","_top"):x.linkTarget&&h.setAttributeNS("http://www.w3.org/2000/svg","target",x.linkTarget);const D=m.insert(function(){return h},":first-child"),I=m.select(".label-container");I&&D.append(function(){return I.node()});const G=m.select(".label");G&&D.append(function(){return G.node()})}}})},M={setConf:le,addVertices:R,addEdges:j,getClasses:ae,draw:oe},ne=(e,l)=>{const c=U,a=c(e,"r"),i=c(e,"g"),d=c(e,"b");return X(a,i,d,l)},se=e=>`.label {
    font-family: ${e.fontFamily};
    color: ${e.nodeTextColor||e.textColor};
  }
  .cluster-label text {
    fill: ${e.titleColor};
  }
  .cluster-label span,p {
    color: ${e.titleColor};
  }

  .label text,span,p {
    fill: ${e.nodeTextColor||e.textColor};
    color: ${e.nodeTextColor||e.textColor};
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${e.mainBkg};
    stroke: ${e.nodeBorder};
    stroke-width: 1px;
  }
  .flowchart-label text {
    text-anchor: middle;
  }
  // .flowchart-label .text-outer-tspan {
  //   text-anchor: middle;
  // }
  // .flowchart-label .text-inner-tspan {
  //   text-anchor: start;
  // }

  .node .katex path {
    fill: #000;
    stroke: #000;
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${e.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${e.lineColor};
    stroke-width: 2.0px;
  }

  .flowchart-link {
    stroke: ${e.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${e.edgeLabelBackground};
    rect {
      opacity: 0.5;
      background-color: ${e.edgeLabelBackground};
      fill: ${e.edgeLabelBackground};
    }
    text-align: center;
  }

  /* For html labels only */
  .labelBkg {
    background-color: ${ne(e.edgeLabelBackground,.5)};
    // background-color: 
  }

  .cluster rect {
    fill: ${e.clusterBkg};
    stroke: ${e.clusterBorder};
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${e.titleColor};
  }

  .cluster span,p {
    color: ${e.titleColor};
  }
  /* .cluster div {
    color: ${e.titleColor};
  } */

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${e.fontFamily};
    font-size: 12px;
    background: ${e.tertiaryColor};
    border: 1px solid ${e.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .flowchartTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${e.textColor};
  }
`,ie=se,ce={parser:q,db:A,renderer:M,styles:ie,init:e=>{e.flowchart||(e.flowchart={}),e.flowchart.arrowMarkerAbsolute=e.arrowMarkerAbsolute,J({flowchart:{arrowMarkerAbsolute:e.arrowMarkerAbsolute}}),M.setConf(e.flowchart),A.clear(),A.setGen("gen-2")}},ve=Object.freeze(Object.defineProperty({__proto__:null,diagram:ce},Symbol.toStringTag,{value:"Module"}));export{ee as a,te as b,me as c,xe as d,ke as e,M as f,ie as g,ve as h,ye as i};
