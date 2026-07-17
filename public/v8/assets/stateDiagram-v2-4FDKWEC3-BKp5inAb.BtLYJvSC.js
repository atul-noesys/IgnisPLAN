import{x as d,i as Qt,a as te,o as ee,s as se,l as ie,c as re,Y,Z as _,b7 as ne,m as z,r as ae,a0 as oe,a2 as ce,V as le,v as he}from"./mermaid-4DMBBIKO-aeQWcf01.hEMfBQ84.js";var Dt=function(){var t=d(function(B,r,n,y){for(n=n||{},y=B.length;y--;n[B[y]]=r);return n},"o"),e=[1,2],a=[1,3],s=[1,4],h=[2,4],o=[1,9],g=[1,11],f=[1,16],c=[1,17],S=[1,18],v=[1,19],k=[1,33],D=[1,20],O=[1,21],I=[1,22],R=[1,23],b=[1,24],u=[1,26],C=[1,27],x=[1,28],N=[1,29],U=[1,30],F=[1,31],G=[1,32],it=[1,35],rt=[1,36],nt=[1,37],at=[1,38],V=[1,34],p=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],ot=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],Lt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],St={trace:d(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:d(function(B,r,n,y,m,i,L){var l=i.length-1;switch(m){case 3:return y.setRootDoc(i[l]),i[l];case 4:this.$=[];break;case 5:i[l]!="nl"&&(i[l-1].push(i[l]),this.$=i[l-1]);break;case 6:case 7:this.$=i[l];break;case 8:this.$="nl";break;case 12:this.$=i[l];break;case 13:const Z=i[l-1];Z.description=y.trimColon(i[l]),this.$=Z;break;case 14:this.$={stmt:"relation",state1:i[l-2],state2:i[l]};break;case 15:const ft=y.trimColon(i[l]);this.$={stmt:"relation",state1:i[l-3],state2:i[l-1],description:ft};break;case 19:this.$={stmt:"state",id:i[l-3],type:"default",description:"",doc:i[l-1]};break;case 20:var W=i[l],H=i[l-2].trim();if(i[l].match(":")){var lt=i[l].split(":");W=lt[0],H=[H,lt[1]]}this.$={stmt:"state",id:W,type:"default",description:H};break;case 21:this.$={stmt:"state",id:i[l-3],type:"default",description:i[l-5],doc:i[l-1]};break;case 22:this.$={stmt:"state",id:i[l],type:"fork"};break;case 23:this.$={stmt:"state",id:i[l],type:"join"};break;case 24:this.$={stmt:"state",id:i[l],type:"choice"};break;case 25:this.$={stmt:"state",id:y.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:i[l-1].trim(),note:{position:i[l-2].trim(),text:i[l].trim()}};break;case 29:this.$=i[l].trim(),y.setAccTitle(this.$);break;case 30:case 31:this.$=i[l].trim(),y.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:i[l-3],url:i[l-2],tooltip:i[l-1]};break;case 33:this.$={stmt:"click",id:i[l-3],url:i[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:i[l-1].trim(),classes:i[l].trim()};break;case 36:this.$={stmt:"style",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 37:this.$={stmt:"applyClass",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 38:y.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:y.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:y.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:y.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:i[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:a,6:s},{1:[3]},{3:5,4:e,5:a,6:s},{3:6,4:e,5:a,6:s},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],h,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:o,5:g,8:8,9:10,10:12,11:13,12:14,13:15,16:f,17:c,19:S,22:v,24:k,25:D,26:O,27:I,28:R,29:b,32:25,33:u,35:C,37:x,38:N,41:U,45:F,48:G,51:it,52:rt,53:nt,54:at,57:V},t(p,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:f,17:c,19:S,22:v,24:k,25:D,26:O,27:I,28:R,29:b,32:25,33:u,35:C,37:x,38:N,41:U,45:F,48:G,51:it,52:rt,53:nt,54:at,57:V},t(p,[2,7]),t(p,[2,8]),t(p,[2,9]),t(p,[2,10]),t(p,[2,11]),t(p,[2,12],{14:[1,40],15:[1,41]}),t(p,[2,16]),{18:[1,42]},t(p,[2,18],{20:[1,43]}),{23:[1,44]},t(p,[2,22]),t(p,[2,23]),t(p,[2,24]),t(p,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(p,[2,28]),{34:[1,49]},{36:[1,50]},t(p,[2,31]),{13:51,24:k,57:V},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(ot,[2,44],{58:[1,56]}),t(ot,[2,45],{58:[1,57]}),t(p,[2,38]),t(p,[2,39]),t(p,[2,40]),t(p,[2,41]),t(p,[2,6]),t(p,[2,13]),{13:58,24:k,57:V},t(p,[2,17]),t(Lt,h,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(p,[2,29]),t(p,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(p,[2,14],{14:[1,71]}),{4:o,5:g,8:8,9:10,10:12,11:13,12:14,13:15,16:f,17:c,19:S,21:[1,72],22:v,24:k,25:D,26:O,27:I,28:R,29:b,32:25,33:u,35:C,37:x,38:N,41:U,45:F,48:G,51:it,52:rt,53:nt,54:at,57:V},t(p,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(p,[2,34]),t(p,[2,35]),t(p,[2,36]),t(p,[2,37]),t(ot,[2,46]),t(ot,[2,47]),t(p,[2,15]),t(p,[2,19]),t(Lt,h,{7:78}),t(p,[2,26]),t(p,[2,27]),{5:[1,79]},{5:[1,80]},{4:o,5:g,8:8,9:10,10:12,11:13,12:14,13:15,16:f,17:c,19:S,21:[1,81],22:v,24:k,25:D,26:O,27:I,28:R,29:b,32:25,33:u,35:C,37:x,38:N,41:U,45:F,48:G,51:it,52:rt,53:nt,54:at,57:V},t(p,[2,32]),t(p,[2,33]),t(p,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:d(function(B,r){if(r.recoverable)this.trace(B);else{var n=new Error(B);throw n.hash=r,n}},"parseError"),parse:d(function(B){var r=this,n=[0],y=[],m=[null],i=[],L=this.table,l="",W=0,H=0,lt=2,Z=1,ft=i.slice.call(arguments,1),T=Object.create(this.lexer),K={yy:{}};for(var mt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,mt)&&(K.yy[mt]=this.yy[mt]);T.setInput(B,K.yy),K.yy.lexer=T,K.yy.parser=this,typeof T.yylloc>"u"&&(T.yylloc={});var _t=T.yylloc;i.push(_t);var qt=T.options&&T.options.ranges;typeof K.yy.parseError=="function"?this.parseError=K.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Zt(A){n.length=n.length-2*A,m.length=m.length-A,i.length=i.length-A}d(Zt,"popStack");function $t(){var A;return A=y.pop()||T.lex()||Z,typeof A!="number"&&(A instanceof Array&&(y=A,A=y.pop()),A=r.symbols_[A]||A),A}d($t,"lex");for(var $,M,w,Tt,X={},ht,P,vt,dt;;){if(M=n[n.length-1],this.defaultActions[M]?w=this.defaultActions[M]:(($===null||typeof $>"u")&&($=$t()),w=L[M]&&L[M][$]),typeof w>"u"||!w.length||!w[0]){var kt="";dt=[];for(ht in L[M])this.terminals_[ht]&&ht>lt&&dt.push("'"+this.terminals_[ht]+"'");T.showPosition?kt="Parse error on line "+(W+1)+`:
`+T.showPosition()+`
Expecting `+dt.join(", ")+", got '"+(this.terminals_[$]||$)+"'":kt="Parse error on line "+(W+1)+": Unexpected "+($==Z?"end of input":"'"+(this.terminals_[$]||$)+"'"),this.parseError(kt,{text:T.match,token:this.terminals_[$]||$,line:T.yylineno,loc:_t,expected:dt})}if(w[0]instanceof Array&&w.length>1)throw new Error("Parse Error: multiple actions possible at state: "+M+", token: "+$);switch(w[0]){case 1:n.push($),m.push(T.yytext),i.push(T.yylloc),n.push(w[1]),$=null,H=T.yyleng,l=T.yytext,W=T.yylineno,_t=T.yylloc;break;case 2:if(P=this.productions_[w[1]][1],X.$=m[m.length-P],X._$={first_line:i[i.length-(P||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(P||1)].first_column,last_column:i[i.length-1].last_column},qt&&(X._$.range=[i[i.length-(P||1)].range[0],i[i.length-1].range[1]]),Tt=this.performAction.apply(X,[l,H,W,K.yy,w[1],m,i].concat(ft)),typeof Tt<"u")return Tt;P&&(n=n.slice(0,-1*P*2),m=m.slice(0,-1*P),i=i.slice(0,-1*P)),n.push(this.productions_[w[1]][0]),m.push(X.$),i.push(X._$),vt=L[n[n.length-2]][n[n.length-1]],n.push(vt);break;case 3:return!0}}return!0},"parse")},Jt=function(){var B={EOF:1,parseError:d(function(r,n){if(this.yy.parser)this.yy.parser.parseError(r,n);else throw new Error(r)},"parseError"),setInput:d(function(r,n){return this.yy=n||this.yy||{},this._input=r,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:d(function(){var r=this._input[0];this.yytext+=r,this.yyleng++,this.offset++,this.match+=r,this.matched+=r;var n=r.match(/(?:\r\n?|\n).*/g);return n?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),r},"input"),unput:d(function(r){var n=r.length,y=r.split(/(?:\r\n?|\n)/g);this._input=r+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-n),this.offset-=n;var m=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),y.length-1&&(this.yylineno-=y.length-1);var i=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:y?(y.length===m.length?this.yylloc.first_column:0)+m[m.length-y.length].length-y[0].length:this.yylloc.first_column-n},this.options.ranges&&(this.yylloc.range=[i[0],i[0]+this.yyleng-n]),this.yyleng=this.yytext.length,this},"unput"),more:d(function(){return this._more=!0,this},"more"),reject:d(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:d(function(r){this.unput(this.match.slice(r))},"less"),pastInput:d(function(){var r=this.matched.substr(0,this.matched.length-this.match.length);return(r.length>20?"...":"")+r.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:d(function(){var r=this.match;return r.length<20&&(r+=this._input.substr(0,20-r.length)),(r.substr(0,20)+(r.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:d(function(){var r=this.pastInput(),n=new Array(r.length+1).join("-");return r+this.upcomingInput()+`
`+n+"^"},"showPosition"),test_match:d(function(r,n){var y,m,i;if(this.options.backtrack_lexer&&(i={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(i.yylloc.range=this.yylloc.range.slice(0))),m=r[0].match(/(?:\r\n?|\n).*/g),m&&(this.yylineno+=m.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:m?m[m.length-1].length-m[m.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+r[0].length},this.yytext+=r[0],this.match+=r[0],this.matches=r,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(r[0].length),this.matched+=r[0],y=this.performAction.call(this,this.yy,this,n,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),y)return y;if(this._backtrack){for(var L in i)this[L]=i[L];return!1}return!1},"test_match"),next:d(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var r,n,y,m;this._more||(this.yytext="",this.match="");for(var i=this._currentRules(),L=0;L<i.length;L++)if(y=this._input.match(this.rules[i[L]]),y&&(!n||y[0].length>n[0].length)){if(n=y,m=L,this.options.backtrack_lexer){if(r=this.test_match(y,i[L]),r!==!1)return r;if(this._backtrack){n=!1;continue}else return!1}else if(!this.options.flex)break}return n?(r=this.test_match(n,i[m]),r!==!1?r:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:d(function(){var r=this.next();return r||this.lex()},"lex"),begin:d(function(r){this.conditionStack.push(r)},"begin"),popState:d(function(){var r=this.conditionStack.length-1;return r>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:d(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:d(function(r){return r=this.conditionStack.length-1-Math.abs(r||0),r>=0?this.conditionStack[r]:"INITIAL"},"topState"),pushState:d(function(r){this.begin(r)},"pushState"),stateStackSize:d(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:d(function(r,n,y,m){switch(y){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:break;case 9:break;case 10:return 5;case 11:break;case 12:break;case 13:break;case 14:break;case 15:return this.pushState("SCALE"),17;case 16:return 18;case 17:this.popState();break;case 18:return this.begin("acc_title"),33;case 19:return this.popState(),"acc_title_value";case 20:return this.begin("acc_descr"),35;case 21:return this.popState(),"acc_descr_value";case 22:this.begin("acc_descr_multiline");break;case 23:this.popState();break;case 24:return"acc_descr_multiline_value";case 25:return this.pushState("CLASSDEF"),41;case 26:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 27:return this.popState(),this.pushState("CLASSDEFID"),42;case 28:return this.popState(),43;case 29:return this.pushState("CLASS"),48;case 30:return this.popState(),this.pushState("CLASS_STYLE"),49;case 31:return this.popState(),50;case 32:return this.pushState("STYLE"),45;case 33:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;case 34:return this.popState(),47;case 35:return this.pushState("SCALE"),17;case 36:return 18;case 37:this.popState();break;case 38:this.pushState("STATE");break;case 39:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;case 40:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;case 41:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;case 42:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;case 43:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;case 44:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;case 45:return 51;case 46:return 52;case 47:return 53;case 48:return 54;case 49:this.pushState("STATE_STRING");break;case 50:return this.pushState("STATE_ID"),"AS";case 51:return this.popState(),"ID";case 52:this.popState();break;case 53:return"STATE_DESCR";case 54:return 19;case 55:this.popState();break;case 56:return this.popState(),this.pushState("struct"),20;case 57:break;case 58:return this.popState(),21;case 59:break;case 60:return this.begin("NOTE"),29;case 61:return this.popState(),this.pushState("NOTE_ID"),59;case 62:return this.popState(),this.pushState("NOTE_ID"),60;case 63:this.popState(),this.pushState("FLOATING_NOTE");break;case 64:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";case 65:break;case 66:return"NOTE_TEXT";case 67:return this.popState(),"ID";case 68:return this.popState(),this.pushState("NOTE_TEXT"),24;case 69:return this.popState(),n.yytext=n.yytext.substr(2).trim(),31;case 70:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),31;case 71:return 6;case 72:return 6;case 73:return 16;case 74:return 57;case 75:return 24;case 76:return n.yytext=n.yytext.trim(),14;case 77:return 15;case 78:return 28;case 79:return 58;case 80:return 5;case 81:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[12,13],inclusive:!1},struct:{rules:[12,13,25,29,32,38,45,46,47,48,57,58,59,60,74,75,76,77,78],inclusive:!1},FLOATING_NOTE_ID:{rules:[67],inclusive:!1},FLOATING_NOTE:{rules:[64,65,66],inclusive:!1},NOTE_TEXT:{rules:[69,70],inclusive:!1},NOTE_ID:{rules:[68],inclusive:!1},NOTE:{rules:[61,62,63],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[34],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[33],inclusive:!1},CLASS_STYLE:{rules:[31],inclusive:!1},CLASS:{rules:[30],inclusive:!1},CLASSDEFID:{rules:[28],inclusive:!1},CLASSDEF:{rules:[26,27],inclusive:!1},acc_descr_multiline:{rules:[23,24],inclusive:!1},acc_descr:{rules:[21],inclusive:!1},acc_title:{rules:[19],inclusive:!1},SCALE:{rules:[16,17,36,37],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[51],inclusive:!1},STATE_STRING:{rules:[52,53],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[12,13,39,40,41,42,43,44,49,50,54,55,56],inclusive:!1},ID:{rules:[12,13],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,18,20,22,25,29,32,35,38,56,60,71,72,73,74,75,76,77,79,80,81],inclusive:!0}}};return B}();St.lexer=Jt;function ct(){this.yy={}}return d(ct,"Parser"),ct.prototype=St,St.Parser=ct,new ct}();Dt.parser=Dt;var de=Dt,ue="TB",Yt="TB",It="dir",q="state",J="root",Ct="relation",pe="classDef",ye="style",ge="applyClass",et="default",Pt="divider",Ft="fill:none",Gt="fill: #333",jt="c",Ut="text",Wt="normal",bt="rect",Et="rectWithTitle",Se="stateStart",fe="stateEnd",At="divider",wt="roundedWithTitle",me="note",_e="noteGroup",st="statediagram",Te="state",ke=`${st}-${Te}`,Kt="transition",be="note",Ee="note-edge",De=`${Kt} ${Ee}`,Ce=`${st}-${be}`,xe="cluster",Le=`${st}-${xe}`,$e="cluster-alt",ve=`${st}-${$e}`,Mt="parent",zt="note",Ie="state",xt="----",Ae=`${xt}${zt}`,Ot=`${xt}${Mt}`,Vt=d((t,e=Yt)=>{if(!t.doc)return e;let a=e;for(const s of t.doc)s.stmt==="dir"&&(a=s.value);return a},"getDir"),we=d(function(t,e){return e.db.getClasses()},"getClasses"),Oe=d(async function(t,e,a,s){_.info("REF0:"),_.info("Drawing state diagram (v2)",e);const{securityLevel:h,state:o,layout:g}=Y();s.db.extract(s.db.getRootDocV2());const f=s.db.getData(),c=oe(e,h);f.type=s.type,f.layoutAlgorithm=g,f.nodeSpacing=(o==null?void 0:o.nodeSpacing)||50,f.rankSpacing=(o==null?void 0:o.rankSpacing)||50,f.markers=["barb"],f.diagramId=e,await ce(f,c);const S=8;try{(typeof s.db.getLinks=="function"?s.db.getLinks():new Map).forEach((v,k)=>{var C;const D=typeof k=="string"?k:typeof(k==null?void 0:k.id)=="string"?k.id:"";if(!D){_.warn("⚠️ Invalid or missing stateId from key:",JSON.stringify(k));return}const O=(C=c.node())==null?void 0:C.querySelectorAll("g");let I;if(O==null||O.forEach(x=>{var N;((N=x.textContent)==null?void 0:N.trim())===D&&(I=x)}),!I){_.warn("⚠️ Could not find node matching text:",D);return}const R=I.parentNode;if(!R){_.warn("⚠️ Node has no parent, cannot wrap:",D);return}const b=document.createElementNS("http://www.w3.org/2000/svg","a"),u=v.url.replace(/^"+|"+$/g,"");if(b.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",u),b.setAttribute("target","_blank"),v.tooltip){const x=v.tooltip.replace(/^"+|"+$/g,"");b.setAttribute("title",x)}R.replaceChild(b,I),b.appendChild(I),_.info("🔗 Wrapped node in <a> tag for:",D,v.url)})}catch(v){_.error("❌ Error injecting clickable links:",v)}le.insertTitle(c,"statediagramTitleText",(o==null?void 0:o.titleTopMargin)??25,s.db.getDiagramTitle()),he(c,S,st,(o==null?void 0:o.useMaxWidth)??!0)},"draw"),Re={getClasses:we,draw:Oe,getDir:Vt},yt=new Map,j=0;function gt(t="",e=0,a="",s=xt){const h=a!==null&&a.length>0?`${s}${a}`:"";return`${Ie}-${t}${h}-${e}`}d(gt,"stateDomId");var Ne=d((t,e,a,s,h,o,g,f)=>{_.trace("items",e),e.forEach(c=>{switch(c.stmt){case q:tt(t,c,a,s,h,o,g,f);break;case et:tt(t,c,a,s,h,o,g,f);break;case Ct:{tt(t,c.state1,a,s,h,o,g,f),tt(t,c.state2,a,s,h,o,g,f);const S={id:"edge"+j,start:c.state1.id,end:c.state2.id,arrowhead:"normal",arrowTypeEnd:"arrow_barb",style:Ft,labelStyle:"",label:z.sanitizeText(c.description??"",Y()),arrowheadStyle:Gt,labelpos:jt,labelType:Ut,thickness:Wt,classes:Kt,look:g};h.push(S),j++}break}})},"setupDoc"),Rt=d((t,e=Yt)=>{let a=e;if(t.doc)for(const s of t.doc)s.stmt==="dir"&&(a=s.value);return a},"getDir");function Q(t,e,a){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(h=>{const o=a.get(h);o&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...o.styles])}));const s=t.find(h=>h.id===e.id);s?Object.assign(s,e):t.push(e)}d(Q,"insertOrUpdateNode");function Ht(t){var e;return((e=t==null?void 0:t.classes)==null?void 0:e.join(" "))??""}d(Ht,"getClassesFromDbInfo");function Xt(t){return(t==null?void 0:t.styles)??[]}d(Xt,"getStylesFromDbInfo");var tt=d((t,e,a,s,h,o,g,f)=>{var O,I,R;const c=e.id,S=a.get(c),v=Ht(S),k=Xt(S),D=Y();if(_.info("dataFetcher parsedItem",e,S,k),c!=="root"){let b=bt;e.start===!0?b=Se:e.start===!1&&(b=fe),e.type!==et&&(b=e.type),yt.get(c)||yt.set(c,{id:c,shape:b,description:z.sanitizeText(c,D),cssClasses:`${v} ${ke}`,cssStyles:k});const u=yt.get(c);e.description&&(Array.isArray(u.description)?(u.shape=Et,u.description.push(e.description)):(O=u.description)!=null&&O.length&&u.description.length>0?(u.shape=Et,u.description===c?u.description=[e.description]:u.description=[u.description,e.description]):(u.shape=bt,u.description=e.description),u.description=z.sanitizeTextOrArray(u.description,D)),((I=u.description)==null?void 0:I.length)===1&&u.shape===Et&&(u.type==="group"?u.shape=wt:u.shape=bt),!u.type&&e.doc&&(_.info("Setting cluster for XCX",c,Rt(e)),u.type="group",u.isGroup=!0,u.dir=Rt(e),u.shape=e.type===Pt?At:wt,u.cssClasses=`${u.cssClasses} ${Le} ${o?ve:""}`);const C={labelStyle:"",shape:u.shape,label:u.description,cssClasses:u.cssClasses,cssCompiledStyles:[],cssStyles:u.cssStyles,id:c,dir:u.dir,domId:gt(c,j),type:u.type,isGroup:u.type==="group",padding:8,rx:10,ry:10,look:g};if(C.shape===At&&(C.label=""),t&&t.id!=="root"&&(_.trace("Setting node ",c," to be child of its parent ",t.id),C.parentId=t.id),C.centerLabel=!0,e.note){const x={labelStyle:"",shape:me,label:e.note.text,cssClasses:Ce,cssStyles:[],cssCompiledStyles:[],id:c+Ae+"-"+j,domId:gt(c,j,zt),type:u.type,isGroup:u.type==="group",padding:(R=D.flowchart)==null?void 0:R.padding,look:g,position:e.note.position},N=c+Ot,U={labelStyle:"",shape:_e,label:e.note.text,cssClasses:u.cssClasses,cssStyles:[],id:c+Ot,domId:gt(c,j,Mt),type:"group",isGroup:!0,padding:16,look:g,position:e.note.position};j++,U.id=N,x.parentId=N,Q(s,U,f),Q(s,x,f),Q(s,C,f);let F=c,G=x.id;e.note.position==="left of"&&(F=x.id,G=c),h.push({id:F+"-"+G,start:F,end:G,arrowhead:"none",arrowTypeEnd:"",style:Ft,labelStyle:"",classes:De,arrowheadStyle:Gt,labelpos:jt,labelType:Ut,thickness:Wt,look:g})}else Q(s,C,f)}e.doc&&(_.trace("Adding nodes children "),Ne(e,e.doc,a,s,h,!o,g,f))},"dataFetcher"),Be=d(()=>{yt.clear(),j=0},"reset"),E={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Nt=d(()=>new Map,"newClassesList"),Bt=d(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),ut=d(t=>JSON.parse(JSON.stringify(t)),"clone"),pt,Ye=(pt=class{constructor(t){this.version=t,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Nt(),this.documents={root:Bt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=Qt,this.setAccTitle=te,this.getAccDescription=ee,this.setAccDescription=se,this.setDiagramTitle=ie,this.getDiagramTitle=re,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this)}extract(t){this.clear(!0);for(const s of Array.isArray(t)?t:t.doc)switch(s.stmt){case q:this.addState(s.id.trim(),s.type,s.doc,s.description,s.note);break;case Ct:this.addRelation(s.state1,s.state2,s.description);break;case pe:this.addStyleClass(s.id.trim(),s.classes);break;case ye:this.handleStyleDef(s);break;case ge:this.setCssClass(s.id.trim(),s.styleClass);break;case"click":this.addLink(s.id,s.url,s.tooltip);break}const e=this.getStates(),a=Y();Be(),tt(void 0,this.getRootDocV2(),e,this.nodes,this.edges,!0,a.look,this.classes);for(const s of this.nodes)if(Array.isArray(s.label)){if(s.description=s.label.slice(1),s.isGroup&&s.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${s.id}]`);s.label=s.label[0]}}handleStyleDef(t){const e=t.id.trim().split(","),a=t.styleClass.split(",");for(const s of e){let h=this.getState(s);if(!h){const o=s.trim();this.addState(o),h=this.getState(o)}h&&(h.styles=a.map(o=>{var g;return(g=o.replace(/;/g,""))==null?void 0:g.trim()}))}}setRootDoc(t){_.info("Setting root doc",t),this.rootDoc=t,this.version===1?this.extract(t):this.extract(this.getRootDocV2())}docTranslator(t,e,a){if(e.stmt===Ct){this.docTranslator(t,e.state1,!0),this.docTranslator(t,e.state2,!1);return}if(e.stmt===q&&(e.id===E.START_NODE?(e.id=t.id+(a?"_start":"_end"),e.start=a):e.id=e.id.trim()),e.stmt!==J&&e.stmt!==q||!e.doc)return;const s=[];let h=[];for(const o of e.doc)if(o.type===Pt){const g=ut(o);g.doc=ut(h),s.push(g),h=[]}else h.push(o);if(s.length>0&&h.length>0){const o={stmt:q,id:ne(),type:"divider",doc:ut(h)};s.push(ut(o)),e.doc=s}e.doc.forEach(o=>this.docTranslator(e,o,!0))}getRootDocV2(){return this.docTranslator({id:J,stmt:J},{id:J,stmt:J,doc:this.rootDoc},!0),{id:J,doc:this.rootDoc}}addState(t,e=et,a=void 0,s=void 0,h=void 0,o=void 0,g=void 0,f=void 0){const c=t==null?void 0:t.trim();if(!this.currentDocument.states.has(c))_.info("Adding state ",c,s),this.currentDocument.states.set(c,{stmt:q,id:c,descriptions:[],type:e,doc:a,note:h,classes:[],styles:[],textStyles:[]});else{const S=this.currentDocument.states.get(c);if(!S)throw new Error(`State not found: ${c}`);S.doc||(S.doc=a),S.type||(S.type=e)}if(s&&(_.info("Setting state description",c,s),(Array.isArray(s)?s:[s]).forEach(S=>this.addDescription(c,S.trim()))),h){const S=this.currentDocument.states.get(c);if(!S)throw new Error(`State not found: ${c}`);S.note=h,S.note.text=z.sanitizeText(S.note.text,Y())}o&&(_.info("Setting state classes",c,o),(Array.isArray(o)?o:[o]).forEach(S=>this.setCssClass(c,S.trim()))),g&&(_.info("Setting state styles",c,g),(Array.isArray(g)?g:[g]).forEach(S=>this.setStyle(c,S.trim()))),f&&(_.info("Setting state styles",c,g),(Array.isArray(f)?f:[f]).forEach(S=>this.setTextStyle(c,S.trim())))}clear(t){this.nodes=[],this.edges=[],this.documents={root:Bt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Nt(),t||(this.links=new Map,ae())}getState(t){return this.currentDocument.states.get(t)}getStates(){return this.currentDocument.states}logDocuments(){_.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(t,e,a){this.links.set(t,{url:e,tooltip:a}),_.warn("Adding link",t,e,a)}getLinks(){return this.links}startIdIfNeeded(t=""){return t===E.START_NODE?(this.startEndCount++,`${E.START_TYPE}${this.startEndCount}`):t}startTypeIfNeeded(t="",e=et){return t===E.START_NODE?E.START_TYPE:e}endIdIfNeeded(t=""){return t===E.END_NODE?(this.startEndCount++,`${E.END_TYPE}${this.startEndCount}`):t}endTypeIfNeeded(t="",e=et){return t===E.END_NODE?E.END_TYPE:e}addRelationObjs(t,e,a=""){const s=this.startIdIfNeeded(t.id.trim()),h=this.startTypeIfNeeded(t.id.trim(),t.type),o=this.startIdIfNeeded(e.id.trim()),g=this.startTypeIfNeeded(e.id.trim(),e.type);this.addState(s,h,t.doc,t.description,t.note,t.classes,t.styles,t.textStyles),this.addState(o,g,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.currentDocument.relations.push({id1:s,id2:o,relationTitle:z.sanitizeText(a,Y())})}addRelation(t,e,a){if(typeof t=="object"&&typeof e=="object")this.addRelationObjs(t,e,a);else if(typeof t=="string"&&typeof e=="string"){const s=this.startIdIfNeeded(t.trim()),h=this.startTypeIfNeeded(t),o=this.endIdIfNeeded(e.trim()),g=this.endTypeIfNeeded(e);this.addState(s,h),this.addState(o,g),this.currentDocument.relations.push({id1:s,id2:o,relationTitle:a?z.sanitizeText(a,Y()):void 0})}}addDescription(t,e){var h;const a=this.currentDocument.states.get(t),s=e.startsWith(":")?e.replace(":","").trim():e;(h=a==null?void 0:a.descriptions)==null||h.push(z.sanitizeText(s,Y()))}cleanupLabel(t){return t.startsWith(":")?t.slice(2).trim():t.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(t,e=""){this.classes.has(t)||this.classes.set(t,{id:t,styles:[],textStyles:[]});const a=this.classes.get(t);e&&a&&e.split(E.STYLECLASS_SEP).forEach(s=>{const h=s.replace(/([^;]*);/,"$1").trim();if(RegExp(E.COLOR_KEYWORD).exec(s)){const o=h.replace(E.FILL_KEYWORD,E.BG_FILL).replace(E.COLOR_KEYWORD,E.FILL_KEYWORD);a.textStyles.push(o)}a.styles.push(h)})}getClasses(){return this.classes}setCssClass(t,e){t.split(",").forEach(a=>{var h;let s=this.getState(a);if(!s){const o=a.trim();this.addState(o),s=this.getState(o)}(h=s==null?void 0:s.classes)==null||h.push(e)})}setStyle(t,e){var a,s;(s=(a=this.getState(t))==null?void 0:a.styles)==null||s.push(e)}setTextStyle(t,e){var a,s;(s=(a=this.getState(t))==null?void 0:a.textStyles)==null||s.push(e)}getDirectionStatement(){return this.rootDoc.find(t=>t.stmt===It)}getDirection(){var t;return((t=this.getDirectionStatement())==null?void 0:t.value)??ue}setDirection(t){const e=this.getDirectionStatement();e?e.value=t:this.rootDoc.unshift({stmt:It,value:t})}trimColon(t){return t.startsWith(":")?t.slice(1).trim():t.trim()}getData(){const t=Y();return{nodes:this.nodes,edges:this.edges,other:{},config:t,direction:Vt(this.getRootDocV2())}}getConfig(){return Y().state}},d(pt,"StateDB"),pt.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},pt),Pe=d(t=>`
defs #statediagram-barbEnd {
    fill: ${t.transitionColor};
    stroke: ${t.transitionColor};
  }
g.stateGroup text {
  fill: ${t.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${t.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${t.stateLabelColor};
}

g.stateGroup rect {
  fill: ${t.mainBkg};
  stroke: ${t.nodeBorder};
}

g.stateGroup line {
  stroke: ${t.lineColor};
  stroke-width: 1;
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: 1;
  fill: none;
}

.stateGroup .composit {
  fill: ${t.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${t.noteBorderColor};
  fill: ${t.noteBkgColor};

  text {
    fill: ${t.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${t.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${t.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${t.edgeLabelBackground};
  p {
    background-color: ${t.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${t.edgeLabelBackground};
    fill: ${t.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${t.transitionLabelColor||t.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${t.transitionLabelColor||t.tertiaryTextColor};
}

.stateLabel text {
  fill: ${t.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node .fork-join {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node circle.state-end {
  fill: ${t.innerEndBackground};
  stroke: ${t.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${t.compositeBackground||t.background};
  // stroke: ${t.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${t.stateBkg||t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: 1px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: 1px;
}
#statediagram-barbEnd {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: 1px;
}

.cluster-label, .nodeLabel {
  color: ${t.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${t.stateBorder||t.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${t.compositeBackground||t.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${t.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${t.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${t.noteTextColor};
}

#dependencyStart, #dependencyEnd {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: 1;
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}
`,"getStyles"),Fe=Pe,Ge={parser:de,get db(){return new Ye(2)},renderer:Re,styles:Fe,init:d(t=>{t.state||(t.state={}),t.state.arrowMarkerAbsolute=t.arrowMarkerAbsolute},"init")};const Ue=Object.freeze(Object.defineProperty({__proto__:null,diagram:Ge},Symbol.toStringTag,{value:"Module"}));export{de as B,Ye as M,Fe as U,Ue as s};
