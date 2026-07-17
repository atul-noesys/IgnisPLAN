import{u as C,x as f,a as v,i as P,l as F,c as z,o as S,s as W,J as u,G as E,r as T,Z as w,q as D,y as A}from"./mermaid-4DMBBIKO-aeQWcf01.hEMfBQ84.js";import{t as R}from"./chunk-4BX2VUAB-td2OqKA1.DBSBiVWL.js";import{F as Y}from"./treemap-KMMF4GRG-B5KZi85L.BHQhpbHC.js";import"./draw.1LjimNmP.js";import"./charts.D6xE-8ZL.js";import"./graphql.DVg4m3qB.js";import"./icons.S3_PtPfx.js";import"./pdf.-AIUeXwf.js";import"./pivot.CceBwBAf.js";import"./ordinal-B6-f3MAq.DAOx55Wy.js";import"./init-DjUOC4st.CSqNXydp.js";import"./result-helper.BcR65Z3h.js";import"./zh-HK-E62DVLB3.C13dU2nJ.js";import"./min-DgiN0H8F.BRNpAMkt.js";var q=C.packet,m,x=(m=class{constructor(){this.packet=[],this.setAccTitle=v,this.getAccTitle=P,this.setDiagramTitle=F,this.getDiagramTitle=z,this.getAccDescription=S,this.setAccDescription=W}getConfig(){const t=u({...q,...E().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){T(),this.packet=[]}},f(m,"PacketDB"),m),G=1e4,H=f((t,e)=>{R(t,e);let o=-1,r=[],l=1;const{bitsPerRow:n}=e.getConfig();for(let{start:a,end:s,bits:d,label:c}of t.blocks){if(a!==void 0&&s!==void 0&&s<a)throw new Error(`Packet block ${a} - ${s} is invalid. End must be greater than start.`);if(a??(a=o+1),a!==o+1)throw new Error(`Packet block ${a} - ${s??a} is not contiguous. It should start from ${o+1}.`);if(d===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(s??(s=a+(d??1)-1),d??(d=s-a+1),o=s,w.debug(`Packet block ${a} - ${o} with label ${c}`);r.length<=n+1&&e.getPacket().length<G;){const[p,i]=L({start:a,end:s,bits:d,label:c},l,n);if(r.push(p),p.end+1===l*n&&(e.pushWord(r),r=[],l++),!i)break;({start:a,end:s,bits:d,label:c}=i)}}e.pushWord(r)},"populate"),L=f((t,e,o)=>{if(t.start===void 0)throw new Error("start should have been set during first phase");if(t.end===void 0)throw new Error("end should have been set during first phase");if(t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*o)return[t,void 0];const r=e*o-1,l=e*o;return[{start:t.start,end:r,label:t.label,bits:r-t.start},{start:l,end:t.end,label:t.label,bits:t.end-l}]},"getNextFittingBlock"),y={parser:{yy:void 0},parse:f(async t=>{var r;const e=await Y("packet",t),o=(r=y.parser)==null?void 0:r.yy;if(!(o instanceof x))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");w.debug(e),H(e,o)},"parse")},j=f((t,e,o,r)=>{const l=r.db,n=l.getConfig(),{rowHeight:a,paddingY:s,bitWidth:d,bitsPerRow:c}=n,p=l.getPacket(),i=l.getDiagramTitle(),b=a+s,h=b*(p.length+1)-(i?0:a),k=d*c+2,g=D(e);g.attr("viewbox",`0 0 ${k} ${h}`),A(g,h,k,n.useMaxWidth);for(const[$,B]of p.entries())I(g,B,$,n);g.append("text").text(i).attr("x",k/2).attr("y",h-b/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),I=f((t,e,o,{rowHeight:r,paddingX:l,paddingY:n,bitWidth:a,bitsPerRow:s,showBits:d})=>{const c=t.append("g"),p=o*(r+n)+n;for(const i of e){const b=i.start%s*a+1,h=(i.end-i.start+1)*a-l;if(c.append("rect").attr("x",b).attr("y",p).attr("width",h).attr("height",r).attr("class","packetBlock"),c.append("text").attr("x",b+h/2).attr("y",p+r/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(i.label),!d)continue;const k=i.end===i.start,g=p-2;c.append("text").attr("x",b+(k?h/2:0)).attr("y",g).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",k?"middle":"start").text(i.start),k||c.append("text").attr("x",b+h).attr("y",g).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(i.end)}},"drawWord"),J={draw:j},M={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},N=f(({packet:t}={})=>{const e=u(M,t);return`
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles"),st={parser:y,get db(){return new x},renderer:J,styles:N};export{st as diagram};
