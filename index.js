/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
(function() {
	"use strict"
	class TlxChart extends HTMLElement {
		static get observedAttributes() { 
			return ["chart-columns","chart-editable","chart-data","chart-options","chart-on","chart-type","style"]; 
		}
		constructor() {
			super();
			this.chartOptions = {};
		}
		connectedCallback() {
			const el = document.createElement("div");
			el.id = Date.now()+(String(Math.random()).substring(2));
			el.style = this.style.cssText;
			this.appendChild(el);
			tlx.view(this);
			this.showChart();
		}
		attributeChangedCallback(name,oldValue,newValue) {
			if(name==="style" && this.firstElementChild) this.firstElementChild.style = newValue;
			if(this.isConnected) this.showChart();
		}
		showChart() {
			TlxChart.loaded.then(() => {
				const el = this.firstElementChild,
					dataTable = () => {
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
						return this.dataTable;
					};
				!this.chartOptions.height || (el.style.height = this.chartOptions.height);
				!this.chartOptions.width || (el.style.width = this.chartOptions.width);
				this.chartWrapper = new google.visualization.ChartWrapper({
					chartType: this.chartType || this.getAttribute("chart-type"),
					dataTable: dataTable(),
					options: this.chartOptions,
					containerId: el.id
				});
				if(this.hasAttribute("chart-editable")) {
					let width = this.chartOptions.width || el.style.width,
						height = this.chartOptions.height || el.style.height;
					this.chartEditor = new google.visualization.ChartEditor();
					google.visualization.events.addListener(this.chartEditor, "ok", () => {
						this.chartWrapper = this.chartEditor.getChartWrapper(); 
						this.chartEditor.closeDialog(); 
						this.chartType = this.chartWrapper.getType();
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
	
	class Editor extends HTMLElement {
		static get observedAttributes() { 
			return ["for","chart-types","validate-data","edit-columns","style",]; // put chart type top left corner
		}
		constructor() {
			super();
			
		}
		connectedCallback() {
			const table = document.createElement("table"),
				chart = this.chart;
			table.id = Date.now()+(String(Math.random()).substring(2));
			Object.defineProperty(table,"showChart",{enumerable:false,configurable:true,writable:true,value:chartType => { !chartType || (chart.chartType=chartType); chart.showChart(); }});
			table.style = this.style.cssText;
			if(chart) {
				const data = chart.chartData,
					edit = {};
				chart.chartColumns.forEach((title,index) => edit[title] = {index});
				if(Array.isArray(this.editColumns)) this.editColumns.forEach(title => !edit[title] || (edit[title].editable=true))
			
				const thead = document.createElement("thead");
				let topleft = "<th></th>";
				if(this.chartTypes) {
					const options = this.chartTypes.reduce((accum,value) => accum += `<option>${value}</option>`,"")
					topleft = `<th><select onchange="(event => document.getElementById('${table.id}').showChart(event.target.value))(event)">${options}</select></th>`
				};
				thead.innerHTML = Object.keys(edit).reduce((accum,title) => accum += `<th>${title}</th>`,topleft);
				table.appendChild(thead);
				const tbody = document.createElement("tbody");
				data.forEach((item,index) => {
					const trow = document.createElement("tr");
					let i = 0;
					trow.innerHTML = `<th>${index+1}</th>`;
					Object.keys(edit).forEach(title => {
						const index = edit[title].index,
							value = item[index],
							type = typeof(value),
							td = document.createElement("td");
						let tvalue;
						if(edit[title].editable) {
							tvalue = document.createElement("input");
							tvalue.value = ["boolean","number","string"].includes(type) ? value : "";
							tvalue.onchange = event => {
								item[index] =  type==="number" ? parseFloat(event.target.value) : type==="boolean" ? JSON.parse(event.target.value) : event.target.value;
								if(this.chart.validateData) {
									const valid = this.chart.validateData(data,event,this);
									if(valid!==true) {
										if(typeof(valid)==="string") alert(valid);
										if(typeof(valid)==="object" && valid instanceof Error) throw valid;
										return;
									}
								}
								chart.showChart();
							}
						} else {
							tvalue = new Text();
							tvalue.data = value;
						}
						td.appendChild(tvalue);
						trow.appendChild(td);
					});
					tbody.appendChild(trow);
				});
				table.appendChild(tbody);
			}
			this.appendChild(table);
			tlx.view(this);
		}
		attributeChangedCallback(name,oldValue,newValue) {
			if(name==="for") this.chart = document.getElementById(newValue);
			if(name==="validate-data" && newValue) this.chart.validateData = Function("return " + newValue)();
			if(name==="style" && this.firstElementChild) this.firstElementChild.style = newValue;
			if(name==="edit-columns") this.editColumns = tlx.resolve(newValue);
			if(name==="chart-types") this.chartTypes = tlx.resolve(newValue);
			if(this.isConnected) { ; }
		}
		
	}
	Editor.create = tlx.component("tlx-chart-editor",{customElement:Editor})
	
	TlxChart.Editor = Editor;
	
	
	
	TlxChart.loaded = new Promise(resolve => TlxChart.loader = resolve);
	if(typeof(google)==="undefined" || !google.charts) {
		document.write(`<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js" onload="google.charts.load('current',{packages:['charteditor']});google.charts.setOnLoadCallback(() => TlxChart.loader(true))"><` + `/script>`);
	}
	
	if(typeof(module)!=="undefined") module.exports = TlxChart;
	if(typeof(window)!=="undefined") window.TlxChart = TlxChart;
})();