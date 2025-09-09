// grafpart.js
// grafpart.js
window.addEventListener("load", () => {
  const MAX_POINTS = 24; // mostrar últimos 24

  const loadingClass = 'loading-msg';
  ["chartPM1","chartPM2_5","chartPM4_0","chartPM10"].forEach(addLoading);

  let firstData = false;
  function removeLoading(){
    if(firstData) return; firstData = true;
    // Elimina solo los divs de mensaje de carga, nunca la gráfica
    document.querySelectorAll('.loading-msg').forEach(n=>{
      if(n.parentNode) n.parentNode.removeChild(n);
    });
  }
  function addLoading(divId){
    const el = document.getElementById(divId);
    if(!el) return;
    el.style.position = 'relative';
    if(!el.querySelector('.'+loadingClass)){
      el.insertAdjacentHTML('afterbegin', '<div class="'+loadingClass+'" style="position:absolute;top:4px;left:0;width:100%;text-align:center;font-size:18px;font-weight:bold;color:#154360;letter-spacing:.5px;pointer-events:none;">Cargando datos...</div>');
    }
  }

  function initBar(divId, label, color, yMin, yMax) {
    Plotly.newPlot(divId, [{
      x: [],
      y: [],
      type: 'bar',
      name: label,
      marker: { color }
    }], {
      title: { text: label, font: { size: 20, color: 'black', family: 'Arial', weight: 'bold' } },
      xaxis: {
        title: { text: 'Fecha y Hora de Medición', font: { size: 14, color: 'black', family: 'Arial', weight: 'bold' } },
        type: 'date',
        tickfont: { color: 'black', size: 12, family: 'Arial', weight: 'bold' },
        tickangle: -45
      },
      yaxis: {
        title: { text: label, font: { size: 14, color: 'black', family: 'Arial', weight: 'bold' } },
        tickfont: { color: 'black', size: 12, family: 'Arial', weight: 'bold' },
        range: (yMin !== null && yMax !== null) ? [yMin, yMax] : undefined
      },
      plot_bgcolor: '#cce5dc',
      paper_bgcolor: '#cce5dc',
      margin: { t: 50, l: 60, r: 30, b: 90 },
      bargap: 0.2
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

  function BarSeries(divId) {
    this.divId = divId;
    this.x = [];
    this.y = [];
    this.keys = []; // claves firebase para child_changed
  }
  BarSeries.prototype.addPoint = function(key, label, value) {
    if (this.keys.includes(key)) return; // ya existe
    this.keys.push(key);
    this.x.push(label);
    this.y.push(value);
    if (this.x.length > MAX_POINTS) {
      this.x.shift();
      this.y.shift();
      this.keys.shift();
    }
    // Mantener layout y color originales sin resetear fondo
    Plotly.update(this.divId, { x: [this.x], y: [this.y] });
  };
  BarSeries.prototype.updatePoint = function(key, newValue) {
    const idx = this.keys.indexOf(key);
    if (idx === -1) return;
    this.y[idx] = newValue;
    Plotly.restyle(this.divId, { y: [this.y] });
  };

  // Inicializar gráficas
  initBar("chartPM1", "PM1.0 µg/m³", "red", 0, 100);
  initBar("chartPM2_5", "PM2.5 µg/m³", "blue", 0, 300);
  initBar("chartPM4_0", "PM4.0 µg/m³", "green", 0, 500);
  initBar("chartPM10", "PM10.0 µg/m³", "#bf00ff", 0, 400);

  const sPM1 = new BarSeries('chartPM1');
  const sPM25 = new BarSeries('chartPM2_5');
  const sPM40 = new BarSeries('chartPM4_0');
  const sPM10 = new BarSeries('chartPM10');

  const db = firebase.database();
  const baseQuery = db.ref('/historial_mediciones').orderByKey().limitToLast(MAX_POINTS);

  // Cargar los últimos 15 existentes
  baseQuery.once('value', snap => {
    const dataObj = snap.val();
    if (!dataObj) return;
    const entries = Object.entries(dataObj); // [key, value]
    entries.forEach(([key, val]) => {
      const label = makeTimestamp(val);
      sPM1.addPoint(key, label, val.pm1p0 ?? 0);
      sPM25.addPoint(key, label, val.pm2p5 ?? 0);
      sPM40.addPoint(key, label, val.pm4p0 ?? 0);
      sPM10.addPoint(key, label, val.pm10p0 ?? 0);
    });
    removeLoading();
  });

  // Escuchar nuevos (después de los ya cargados)
  db.ref('/historial_mediciones').limitToLast(1).on('child_added', snap => {
    const key = snap.key;
    const val = snap.val();
    const label = makeTimestamp(val);
    sPM1.addPoint(key, label, val.pm1p0 ?? 0);
    sPM25.addPoint(key, label, val.pm2p5 ?? 0);
    sPM40.addPoint(key, label, val.pm4p0 ?? 0);
    sPM10.addPoint(key, label, val.pm10p0 ?? 0);
  });

  // Actualización si se modifica el último nodo
  db.ref('/historial_mediciones').limitToLast(1).on('child_changed', snap => {
    const key = snap.key;
    const val = snap.val();
    sPM1.updatePoint(key, val.pm1p0 ?? 0);
    sPM25.updatePoint(key, val.pm2p5 ?? 0);
    sPM40.updatePoint(key, val.pm4p0 ?? 0);
    sPM10.updatePoint(key, val.pm10p0 ?? 0);
  });
});
