// grafamb.js
// grafamb.js
window.addEventListener('load', () => {
  const MAX_POINTS = 24;
  // Agrega el mensaje de carga como un div hijo
  ['CO2','TEM','HUM'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading-' + id;
      loadingDiv.style.padding = '22px';
      loadingDiv.style.fontSize = '18px';
      loadingDiv.style.fontWeight = 'bold';
      loadingDiv.style.color = '#154360';
      loadingDiv.style.textAlign = 'center';
      loadingDiv.textContent = 'Cargando datos...';
      el.appendChild(loadingDiv);
    }
  });

  function initBar(divId, label, color, yMin, yMax){
    Plotly.newPlot(divId,[{x:[],y:[],type:'bar',name:label,marker:{color}}],{
      title:{text:label,font:{size:20,color:'black'}},
      xaxis:{
        title:{text:'Fecha y Hora de Medición'},
        tickangle:-45,
        type:'date'
      },
      yaxis:{title:{text:label},range:(yMin!==null&&yMax!==null)?[yMin,yMax]:undefined},
      plot_bgcolor:'#cce5dc',paper_bgcolor:'#cce5dc',margin:{t:50,l:60,r:30,b:90},bargap:0.2
    });
  }

  function toIsoDate(fecha){
    if(!fecha || typeof fecha !== 'string'){
      const d=new Date();
      const mm=String(d.getMonth()+1).padStart(2,'0');
      const dd=String(d.getDate()).padStart(2,'0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    }
    const [dd,mm,yy] = fecha.split('-');
    const yyyy = yy && yy.length===2 ? `20${yy}` : (yy||new Date().getFullYear());
    return `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  }
  function makeTimestamp(v){
    const isoDate = toIsoDate(v.fecha);
    const h = v.hora || v.tiempo || '00:00:00';
    return `${isoDate} ${h}`;
  }

  function Series(divId){ this.divId=divId; this.x=[]; this.y=[]; this.keys=[]; }
  Series.prototype.add=function(key,label,val){ if(this.keys.includes(key))return; this.keys.push(key); this.x.push(label); this.y.push(val); if(this.x.length>MAX_POINTS){this.x.shift();this.y.shift();this.keys.shift();} Plotly.update(this.divId,{x:[this.x],y:[this.y]}); };
  Series.prototype.update=function(key,val){ const i=this.keys.indexOf(key); if(i===-1)return; this.y[i]=val; Plotly.restyle(this.divId,{y:[this.y]}); };

  initBar('CO2','CO2 ppm','#990000',300,1000);
  initBar('TEM','Temperatura °C','#006600',20,50);
  initBar('HUM','Humedad Relativa %','#0000cc',0,100);

  const sCO2=new Series('CO2');
  const sTEM=new Series('TEM');
  const sHUM=new Series('HUM');

  const db=firebase.database();
  const base=db.ref('/historial_mediciones').orderByKey().limitToLast(MAX_POINTS);
  base.once('value',snap=>{
    const obj=snap.val();
    if(!obj)return;
    Object.entries(obj).forEach(([k,v])=>{
      const label = makeTimestamp(v);
      sCO2.add(k,label,v.co2??0);
      sTEM.add(k,label,v.cTe??0);
      sHUM.add(k,label,Math.round(v.cHu??0));
    });
    // Elimina solo el div de carga
    ['CO2','TEM','HUM'].forEach(id=>{
      const loadingDiv = document.getElementById('loading-' + id);
      if(loadingDiv) loadingDiv.remove();
    });
  });

  db.ref('/historial_mediciones').limitToLast(1).on('child_added', snap=>{ const k=snap.key,v=snap.val(),label=makeTimestamp(v); sCO2.add(k,label,v.co2??0); sTEM.add(k,label,v.cTe??0); sHUM.add(k,label,Math.round(v.cHu??0)); });
  db.ref('/historial_mediciones').limitToLast(1).on('child_changed', snap=>{ const k=snap.key,v=snap.val(); sCO2.update(k,v.co2??0); sTEM.update(k,v.cTe??0); sHUM.update(k,Math.round(v.cHu??0)); });
});
