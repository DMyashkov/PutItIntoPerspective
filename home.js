import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import countryToCode from "./countryToCode.json";
import wasteData from "./cleaned_data.json";
import codeToCountry from "./codeToCountry.json";

const polygonSeriesData = [];

// Convert hex color to RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

// Convert RGB to hex color
function rgbToHex(r, g, b) {
  return (r << 16) | (g << 8) | b;
}

// Get color based on waste amount using logarithmic scaling with power transformation
function getColor(waste, maxWaste, startColor, endColor) {
  const logWaste = Math.log(waste + 1); // Log waste
  const logMaxWaste = Math.log(maxWaste + 1); // Log max waste for normalization
  const percentage = (logWaste / logMaxWaste) * 100; // Scale to percentage

  // Apply power transformation to create more disparity
  const transformedPercentage = Math.pow(percentage / 100, 1.5) * 100; // Adjust the exponent to control the disparity

  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);

  const r = Math.floor(
    startRgb.r + (endRgb.r - startRgb.r) * (transformedPercentage / 100),
  );
  const g = Math.floor(
    startRgb.g + (endRgb.g - startRgb.g) * (transformedPercentage / 100),
  );
  const b = Math.floor(
    startRgb.b + (endRgb.b - startRgb.b) * (transformedPercentage / 100),
  );

  return am5.color(rgbToHex(r, g, b));
}

// Example usage in the loop
const startColor = "#FFFFFF"; // White
const endColor = "#8B0000"; // Dark Red

let maxWaste = 0;

// Determine the maximum waste value
for (let country in wasteData) {
  console.log(country, wasteData[country].waste);
  if (wasteData[country].waste > maxWaste) {
    maxWaste = wasteData[country].waste;
  }
}
console.log(maxWaste);

// Prepare polygon series data with colors
for (let country in wasteData) {
  if (!countryToCode[country]) {
    console.log(`Country not found: ${country}`);
    continue;
  }

  const color = getColor(
    wasteData[country]?.waste,
    maxWaste,
    startColor,
    endColor,
  ); // Get the color based on logarithmic value

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
      paddingTop: 25,
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

  // Update the selectCountry function
  // Add a variable to store the selected country
  let selectedCountry = null;

  // Select the button from the DOM
  const selectCountryButton = document.getElementById("selectCountryButton");

  // Update the selectCountry function
  const defaultColor = am5.color(0xd4d4d4); // Grey color for all countries

  // Update the selectCountry function
  function selectCountry(id) {
    console.log("Selecting country:", id);
    selectedCountry = id; // Store the selected country

    // Get the country data from polygonSeriesData to retrieve its color
    const countryData = polygonSeriesData.find(
      (country) => country.id === selectedCountry,
    );

    // Update button properties based on country selection
    if (countryData) {
      selectCountryButton.textContent = `Click to visualize the mismanaged plastic waste for ${codeToCountry[id]}`;
      selectCountryButton.style.backgroundColor =
        countryData.polygonSettings.fill.toString();
      selectCountryButton.style.color = "white"; // Ensure text is visible on dark colors
    } else {
      selectCountryButton.textContent = `Data for this country is not available`;
      selectCountryButton.style.backgroundColor = defaultColor.toString();
      selectCountryButton.style.color = "black"; // Change text color for visibility
    }

    // Enable the button by adding an event listener to call the visualization function when clicked
    selectCountryButton.onclick = () => {
      const dataToPass = wasteData[codeToCountry[id]];
      const h = 20000;
      const w = 15895.903546583828;
      const d = 15746.27062983472;
      const percentageOfContentInBoundingBox = 0.9;
      const waterBottlesPerTon = 60479;
      const waterBottleVolume = 0.5;
      console.log(
        waterBottlesPerTon,
        waterBottleVolume,
        dataToPass.waste,
        (waterBottlesPerTon * waterBottleVolume * dataToPass.waste * 10) / 9,
      );
      const volumeTrashBag =
        waterBottlesPerTon *
        waterBottleVolume *
        dataToPass.waste *
        (1 / percentageOfContentInBoundingBox) *
        0.001;
      console.log(volumeTrashBag, "m^3");
      const trashBagHeight = Math.pow(
        volumeTrashBag * (h / w) * (h / d),
        1 / 3,
      );
      const trashBagHeightDecimeters = trashBagHeight * 10;
      localStorage.setItem("height", trashBagHeightDecimeters);
      localStorage.setItem("data", JSON.stringify(dataToPass));
      localStorage.setItem("country", codeToCountry[id]);
      window.location.href = "visualization.html";
    };

    var dataItem = polygonSeries.getDataItemById(id);
    var target = dataItem ? dataItem.get("mapPolygon") : null; // Get target only if dataItem exists
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

  // Function to visualize plastic waste data for the selected country

  // Make stuff animate on load
  chart.appear(1000, 100);
}); // end am5.ready()
