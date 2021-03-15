
function redraw(r,g,i,h,l,rb){

	h=[h];
	if(rb)
		h=Array(Math.ceil(11)).fill().map((element, index) => index*0.1);
	// plot1
	//console.log(r,g,i,h,l,rb)

 	var x=Array(Math.ceil(4*3*l)).fill().map((element, index) => index/4);
 	var traces1=[];
 	var traces2=[];
 	for (var idx = h.length - 1; idx >= 0; idx--) {
		var y1=x.map(x => Math.min(Math.max(0,i+x/l*(h[idx]-r)),1)*100);
		var y2=x.map(x => Math.min(Math.max(0, Math.pow((1-1/l),x)*(i-h[idx])+h[idx]),1)*100);
		traces1.push({
			x: x,
			y: y1.map( y => y.toFixed(2)),
			mode: 'lines',
			name:'h='+(h[idx]*100).toFixed(0)+'%'
		});

		traces2.push({
			x: x,
			y: y2.map( y => y.toFixed(2)),
			mode: 'lines',
			name: 'h='+(h[idx]*100).toFixed(0)+'%'
		});
	}

	var goalLine ={
			x: [0,500],
			y: [g*100, g*100],
			mode: 'lines',
			name:'Goal line',
			line: {
				color: 'rgb(0, 0, 0)',
				width: 2
			}
		}

	traces1.push(goalLine);
	traces2.push(goalLine);


	Plotly.newPlot('constantRatios', traces1, { title:'Gender ratio in function of time,<br> under constant hiring and retirement ratio hypothesis',yaxis:{range:[0,100]},xaxis:{range:[0,2.99*l]} },{displaylogo: false, responsive: true});
	Plotly.newPlot('evolutionaryState', traces2, { title:'Gender ratio in function of time,<br> under evolutionary retirement ratio and constant hiring hypothesis<br>(retirement equal the gender proportion)',yaxis:{range:[0,100]},xaxis:{range:[0,2.99*l]} },{displaylogo: false, responsive: true});

}

function updateDynamic(r,g,i,h,l,rb){
	$('.val-h').html((h*100).toFixed(0));
	$('.val-r').html((r*100).toFixed(0));
	$('.val-g').html((g*100).toFixed(0));
	$('.val-i').html((i*100).toFixed(0));
	$('.val-l').html(l);


	$('#dynamic-const').html((l*(g-i)/h).toFixed(2));
	$('#dynamic-const-r-eq-i').html((l*(g-i)/(h-i)).toFixed(2));
	var x=(Math.log((g-h)/(i-h))/Math.log(1-1/l));
	console.log(x)
	$('#dynamic-evol').html(x.toFixed(2));
}

function requestRedraw(){
	updateDynamic($("#input-r").val()/100,$("#input-g").val()/100,$("#input-i").val()/100,$("#input-h").val()/100,$("#input-l").val()/1,$("#input-h-rb").prop('checked'))
	redraw($("#input-r").val()/100,$("#input-g").val()/100,$("#input-i").val()/100,$("#input-h").val()/100,$("#input-l").val()/1,$("#input-h-rb").prop('checked'));
}

function init() {
	console.log('loaded')
	$("#input-r").change(requestRedraw);
	$("#input-g").change(requestRedraw);
	$("#input-i").change(requestRedraw);
	$("#input-h").change(requestRedraw);
	$("#input-l").change(requestRedraw);
	$("#input-h-rb").change(requestRedraw);
	requestRedraw();
};

$( document ).ready(function() {
    init();
});