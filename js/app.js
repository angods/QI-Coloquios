(function(){
  var root=document.documentElement, $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var store={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

  /* tema */
  var theme=store.get('cq-theme',null);
  if(theme==='dark'||theme==='light') root.setAttribute('data-theme',theme);
  $('#theme-btn').addEventListener('click',function(){
    var cur=root.getAttribute('data-theme')||((window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');
    theme=cur==='dark'?'light':'dark'; root.setAttribute('data-theme',theme); store.set('cq-theme',theme);
  });

  /* estado */
  var done={}; (store.get('cq-done',[])||[]).forEach(function(k){done[k]=1});
  var views=$$('.view'), cols=$$('.view.col');
  var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};

  /* índice por coloquio */
  cols.forEach(function(v){
    var box=$('.idx-in',v), h='<p class="ptxt"></p><span class="pbar"><i></i></span>';
    $$('.sec',v).forEach(function(s){
      h+='<h4><a href="#'+s.id+'">'+s.dataset.sec+'</a></h4><div class="nums">';
      $$('.item',s).forEach(function(it){h+='<a href="#'+it.id+'" data-for="'+it.id+'" title="'+$('.num small',it).textContent+' '+it.dataset.n+'">'+it.dataset.n.replace(' bis','b')+'</a>'});
      h+='</div>';
    });
    box.innerHTML=h;
    if(window.matchMedia&&matchMedia('(max-width:900px)').matches) $('.idx details',v).open=false;
  });

  function chip(id){return $('.nums a[data-for="'+id+'"]')}
  function refresh(){
    var total=0;
    cols.forEach(function(v){
      var items=$$('.item',v), n=0;
      items.forEach(function(it){var d=!!done[it.id]; if(d)n++; it.classList.toggle('is-done',d); var cb=$('input[data-k]',it); cb.checked=d; var c=chip(it.id); if(c)c.classList.toggle('is-done',d)});
      total+=n;
      $('.ptxt',v).textContent=n+' de '+items.length+' hechos';
      $('.pbar i',v).style.width=(items.length?100*n/items.length:0)+'%';
      var row=$('.crow[data-col="'+v.dataset.view+'"]');
      if(row){$('.bar i',row).style.width=(items.length?100*n/items.length:0)+'%'; $('.cprog',row).textContent=n+' de '+items.length+' hechos'}
    });
    $('#home-prog').innerHTML='<b>'+total+'</b> marcados como hechos';
  }

  function setOpen(it,open){
    var b=$('.reveal',it), a=$('.ans',it);
    a.hidden=!open; b.setAttribute('aria-expanded',open?'true':'false'); b.textContent=open?'Ocultar resolución':'Ver resolución';
    var c=chip(it.id); if(c)c.classList.toggle('is-open',open);
  }

  document.addEventListener('click',function(e){
    var t=e.target.closest('.reveal'); if(t){var it=t.closest('.item'); setOpen(it,$('.ans',it).hidden); return}
    var act=e.target.closest('[data-act]');
    if(act){
      var v=act.closest('.view'), a=act.dataset.act;
      if(a==='pend'){var on=act.getAttribute('aria-pressed')!=='true'; act.setAttribute('aria-pressed',on?'true':'false'); v.classList.toggle('only-pend',on)}
      else $$('.item',v).forEach(function(it){ if(!it.hidden) setOpen(it,a==='open') });
      return;
    }
    var link=e.target.closest('a[href^="#"]');
    if(link){e.preventDefault(); go(link.getAttribute('href').slice(1),true)}
  });
  document.addEventListener('change',function(e){
    var k=e.target&&e.target.dataset&&e.target.dataset.k; if(!k)return;
    if(e.target.checked)done[k]=1; else delete done[k];
    store.set('cq-done',Object.keys(done)); refresh();
  });

  /* búsqueda */
  cols.forEach(function(v){
    var inp=$('.search input',v), out=$('.found',v), cache=null;
    inp.addEventListener('input',function(){
      var q=norm(inp.value.trim()), n=0;
      if(!cache) cache=$$('.item',v).map(function(it){return [it,norm(it.textContent)]});
      cache.forEach(function(p){var hit=!q||p[1].indexOf(q)>-1; p[0].hidden=!hit; if(hit)n++; var c=chip(p[0].id); if(c)c.classList.toggle('is-hid',!hit)});
      $$('.sec',v).forEach(function(s){s.hidden=!$$('.item',s).some(function(it){return !it.hidden})});
      $$('.sub',v).forEach(function(s){s.hidden=!!q});
      out.textContent=q?(n===0?'Sin coincidencias. Probar con otra palabra o borrar la búsqueda.':n+(n===1?' ejercicio coincide':' ejercicios coinciden')):'';
    });
  });

  /* suplemento: búsqueda y tabla periódica */
  (function(){
    var v=$('.view.sup'); if(!v) return;
    if(window.matchMedia&&matchMedia('(max-width:900px)').matches) $('.idx details',v).open=false;
    var inp=$('#s-sup'), out=$('.found',v), rows=null, fix=function(s){return norm(s).replace(/\u2212/g,'-')};
    inp.addEventListener('input',function(){
      var q=fix(inp.value.trim()), n=0, groups=$$('.fg',v);
      if(!rows) rows=$$('.fr',v).map(function(r){return [r,fix(r.textContent),r.closest('.fg')]});
      groups.forEach(function(g){var k=fix(g.dataset.key).split(' '); g._m=!!q&&(k[0]===q||(q.length>=3&&k.slice(1).join(' ').indexOf(q)===0))});
      rows.forEach(function(p){var hit=!q||p[1].indexOf(q)>-1||(p[2]&&p[2]._m); p[0].hidden=!hit; if(hit)n++});
      $$('.fg,.dg,.elist,.scroll,.tsplit,.stgrid,.ptw',v).forEach(function(b){ if(b.classList.contains('fr')) return; var fr=$$('.fr',b); if(fr.length) b.hidden=!!q&&!fr.some(function(r){return !r.hidden})});
      $$('.ssec',v).forEach(function(s){s.hidden=!!q&&!$$('.fr',s).some(function(r){return !r.hidden}); s.classList.toggle('flt',!!q)});
      out.textContent=q?(n?n+(n===1?' coincidencia':' coincidencias'):'Sin coincidencias. Probar con la fórmula (NaCl), el símbolo (Fe) o el nombre del elemento.'):'';
    });
    var zb=$('#pt-zoom'), zi=$('#pt-img');
    if(zb) zb.addEventListener('click',function(){var on=!zi.classList.contains('real'); zi.classList.toggle('real',on); zb.setAttribute('aria-pressed',on?'true':'false'); zb.textContent=on?'Ajustar al ancho':'Ver a tamaño real'});
  })();

  /* tabla periódica interactiva */
  var tpOpen=null;
  (function(){
    var v=$('.view.tp'), src=$('#tp-data'); if(!v||!src) return;
    var E=JSON.parse(src.textContent), bySym={}, byPos={}, cells={};
    var grid=$('#tp-grid'), ficha=$('#tp-ficha'), legend=$('#tp-legend'), note=$('#tp-note'), found=$('#tp-found');
    var modeSel=$('#tp-mode'), qInp=$('#tp-q'), tInp=$('#tp-temp'), tBox=$('#tp-tempbox'), tLab=$('#tp-templab');
    var CAT={alk:'Metales alcalinos',aem:'Metales alcalinotérreos',tm:'Metales de transición',pm:'Otros metales',md:'Metaloides',nm:'No metales',hal:'Halógenos',ng:'Gases nobles',la:'Lantánidos',ac:'Actínidos',x:'Propiedades desconocidas'};
    var CAT1={alk:'Metal alcalino',aem:'Metal alcalinotérreo',tm:'Metal de transición',pm:'Metal del bloque p',md:'Metaloide',nm:'No metal',hal:'Halógeno',ng:'Gas noble',la:'Lantánido',ac:'Actínido',x:'Propiedades químicas desconocidas'};
    var CAS=['','IA','IIA','IIIB','IVB','VB','VIB','VIIB','VIIIB','VIIIB','VIIIB','IB','IIB','IIIA','IVA','VA','VIA','VIIA','VIIIA'];
    var ST={sol:'Sólido',liq:'Líquido',gas:'Gas',na:'Sin medición'};
    var SEQ={
      en:{t:'Electronegatividad (Pauling)',u:'',dec:2,get:function(e){return e.en}},
      ie:{t:'1.ª energía de ionización',u:'kJ/mol',dec:0,get:function(e){return e.iet?null:(e.ie?e.ie[0]:null)}},
      rc:{t:'Radio covalente',u:'pm',dec:0,get:function(e){return e.rc}},
      ea:{t:'Afinidad electrónica',u:'kJ/mol',dec:0,get:function(e){return e.eae?null:e.ea}},
      d:{t:'Densidad',u:'g/cm³',dec:1,get:function(e){return e.d==null?null:(e.dg?e.d/1000:e.d)}},
      mp:{t:'Punto de fusión',u:'°C',dec:0,get:function(e){return e.mpp?null:(e.mp!=null?e.mp:(e.sub!=null?e.sub:null))}}
    };
    var NOTES={
      block:'El bloque f se muestra con 15 elementos por fila, como en la tabla de la cátedra. Según el criterio, La y Ac o Lu y Lr se asignan al bloque d.',
      state:'Estado a 1 atm, calculado con los puntos de fusión y ebullición medidos. El carbono y el arsénico subliman. El helio no solidifica a 1 atm.',
      ea:'Rayado: el anión es inestable (afinidad negativa) o solo hay valores calculados.',
      d:'Sólidos y líquidos cerca de 20 °C; gases a 0 °C y 1 atm. Rayado: solo hay densidades predichas.',
      mp:'Para el carbono y el arsénico se usa el punto de sublimación. Rayado: sin dato medido.',
      ie:'Rayado: sin valor experimental.',
      cat:'Los elementos 109 a 118 se obtuvieron de a pocos átomos y su química casi no se conoce.'
    };
    var NB=' ', MIN='−';
    function fmt(x,dec){
      if(x==null) return '–';
      var s=(dec==null?String(x):x.toFixed(dec)), neg=s.charAt(0)==='-'; if(neg) s=s.slice(1);
      var p=s.split('.'); if(p[0].length>4) p[0]=p[0].replace(/\B(?=(\d{3})+$)/g,NB);
      return (neg?MIN:'')+p[0]+(p[1]?','+p[1]:'');
    }
    function trim(x,maxDec){ return fmt(parseFloat(x.toFixed(maxDec))) }
    function ox(n){ return n===0?'0':(n>0?'+':MIN)+Math.abs(n) }
    function ecHtml(ec){ return '<span class="ecf">'+ec.replace(/(\d[spdf])(\d+)/g,'$1<sup>$2</sup>')+'</span>' }
    function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]}) }
    function stateAt(e,T){
      if(e.z>=100||e.mpp) return 'na';
      if(e.sub!=null) return T<e.sub?'sol':'gas';
      if(e.mp==null) return e.bp==null?'na':(T<e.bp?'liq':'gas');
      if(T<e.mp) return 'sol';
      if(e.bp==null) return 'liq';
      if(T<e.bp) return 'liq';
      return e.bpp?'na':'gas';
    }
    function pos(e){ /* [fila, columna] en la grilla; fila 1 = encabezado de grupos */
      if(e.z>=57&&e.z<=71) return [10,e.z-57+4];
      if(e.z>=89&&e.z<=103) return [11,e.z-89+4];
      return [e.p+1,e.g+1];
    }

    /* grilla */
    var h='<div></div>';
    for(var g=1;g<=18;g++) h+='<div class="gh" style="grid-column:'+(g+1)+'" title="Grupo '+g+' ('+CAS[g]+')"><b>'+g+'</b><small>'+CAS[g]+'</small></div>';
    for(var p=1;p<=7;p++) h+='<div class="ph" style="grid-row:'+(p+1)+';grid-column:1" title="Período '+p+'">'+p+'</div>';
    h+='<div class="fgap" style="grid-row:9"></div><div class="ph" style="grid-row:10;grid-column:1" title="Lantánidos, período 6">6</div><div class="ph" style="grid-row:11;grid-column:1" title="Actínidos, período 7">7</div>';
    h+='<button type="button" class="elph" style="grid-row:7;grid-column:4" data-jump="La" tabindex="-1" aria-label="Lantánidos, elementos 57 a 71">57–71</button><button type="button" class="elph" style="grid-row:8;grid-column:4" data-jump="Ac" tabindex="-1" aria-label="Actínidos, elementos 89 a 103">89–103</button>';
    h+='<div class="peek"><div class="peek-in" id="tp-peek"></div></div>';
    E.forEach(function(e){
      bySym[e.s]=e; var q=pos(e); e._r=q[0]; e._c=q[1]; byPos[q[0]+','+q[1]]=e;
      e._n=norm(e.n+' '+(e.alt||''));
      h+='<button type="button" class="pel" id="el-'+e.s+'" data-s="'+e.s+'" style="grid-row:'+q[0]+';grid-column:'+q[1]+'" tabindex="-1" aria-label="'+e.n+', '+e.s+', número atómico '+e.z+'"><span class="zn">'+e.z+'</span><span class="sy">'+e.s+'</span><span class="vl"></span></button>';
    });
    grid.innerHTML=h;
    E.forEach(function(e){cells[e.s]=$('#el-'+e.s,grid)});
    var peek=$('#tp-peek');

    /* color y leyenda */
    var mode='cat', filt=null, temp=25, sel=null;
    function keyOf(e){
      if(mode==='cat') return e.c;
      if(mode==='block') return e.b;
      if(mode==='state') return stateAt(e,temp);
      return e._q;
    }
    function paint(){
      var sq=SEQ[mode], lo=0, hi=0, step=0, counts={}, items=[];
      if(sq){
        var vals=E.map(sq.get).filter(function(x){return x!=null}); lo=Math.min.apply(null,vals); hi=Math.max.apply(null,vals); step=(hi-lo)/6;
        E.forEach(function(e){var x=sq.get(e); e._q=x==null?'na':'q'+Math.min(5,Math.floor((x-lo)/step))});
      }
      E.forEach(function(e){
        var k=keyOf(e), c=cells[e.s], x; counts[k]=(counts[k]||0)+1; c.dataset.k=k; e._k=k;
        if(sq){ x=sq.get(e); $('.vl',c).textContent=x==null?'–':(mode==='d'&&e.dg?'gas':(mode==='en'?fmt(x,2):mode==='d'?trim(x,1):mode==='ea'?trim(x,0):fmt(Math.round(x)))) }
        else $('.vl',c).textContent=e.a;
      });
      if(mode==='cat') items=Object.keys(CAT).map(function(k){return [k,CAT[k]]});
      else if(mode==='block') items=['s','p','d','f'].map(function(k){return [k,'Bloque '+k]});
      else if(mode==='state') items=['sol','liq','gas','na'].map(function(k){return [k,ST[k]]});
      else { for(var i=0;i<6;i++) items.push(['q'+i,fmt(lo+i*step,sq.dec)+' a '+fmt(i===5?hi:lo+(i+1)*step,sq.dec)]); items.push(['na','Sin dato medido']) }
      if(filt&&!counts[filt]) filt=null;
      legend.innerHTML=(sq?'<span class="tag lgt-t">'+sq.t+(sq.u?' · '+sq.u:'')+'</span>':'')+items.map(function(it){
        return '<button type="button" class="lgb'+(sq?' seq':'')+'" data-k="'+it[0]+'" aria-pressed="'+(filt===it[0]?'true':'false')+'"'+(counts[it[0]]?'':' disabled')+'><i data-k="'+it[0]+'"></i>'+it[1]+' <small>'+(counts[it[0]]||0)+'</small></button>';
      }).join('');
      note.textContent=NOTES[mode]||'';
      tBox.hidden=mode!=='state';
      dim();
    }
    function dim(){
      var q=norm(qInp.value.trim()), n=0, first=null;
      E.forEach(function(e){
        var hit=true;
        if(q) hit=e.s.toLowerCase().indexOf(q)===0||String(e.z)===q||e._n.split(' ').some(function(w){return w.indexOf(q)===0})||(q.length>=3&&e._n.indexOf(q)>-1);
        if(hit&&q){n++; if(!first||e.s.toLowerCase()===q) first=e}
        cells[e.s].classList.toggle('dim',!hit||(!!filt&&e._k!==filt));
      });
      found.textContent=q?(n===0?'Sin coincidencias. Probar con el símbolo (Fe), el nombre o el número atómico.':n+(n===1?' elemento coincide. Enter abre su ficha.':' elementos coinciden. Enter abre el primero.')):'';
      qInp._first=q?first:null;
    }

    /* vista rápida y ficha */
    function tile(e,big){ return '<div class="ptile" data-k="'+e.c+'"><span class="zn">'+e.z+'</span><span class="sy">'+e.s+'</span><span class="vl">'+e.a+'</span></div>' }
    var PK={en:'EN',ie:'1.ª E. ioniz.',rc:'Radio cov.',ea:'Afin. electr.',d:'Densidad',mp:'P. fusión'};
    function peekProp(e){
      var sq=SEQ[mode], x;
      if(!sq||mode==='en') return e.en!=null?' · <span class="pk">EN</span> '+fmt(e.en,2):'';
      x=sq.get(e); if(x==null) return ' · <span class="pk">'+PK[mode]+'</span> sin dato medido';
      if(mode==='d') return ' · <span class="pk">Densidad</span> '+fmt(e.d)+(e.dg?' g/L':' g/cm³');
      return ' · <span class="pk">'+PK[mode]+'</span> '+trim(x,mode==='mp'||mode==='ie'?1:mode==='ea'?2:0)+' '+sq.u;
    }
    function showPeek(e){
      var oxs=e.ox?e.ox.map(ox).join(', '):'sin datos';
      peek.innerHTML=tile(e)+'<div class="pinfo"><h3>'+e.n+'</h3><p class="pm">Z = '+e.z+' · '+e.a+' u · '+CAT1[e.c]+'</p><p>'+ecHtml(e.ec)+'</p><p><span class="pk">Oxidación</span> '+oxs+peekProp(e)+'</p></div>';
    }
    function est(){ return '<span class="est">estimado</span>' }
    function row(k,vhtml){ return '<div><dt>'+k+'</dt><dd>'+vhtml+'</dd></div>' }
    function tempHtml(c,pred){ var k=c+273.15; return (pred?'≈ '+fmt(Math.round(c))+' °C <small>('+fmt(Math.round(k))+' K)</small>'+est():trim(c,Math.abs(c)<1000?2:0)+' °C <small>('+trim(k,Math.abs(k)<1000?2:0)+' K)</small>') }
    function boxes(e){
      var t=e.ec.split(' ').filter(function(x){return x.charAt(0)!=='['}), L={s:1,p:3,d:5,f:7};
      return '<div class="boxes" role="img" aria-label="Diagrama de cajas de los subniveles externos: '+t.join(' ')+'">'+t.map(function(x){
        var m=/^(\d[spdf])(\d+)$/.exec(x), nb=L[m[1].charAt(1)], n=+m[2], r='';
        for(var i=0;i<nb;i++){ var up=i<n, dn=n>nb&&i<n-nb; r+='<span class="bxc">'+(up?'↑':'')+(dn?'↓':'')+'</span>' }
        return '<span class="bxs"><span class="row">'+r+'</span>'+m[1]+'</span>';
      }).join('')+'</div>';
    }
    function showFicha(e){
      var i=E.indexOf(e), pv=E[i-1], nx=E[i+1], st=stateAt(e,25), a, s='';
      var grp=e.g?'Grupo '+e.g+' ('+CAS[e.g]+')':(e.c==='la'?'Serie de los lantánidos':'Serie de los actínidos');
      s+='<header class="fhead">'+tile(e)+'<div class="fname"><h2>'+e.n+(e.alt?'<small>también '+e.alt+'</small>':'')+'</h2><div class="fmeta"><span class="kc" data-k="'+e.c+'">'+CAT1[e.c]+'</span><span>'+grp+'</span><span>Período '+e.p+'</span><span>Bloque '+e.b+'</span></div></div>';
      s+='<div class="fnav"><button type="button" class="ghost" data-go="'+(pv?pv.s:'')+'"'+(pv?'':' disabled')+' aria-label="Elemento anterior'+(pv?': '+pv.n:'')+'">← '+(pv?pv.z+' '+pv.s:'')+'</button><button type="button" class="ghost" data-go="'+(nx?nx.s:'')+'"'+(nx?'':' disabled')+' aria-label="Elemento siguiente'+(nx?': '+nx.n:'')+'">'+(nx?nx.z+' '+nx.s:'')+' →</button><button type="button" class="ghost" data-up="1">↑ Tabla</button></div></header>';
      s+='<div class="fgrid">';
      /* estructura electrónica */
      a=row('Configuración',ecHtml(e.ec)+(e.ecp?est():''));
      a+=row('Electrones por capa',e.sh.join(' · '));
      a+=row('Desapareados',e.un+' <small>'+(e.un?'átomo paramagnético':'átomo diamagnético')+'</small>');
      a+=row('Z<sub>ef</sub> del electrón '+e.zo,fmt(e.zf,2)+' <small>reglas de Slater · <a href="#c2-p15b">cómo se calcula</a></small>');
      s+='<section class="fsec"><h3>Estructura electrónica</h3>'+boxes(e)+'<dl class="kv">'+a+'</dl></section>';
      /* propiedades periódicas */
      a=row('Electronegatividad',e.en!=null?fmt(e.en,2)+' <small>Pauling'+(e.enn?' · '+e.enn:'')+'</small>':'<small>sin valor asignado</small>');
      if(e.ie){
        a+=row('1.ª energía de ionización',trim(e.ie[0],1)+' kJ/mol <small>('+trim(e.iev,3)+' eV)</small>'+(e.iet?est():''));
        if(e.ie[1]!=null) a+=row('2.ª y 3.ª ionización',trim(e.ie[1],0)+(e.ie[2]!=null?' · '+trim(e.ie[2],0):'')+' kJ/mol'+(e.iet?est():''));
      } else a+=row('Energía de ionización','<small>sin datos</small>');
      if(e.ea==null) a+=row('Afinidad electrónica','<small>sin datos</small>');
      else if(e.ea<0) a+=row('Afinidad electrónica','negativa <small>anión inestable; ≈ '+trim(e.ea,0)+' kJ/mol</small>'+est());
      else a+=row('Afinidad electrónica',trim(e.ea,e.ea<20?2:1)+' kJ/mol'+(e.eae?est():''));
      a+=row('Radio atómico',e.ra!=null?e.ra+' pm <small>empírico</small>':'<small>sin datos</small>');
      a+=row('Radio covalente',e.rc!=null?e.rc+' pm':'<small>sin datos</small>');
      a+=row('Radio de van der Waals',e.rv!=null?e.rv+' pm':'<small>sin datos</small>');
      s+='<section class="fsec"><h3>Propiedades periódicas</h3><dl class="kv">'+a+'</dl></section>';
      /* estados de oxidación y enlaces al suplemento */
      a='';
      if(e.ox) a+='<p class="dh">Más frecuentes</p><div class="oxl">'+e.ox.map(function(n){return '<b>'+ox(n)+'</b>'}).join('')+'</div>';
      if(e.ox2) a+='<p class="dh">'+(e.ox?'Otros conocidos':'Conocidos')+'</p><div class="oxl">'+e.ox2.map(function(n){return '<span>'+ox(n)+'</span>'}).join('')+'</div>';
      if(!e.ox&&!e.ox2) a+='<p class="empty">'+(e.c==='ng'?'No se conocen compuestos estables.':'Sin datos experimentales.')+'</p>';
      var lk='';
      if(document.getElementById('sup-hf-'+e.s)) lk+='<a href="#sup-hf-'+e.s+'">Calores de formación de compuestos de '+e.s+'</a>';
      if(document.getElementById('sup-eq-'+e.s)) lk+='<a href="#sup-eq-'+e.s+'">Equilibrios y potenciales de '+e.s+'</a>';
      lk+='<a href="#sup-ionizacion">Potenciales de ionización</a><a href="#sup-radios">Radios</a>';
      s+='<section class="fsec"><h3>Estados de oxidación</h3>'+a+'<h3 class="h2nd">En el suplemento de la cátedra</h3><div class="flinks">'+lk+'</div></section>';
      /* propiedades físicas */
      a=row('Estado a 25 °C',st==='na'?'<small>sin medición'+(e.z>=100?'; se obtuvo de a pocos átomos':'')+'</small>':ST[st].toLowerCase());
      if(e.d!=null) a+=row('Densidad',fmt(e.d)+(e.dg?' g/L <small>gas a 0 °C y 1 atm</small>':' g/cm³'));
      else a+=row('Densidad',e.dt?'≈ '+e.dt+' g/cm³'+est():'<small>sin datos</small>');
      if(e.sub!=null) a+=row('Sublimación',tempHtml(e.sub,false)+' <small>no funde a 1 atm</small>');
      else {
        a+=row('Punto de fusión',e.mp!=null?tempHtml(e.mp,e.mpp):(e.z===2?'<small>no solidifica a 1 atm</small>':'<small>sin datos</small>'));
        a+=row('Punto de ebullición',e.bp!=null?tempHtml(e.bp,e.bpp):'<small>sin datos</small>');
      }
      if(e.al) a+=row('Forma considerada',e.al);
      a+=row('Origen',{p:'primordial <small>presente desde la formación de la Tierra</small>',d:'trazas naturales <small>por desintegración de otros elementos</small>',s:'sintético'}[e.or]);
      a+=row('Isótopos estables',e.rad?'ninguno <small>radiactivo</small>':'sí');
      s+='<section class="fsec"><h3>Propiedades físicas</h3><dl class="kv">'+a+'</dl></section>';
      s+='</div>';
      ficha.innerHTML=s;
    }
    function select(e,opts){
      opts=opts||{};
      if(sel) cells[sel.s].removeAttribute('aria-current');
      E.forEach(function(x){cells[x.s].tabIndex=-1});
      sel=e; var c=cells[e.s]; c.setAttribute('aria-current','true'); c.tabIndex=0;
      showPeek(e); showFicha(e); store.set('cq-el',e.s);
      if(opts.hash!==false&&!v.hidden){try{history.replaceState(null,'','#tp-'+e.s)}catch(err){}}
      if(opts.focus) c.focus({preventScroll:!!opts.noScroll});
      if(opts.reveal&&window.matchMedia&&matchMedia('(max-width:700px)').matches) ficha.scrollIntoView({block:'start',behavior:'smooth'});
    }

    grid.addEventListener('click',function(ev){
      var j=ev.target.closest('[data-jump]'); if(j){select(bySym[j.dataset.jump],{focus:true}); return}
      var c=ev.target.closest('.pel'); if(c) select(bySym[c.dataset.s],{reveal:true});
    });
    grid.addEventListener('mouseover',function(ev){var c=ev.target.closest('.pel'); if(c) showPeek(bySym[c.dataset.s])});
    grid.addEventListener('mouseleave',function(){if(sel) showPeek(sel)});
    grid.addEventListener('focusin',function(ev){var c=ev.target.closest('.pel'); if(c) showPeek(bySym[c.dataset.s])});
    grid.addEventListener('keydown',function(ev){
      var c=ev.target.closest('.pel'); if(!c) return;
      var d={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[ev.key]; if(!d) return;
      ev.preventDefault();
      var e=bySym[c.dataset.s], r=e._r, col=e._c, n=null;
      for(var i=0;i<20&&!n;i++){ r+=d[0]; col+=d[1]; if(r===9) r+=d[0]; if(r<2||r>11||col<2||col>19) break; n=byPos[r+','+col] }
      if(n){ c.tabIndex=-1; if(sel) cells[sel.s].tabIndex=-1; cells[n.s].tabIndex=0; cells[n.s].focus() }
    });
    grid.addEventListener('focusout',function(ev){ if(!grid.contains(ev.relatedTarget)){ E.forEach(function(e){cells[e.s].tabIndex=-1}); if(sel) cells[sel.s].tabIndex=0 } });
    ficha.addEventListener('click',function(ev){
      var b=ev.target.closest('[data-go]'); if(b&&b.dataset.go){select(bySym[b.dataset.go]); return}
      if(ev.target.closest('[data-up]')){ $('.ptx-scroll',v).scrollIntoView({block:'center',behavior:'smooth'}); if(sel) cells[sel.s].focus({preventScroll:true}) }
    });
    legend.addEventListener('click',function(ev){var b=ev.target.closest('.lgb'); if(!b) return; filt=filt===b.dataset.k?null:b.dataset.k; paint()});
    modeSel.addEventListener('change',function(){mode=modeSel.value; filt=null; store.set('cq-tpmode',mode); paint(); if(sel) showPeek(sel)});
    qInp.addEventListener('input',dim);
    qInp.addEventListener('keydown',function(ev){ if(ev.key==='Enter'&&qInp._first){ev.preventDefault(); select(qInp._first,{reveal:true})} });
    function setTemp(t){ temp=t; tInp.value=t; tLab.textContent=fmt(t)+' °C ('+fmt(t+273)+' K)'; if(mode==='state') paint() }
    tInp.addEventListener('input',function(){setTemp(+tInp.value)});
    $('#tp-temp25').addEventListener('click',function(){setTemp(25)});

    var m0=store.get('cq-tpmode','cat'); if(m0==='cat'||m0==='block'||m0==='state'||SEQ[m0]){mode=m0; modeSel.value=m0}
    setTemp(25); paint();
    select(bySym[store.get('cq-el','Fe')]||bySym.Fe,{hash:false});
    tpOpen=function(sym){ var e=sym&&bySym[sym]; if(e&&e!==sel) select(e,{hash:false}) };
  })();

  /* navegación */
  var cur='inicio';
  function go(hash,push){
    if(hash==='sup-tabla') hash='tp';
    var view='inicio', target=null, m=/^(c\d+|sup|tp)(-.+)?$/.exec(hash||'');
    if(m&&$('.view[data-view="'+m[1]+'"]')){view=m[1]; if(m[2]) target=document.getElementById(hash)}
    if(view==='tp'){ if(m[2]&&!(target&&target.closest('.tpsrc'))){ target=null; if(tpOpen) tpOpen(m[2].slice(1)) } }
    if(push){try{history.pushState(null,'','#'+(hash||'inicio'))}catch(e){try{location.hash=hash||'inicio'}catch(e2){}}}
    var changed=view!==cur; cur=view;
    views.forEach(function(v){v.hidden=v.dataset.view!==view});
    $$('.tabs a').forEach(function(a){if(a.dataset.tab===view){a.setAttribute('aria-current','page'); if(a.scrollIntoView&&changed)a.scrollIntoView({block:'nearest',inline:'center'})}else a.removeAttribute('aria-current')});
    if(/^c\d+$/.test(view)) store.set('cq-last',view);
    if(target){
      if(target.hidden||target.offsetParent===null){var inp=$('.search input',target.closest('.view')); if(inp&&inp.value){inp.value=''; inp.dispatchEvent(new Event('input'))}}
      target.scrollIntoView({block:'start',behavior:(changed||Math.abs(target.getBoundingClientRect().top)>2500)?'instant':'smooth'});
      if(target.classList.contains('item')){target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash')}
    } else if(changed||push) window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  window.addEventListener('popstate',function(){go(location.hash.slice(1),false)});
  window.addEventListener('hashchange',function(){go(location.hash.slice(1),false)});

  /* reinicio con confirmación en la página */
  var rb=$('#reset-btn'), rm=$('#reset-msg'), armed=0;
  rb.addEventListener('click',function(){
    if(!armed){armed=setTimeout(function(){armed=0; rb.textContent='Borrar mi progreso'; rm.textContent=''},5000); rb.textContent='Confirmar: borrar todo'; rm.textContent='Se desmarcan todos los ejercicios. Tocar de nuevo para confirmar.'; return}
    clearTimeout(armed); armed=0; done={}; store.set('cq-done',[]); refresh(); rb.textContent='Borrar mi progreso'; rm.textContent='Progreso borrado.';
  });

  refresh();
  var last=store.get('cq-last',null), cta=$('#cta');
  if(last&&$('.view[data-view="'+last+'"]')&&Object.keys(done).length){cta.href='#'+last; cta.textContent='Seguir en el Coloquio '+last.slice(1)+' →'}
  go((location.hash||'').slice(1),false);
})();
