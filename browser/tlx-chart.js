(function() {
	"use strict"
	class TlxChart extends HTMLElement {
		static get observedAttributes() { 
			return ["chart-columns","chart-data","chart-options","chart-on","chart-type"]; 
		}
		constructor() {
			super();
			this.chartOptions = {};
		}
		connectedCallback() {
			const el = document.createElement("div");
			el.id = Date.now()+(String(Math.random()).substring(2));
			this.appendChild(el);
			tlx.view(this);
			this.showChart();
		}
		attributeChangedCallback() {
			if(this.isConnected) this.showChart();
		}
		showChart() {
			TlxChart.loaded.then(() => {
				const el = this.firstElementChild;
				!this.chartOptions.height || (el.style.height = this.chartOptions.height);
				!this.chartOptions.width || (el.style.width = this.chartOptions.width);
				this.dataTable =  new google.visualization.arrayToDataTable(this.chartData,(this.chartColumns ? this.chartColumns.length>0 : false));
				if(this.chartColumns) {
					for(let column of this.chartColumns) {
						if(typeof(column)==="object") {
							this.dataTable.addColumn(column.type,column.label);
						} else {
							//this.dataTable.addColumn("string",column);
						}
					}
				}
				this.chartWrapper = new google.visualization.ChartWrapper({
					chartType: this.chartType || this.getAttribute("chart-type"),
					dataTable: this.dataTable,
					options: this.chartOptions,
					containerId: el.id
				});
				if(this.hasAttribute("chart-editable")) {
					let width,height;
					this.chartEditor = new google.visualization.ChartEditor();
					google.visualization.events.addListener(this.chartEditor, "ok", () => {
						this.chartWrapper = this.chartEditor.getChartWrapper(); 
						this.chartEditor.closeDialog(); 
						this.chartWrapper.setOption("width",width);
						this.chartWrapper.setOption("height",height);
						this.chartWrapper.draw(); 
					});
					const btn = document.createElement("button");
					btn.innerHTML = "Edit";
					btn.id = this.id + "Edit";
					btn.onclick = () => {
						const {w,h} = this.getBoundingClientRect();
						width = w;
						height = h;
						this.chartEditor.openDialog(this.chartWrapper,{});
					}
					if(!document.getElementById(btn.id)) this.appendChild(btn);
				}
				google.visualization.events.addListener(this.chartWrapper, "ready",
						() => {
							const chart = this.chartWrapper.getChart();
							for(let eventName in this.chartOn) {
								let name = eventName;
								["select","ready","error"].includes(eventName) || (name = "on"+eventName);
								const listener = (event) => {
									this.chartOn[eventName].call(chart,event);
								}
								google.visualization.events.addListener(chart, name, listener);
							}
						});
				this.chartWrapper.draw();
			});
		}
	}
	
	TlxChart.create = tlx.component("tlx-chart",{customElement:TlxChart});
	TlxChart.loaded = new Promise(resolve => TlxChart.loader = resolve);
	if(typeof(google)==="undefined" || !google.charts) {
		document.write(`<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js" onload="google.charts.load('current',{packages:['charteditor']});google.charts.setOnLoadCallback(() => TlxChart.loader(true))"><` + `/script>`);
	}
	
	if(typeof(module)!=="undefined") module.exports = TlxChart;
	if(typeof(window)!=="undefined") window.TlxChart = TlxChart;
})();