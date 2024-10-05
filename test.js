import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

am5.ready(function () {
  // Create root element
  var root = am5.Root.new("chartdiv");

  var myTheme = am5.Theme.new(root);
  myTheme.rule("Label").setAll({
    fill: am5.color(0xff0000),
    opacity: 0,
    fillOpacity: 0,
    fontSize: "1.5em",
  });

  root.setThemes([myTheme]);

  // Create the map chart
  var chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      background: am5.Rectangle.new(root, {
        fill: am5.color(0x00000000), // Fully transparent background
      }),
    }),
  );

  // Create the main polygon series for countries
  var polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
    }),
  );

  // Set default appearance for the countries
  polygonSeries.mapPolygons.template.setAll({
    tooltipText: "{name}",
    fill: am5.color(0xd4d4d4), // Light grey color for countries
    stroke: am5.color(0xffffff), // White borders between countries
  });

  // Hover state for countries
  polygonSeries.mapPolygons.template.states.create("hover", {
    fill: am5.color(0x5390d9), // Blue on hover
  });

  // Remove or hide graticule lines (the grid-like lines often visible on the map)
  var graticuleSeries = chart.series.push(
    am5map.GraticuleSeries.new(root, {
      step: 10, // Graticule step
    }),
  );
  graticuleSeries.mapLines.template.setAll({
    stroke: am5.color(0x00000000), // Fully transparent graticule lines
    strokeOpacity: 0, // Set opacity to 0 for full transparency
  });

  // Make the chart animate on load
  chart.appear(1000, 100);
}); // end am5.ready()
