// gravocnox.js
window.addEventListener('load', () => {
  const MAX_POINTS = 15;
  // Agrega el mensaje de carga como un div hijo
  ['VOC','NOx'].forEach(id=>{
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

  function initBar(divId, label, color, yMin, yMax) {
    Plotly.newPlot(divId, [{ x: [], y: [], type: 'bar', name: label, marker: { color } }], {
      title: { text: label, font: { size: 20, color: 'black', family: 'Arial', weight: 'bold' } },
  // 'Tiempo' -> 'Hora de Medición'
  xaxis: { title: { text: 'Hora de Medición', font: { size: 14 } }, tickangle: -40 },
      yaxis: { title: { text: label }, range: (yMin!==null&&yMax!==null)?[yMin,yMax]:undefined },
      plot_bgcolor: '#cce5dc', paper_bgcolor: '#cce5dc', margin: { t:50,l:60,r:30,b:90 }, bargap:0.2
    });
  }

  function Series(divId){ this.divId=divId; this.x=[]; this.y=[]; this.keys=[]; }
  Series.prototype.add=function(key,label,val){ if(this.keys.includes(key))return; this.keys.push(key); this.x.push(label); this.y.push(val); if(this.x.length>MAX_POINTS){this.x.shift();this.y.shift();this.keys.shift();} Plotly.update(this.divId,{x:[this.x],y:[this.y]}); };
  Series.prototype.update=function(key,val){ const i=this.keys.indexOf(key); if(i===-1)return; this.y[i]=val; Plotly.restyle(this.divId,{y:[this.y]}); };

  initBar('VOC','VOC index','#ff8000',0,500);
  initBar('NOx','NOx index','#ff0040',0,100);
  const sVOC=new Series('VOC');
  const sNOx=new Series('NOx');

  const db=firebase.database();
  const base=db.ref('/historial_mediciones').orderByKey().limitToLast(MAX_POINTS);
    base.once('value',snap=>{
      const obj=snap.val();
      if(!obj)return;
      Object.entries(obj).forEach(([k,v])=>{
        const label=v.hora||v.tiempo||k.slice(-5);
        sVOC.add(k,label,Math.round(v.voc??0));
        sNOx.add(k,label,Math.round(v.nox??0));
      });
      // Elimina solo el div de carga
      ['VOC','NOx'].forEach(id=>{
        const loadingDiv = document.getElementById('loading-' + id);
        if(loadingDiv) loadingDiv.remove();
      });
    });

  db.ref('/historial_mediciones').limitToLast(1).on('child_added', snap=>{ const k=snap.key,v=snap.val(),label=v.hora||v.tiempo||k.slice(-5); sVOC.add(k,label,Math.round(v.voc??0)); sNOx.add(k,label,Math.round(v.nox??0)); });
  db.ref('/historial_mediciones').limitToLast(1).on('child_changed', snap=>{ const k=snap.key,v=snap.val(); sVOC.update(k,Math.round(v.voc??0)); sNOx.update(k,Math.round(v.nox??0)); });
});
