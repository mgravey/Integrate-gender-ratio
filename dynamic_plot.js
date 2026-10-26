var defaults = { r: 30, g: 50, i: 30, h: 50, l: 30 };

// sequential palette (viridis, light end trimmed): h is ordered, so neighbouring curves get neighbouring colors
var palette = ['#440154', '#482374', '#433e85', '#38598c', '#2d708e', '#25858e',
	'#1e9b8a', '#2ab07f', '#52c569', '#86d549', '#c2df23'];

// time to reach g under the constant model: g = i + x/l*(h - r)
function timeConstant(r, g, i, h, l) {
	return l * (g - i) / (h - r);
}

// time to reach g under the evolutionary model: u_x = h + (i - h)(1 - 1/l)^x
function timeEvolutionary(g, i, h, l) {
	return Math.log((g - h) / (i - h)) / Math.log(1 - 1 / l);
}

function formatDuration(x) {
	if (x === 0) return 'already reached';
	if (!isFinite(x) || x < 0) return 'never';
	return x.toFixed(1) + ' years';
}

function layout(title, l) {
	return {
		title: { text: title, font: { size: 15 } },
		xaxis: { title: { text: 'Years since the start of the policy' }, range: [0, 2.99 * l] },
		yaxis: { title: { text: 'Share of the gender of interest' }, range: [0, 100], ticksuffix: '%' },
		hovermode: 'x unified',
		legend: { title: { text: 'Hiring ratio' } },
		margin: { t: 80 }
	};
}

function redraw(r, g, i, h, l, rb) {
	var hs = rb ? palette.map((c, index) => index * 0.1) : [h];

	var x = Array(Math.ceil(4 * 3 * l)).fill().map((element, index) => index / 4);
	var traces1 = [];
	var traces2 = [];
	for (var idx = hs.length - 1; idx >= 0; idx--) {
		var y1 = x.map(x => Math.min(Math.max(0, i + x / l * (hs[idx] - r)), 1) * 100);
		var y2 = x.map(x => Math.min(Math.max(0, Math.pow((1 - 1 / l), x) * (i - hs[idx]) + hs[idx]), 1) * 100);
		var style = {
			mode: 'lines',
			name: 'h=' + (hs[idx] * 100).toFixed(0) + '%',
			line: { color: rb ? palette[idx] : palette[4], width: 2 },
			hovertemplate: '%{y:.1f}%'
		};
		traces1.push(Object.assign({ x: x, y: y1 }, style));
		traces2.push(Object.assign({ x: x, y: y2 }, style));
	}

	var goalLine = {
		x: [0, 3 * l],
		y: [g * 100, g * 100],
		mode: 'lines',
		name: 'Goal',
		line: { color: 'rgb(0, 0, 0)', width: 2, dash: 'dash' },
		hoverinfo: 'skip'
	};
	traces1.push(goalLine);
	traces2.push(goalLine);

	// with a single hiring ratio, mark when the goal is reached
	if (!rb) {
		[[traces1, timeConstant(r, g, i, h, l)], [traces2, timeEvolutionary(g, i, h, l)]].forEach(function (pair) {
			if (isFinite(pair[1]) && pair[1] > 0 && pair[1] < 3 * l)
				pair[0].push({
					x: [pair[1]],
					y: [g * 100],
					mode: 'markers+text',
					name: 'Goal reached',
					text: [pair[1].toFixed(1) + ' years'],
					textposition: 'top left',
					marker: { color: 'rgb(0, 0, 0)', size: 9 },
					hoverinfo: 'skip',
					showlegend: false
				});
		});
	}

	var config = { displaylogo: false, responsive: true };
	Plotly.react('constantRatios', traces1,
		layout('Gender ratio as a function of time,<br>under constant hiring and retirement ratio hypothesis', l), config);
	Plotly.react('evolutionaryState', traces2,
		layout('Gender ratio as a function of time,<br>under evolutionary retirement ratio and constant hiring hypothesis<br>(retirement equals the gender proportion)', l), config);
}

function updateDynamic(r, g, i, h, l) {
	$('.val-h').text((h * 100).toFixed(0));
	$('.val-r').text((r * 100).toFixed(0));
	$('.val-g').text(+(g * 100).toFixed(1));
	$('.val-i').text((i * 100).toFixed(0));
	$('.val-l').text(l);

	$('#dynamic-const').text(formatDuration(timeConstant(r, g, i, h, l)));
	$('#dynamic-const-r-eq-i').text(formatDuration(timeConstant(i, g, i, h, l)));
	$('#dynamic-evol').text(formatDuration(timeEvolutionary(g, i, h, l)));

	// bounds quoted in the conclusion: hire only the under-represented side (or exactly g), while only the other side leaves
	var up = g >= i ? 1 : 0;
	$('#concl-min').text(formatDuration(g === i ? 0 : timeConstant(1 - up, g, i, up, l)));
	$('#concl-unbiased').text(formatDuration(g === i ? 0 : timeConstant(1 - up, g, i, g, l)));
	$('#concl-evol').text(formatDuration(timeEvolutionary(g, i, h, l)));
}

function readSettings() {
	return {
		r: $('#input-r').val() / 100,
		g: $('#input-g').val() / 100,
		i: $('#input-i').val() / 100,
		h: $('#input-h').val() / 100,
		l: $('#input-l').val() / 1,
		rb: $('#input-h-rb').prop('checked')
	};
}

// keep the current scenario in the URL so it can be shared
function updateUrl(s) {
	var params = new URLSearchParams();
	['r', 'g', 'i', 'h'].forEach(k => params.set(k, +(s[k] * 100).toFixed(2)));
	params.set('l', s.l);
	if (s.rb) params.set('all', '1');
	history.replaceState(null, '', '?' + params.toString());
}

function loadUrl() {
	var params = new URLSearchParams(location.search);
	Object.keys(defaults).forEach(function (k) {
		if (params.has(k) && params.get(k) !== '' && !isNaN(params.get(k)))
			$('#input-' + k).val(params.get(k));
	});
	if (params.get('all') === '1') $('#input-h-rb').prop('checked', true);
}

function requestRedraw() {
	var s = readSettings();
	// ignore incomplete input (e.g. an empty field while typing)
	if ([s.r, s.g, s.i, s.h].some(v => isNaN(v) || v < 0 || v > 1) || !(s.l > 1))
		return;
	updateDynamic(s.r, s.g, s.i, s.h, s.l);
	redraw(s.r, s.g, s.i, s.h, s.l, s.rb);
	updateUrl(s);
}

function init() {
	loadUrl();
	$('#settings-form').on('input change', requestRedraw);
	$('#settings-form').on('submit', e => e.preventDefault());
	// the reset event fires before the fields are restored
	$('#settings-form').on('reset', () => setTimeout(requestRedraw));
	$('#copy-link').on('click', function () {
		var button = $(this);
		navigator.clipboard.writeText(location.href).then(function () {
			button.text('Copied!');
			setTimeout(() => button.text('Copy link'), 1500);
		});
	});
	requestRedraw();
}

$(document).ready(function () {
	init();
});
