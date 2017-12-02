(function() {
	class tlxChart extends HTMLElement {
		static get attributes() {
			return {
				"chart-columns": [],
				"chart-data": [],
				"chart-options": {
					legend: "",
					title: "",
					is3D: false
				},
				"chart-on": {}
			}
		}
		static create(config,el=document.createElement("tlx-chart")) {
			Object.setPrototypeOf(el,tlxChart.prototype);
			for(let key in tlxChart.attributes) {
				tlx.setAttribute(el,key,tlxChart.attributes[key]);
			}
			Object.assign(el,config);
			return el;
		}
		render(attributes) {
			//const me = this;
			if(attributes) {
				tlx.resolve(attributes,this);
				for(let key in attributes) {
					tlx.setAttribute(this,key,attributes[key]);
					//this[key] = attributes[key];
				}
			}
			this.dataTable =  new google.visualization.arrayToDataTable(this.chartData,(this.chartColumns ? this.chartColumns.length>0 : false));
			if(this.chartColumns) {
				for(let column of this.chartColumns) {
					if(typeof(column)==="object") {
						this.dataTable.addColumn(column.type,column.label);
					}
				}
			}
			const el = document.createElement("div");
			el.id = Date.now()+(String(Math.random()).substring(2));
			!this.chartOptions.height || (el.style.height = this.chartOptions.height);
			!this.chartOptions.width || (el.style.width = this.chartOptions.width);
			this.appendChild(el);
			this.chartWrapper = new google.visualization.ChartWrapper({
				chartType: this.chartType,
				dataTable: this.dataTable,
				options: this.chartOptions,
				containerId: el.id
			});
			if(this.chartEditable) {
				this.chartEditor = new google.visualization.ChartEditor();
				google.visualization.events.addListener(this.chartEditor, "ok", () => { this.chartWrapper = this.chartEditor.getChartWrapper(); this.chartEditor.closeDialog(); this.chartWrapper.draw(); });
				const btn = document.createElement("button");
				btn.innerHTML = "Edit";
				btn.onclick = () => {
					this.chartEditor.openDialog(this.chartWrapper,{});
					const chld = document.createElement("div")
					chld.innerHTML = "THIS IS A TEST";
					document.getElementsByClassName("modal-dialog google-visualization-charteditor-dialog")[0].appendChild(chld);
				}
				this.appendChild(btn);
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
		}
	}
	var resolver;
	tlxChart.loaded = new Promise((resolve,reject) => resolver = resolve);
	document.registerTlxComponent("tlx-chart",tlxChart);
	if(typeof(google)==="undefined" || !google.charts) {
		document.write(`<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js" onload="google.charts.load('current',{packages:['charteditor']});google.charts.setOnLoadCallback(() => resolver(true))"><` + `/script>`);
	}
	
	customElements.define("tlx-chart",tlxChart);
	
	if(typeof(module)!=="undefined") module.exports = tlxChart;
	if(typeof(window)!=="undefined") window.tlxChart = tlxChart;
})();