# tlx-chart

The module `tlx-chart` provides both a JavaScript component oriented and and reactive HTML custom element oriented [TLX](https://github.com/anywhichway/tlx) based wrapper for the [Google Charts library](https://developers.google.com/chart/). Although they have not all been tested yet, theoretically all charts in the [Google gallery](https://developers.google.com/chart/interactive/docs/gallery) should work.

# Installation

`npm install tlx-chart`

# Usage

To create a chart using HTML use the tag `tlx-chart` and provide attributes in hyphenated form that match the camelCased object keys used in the Google documentation, e.g.

```html
<tlx-chart id="mychart" 
	chart-type="PieChart" 
	chart-editable="true" 
	chart-columns="${['Element','Percentage']}" 
	chart-data="${[['Nitrogen',0.78],['Oxygen',0.21],['Other',0.01]]}"
</tlx-chart>
```

Will produce this chart:

![PieChart Example](./images/tagexample.png)

You can also add event handlers. The ones below just log co-ordinates to the console. See the [TLX directives documentation](https://github.com/anywhichway/tlx#directives) for more details.

```html
<tlx-chart id="mychart" 
	chart-type="PieChart" 
	chart-editable="true" 
	chart-columns="${['Element','Percentage']}" 
	chart-data="${[['Nitrogen',0.78],['Oxygen',0.21],['Other',0.01]]}" 
	chart-on="${{select: function() { console.log(this.getSelection())}, mouseover: (event) => console.log(event)}}"
</tlx-chart>
```

You can create charts from JavaScript using the factory function `tlxChart.create(config)`. The code below will produce the same chart.

```javascript
	const chart = tlxChart.create({
		chartType:"PieChart",
		chartEditable: true, 
		chartColumns: ['Element','Percentage'],
		chartData: [['Nitrogen',0.78],['Oxygen',0.21],['Other',0.01]]
	});
	document.body.appendChild(chart);
	chart.render();
```

# Release History

2017-12-02 v0.0.1 ALPHA Initial public release
