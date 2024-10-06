import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import countryToCode from "./countryToCode.json";

// const wasteData = {
//   "United States": { waste: 5000 },
//   China: { waste: 10000 },
//   India: { waste: 3000 },
//   Brazil: { waste: 2000 },
//   Australia: { waste: 1500 },
// };
//

import wasteData from "./waste_data.json";

const polygonSeriesData = [];

function hexToRgb(hex) {
  // Convert hex color to RGB
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  // Convert RGB to hex color
  return (r << 16) | (g << 8) | b;
}

function getColor(percentage, startColor, endColor) {
  // Ensure percentage is between 0 and 100
  percentage = Math.max(0, Math.min(100, percentage));

  // Convert hex colors to RGB
  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);

  // Interpolate between the two colors
  const r = Math.floor(
    startRgb.r + (endRgb.r - startRgb.r) * (percentage / 100),
  );
  const g = Math.floor(
    startRgb.g + (endRgb.g - startRgb.g) * (percentage / 100),
  );
  const b = Math.floor(
    startRgb.b + (endRgb.b - startRgb.b) * (percentage / 100),
  );

  // Return the color as an amCharts color
  return am5.color(rgbToHex(r, g, b));
}

// Example usage in the loop
const startColor = "#FFFFFF"; // White
const endColor = "#8B0000"; // Dark Red

let maxWaste = 0;
for (let country in wasteData) {
  if (wasteData[country]?.waste > maxWaste) {
    maxWaste = wasteData[country]?.waste;
  }
}

for (let country in wasteData) {
  if (!countryToCode[country]) {
    console.log(`Country not found: ${country}`);
    continue;
  }

  const wastePercentage = (wasteData[country]?.waste / maxWaste) * 100; // Scale to a percentage
  const color = getColor(wastePercentage, startColor, endColor); // Get the color based on percentage

  polygonSeriesData.push({
    id: countryToCode[country],
    polygonSettings: {
      fill: color,
    },
  });
}

console.log(polygonSeriesData);

am5.ready(function () {
  // Create root element
  var root = am5.Root.new("chartdiv");

  // Set themes
  root.setThemes([am5themes_Animated.new(root)]);

  // Create the map chart
  var chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      paddingTop: 100,
      paddingRight: 100,
      paddingBottom: 100,
      paddingLeft: 100,
    }),
  );

  chart.set(
    "background",
    am5.Rectangle.new(root, {
      fill: am5.color(0x264653),
    }),
  );

  var backgroundSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {}),
  );
  backgroundSeries.mapPolygons.template.setAll({
    fill: am5.color(0x5390d9),
    fillOpacity: 1,
    strokeOpacity: 0,
  });
  backgroundSeries.data.push({
    geometry: am5map.getGeoRectangle(90, 180, -90, -180),
  });

  // Create main polygon series for countries
  var polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      // Exclude all countries by default
    }),
  );

  // Set the default fill color to grey
  polygonSeries.mapPolygons.template.setAll({
    tooltipText: "{name}",
    toggleKey: "active",
    interactive: true,
    templateField: "polygonSettings",
    fill: am5.color(0xd4d4d4), // Grey color for all countries
  });

  polygonSeries.mapPolygons.template.states.create("hover", {
    fill: root.interfaceColors.get("primaryButtonHover"),
  });

  polygonSeries.mapPolygons.template.states.create("active", {
    fill: root.interfaceColors.get("primaryButtonHover"),
  });

  // Add only the countries in the wasteData
  polygonSeries.data.setAll(polygonSeriesData);
  polygonSeries.mapPolygons.each(function (polygon) {
    polygon.on("active", function (active, target) {
      if (previousPolygon && previousPolygon != target) {
        previousPolygon.set("active", false);
      }
      if (target.get("active")) {
        selectCountry(target.dataItem.get("id"));
      }
      previousPolygon = target;
    });
  });

  // Create series for background fill

  var graticuleSeries = chart.series.unshift(
    am5map.GraticuleSeries.new(root, {
      step: 10,
    }),
  );

  // chart.set(
  //   "background",
  //   am5.Fill.new(root, {
  //     color: am5.color(0xffffff), // Set your desired color here (e.g., blue)
  //   }),
  // );

  graticuleSeries.mapLines.template.set("strokeOpacity", 0.1);

  // Set up events
  var previousPolygon;

  polygonSeries.mapPolygons.template.on("active", function (active, target) {
    if (previousPolygon && previousPolygon != target) {
      previousPolygon.set("active", false);
    }
    if (target.get("active")) {
      selectCountry(target.dataItem.get("id"));
    }
    previousPolygon = target;
  });

  function selectCountry(id) {
    var dataItem = polygonSeries.getDataItemById(id);
    var target = dataItem.get("mapPolygon");
    if (target) {
      var centroid = target.geoCentroid();
      if (centroid) {
        chart.animate({
          key: "rotationX",
          to: -centroid.longitude,
          duration: 1500,
          easing: am5.ease.inOut(am5.ease.cubic),
        });
        chart.animate({
          key: "rotationY",
          to: -centroid.latitude,
          duration: 1500,
          easing: am5.ease.inOut(am5.ease.cubic),
        });
      }
    }
  }

  // Make stuff animate on load
  chart.appear(1000, 100);
}); // end am5.ready()
