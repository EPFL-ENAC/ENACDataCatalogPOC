var config = {
  geojson: "https://raw.githubusercontent.com/EPFL-ENAC/ENACDataCatalogPOC/main/data/data.json",
  title: "ENAC data Library",
  layerName: "Data",
  hoverProperty: "species_sim",
  sortProperty: "dbh_2012_inches_diameter_at_breast_height_46",
  sortOrder: "desc"
};

var properties = [{
  value: "organisation",
  label: "Organisation Name",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string",
    input: "checkbox",
    vertical: true,
    multiple: true,
    operators: ["in", "not_in"],
    values: []
  },
  info: true
}
,{
  value: "group",
  label: "Group Name",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string"
  },
  info: true
}
,
{
  value: "author",
  label: "Author",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string"
  },
  info: true
}
,
{
  value: "format",
  label: "Format",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string"
  },
  info: true
},
{
  value: "description",
  label: "Description",
  table: {
    visible: true,
    sortable: false
  },
  filter: {
    type: "string"
  },
  info: true
}
,
{
  value: "link",
  label: "Link",
  table: {
    visible: true,
    sortable: false,
    formatter: urlFormatter
  },
  filter: {
    type: "string"
  },
  info: true
}


];




$(function() {
  $(".title").html(config.title);
  $("#layer-name").html(config.layerName);
});

function buildConfig() {
  filters = [];
  table = [{
    field: "action",
    title: "<i class='fa fa-gear'></i>&nbsp;Action",
    align: "center",
    valign: "middle",
    width: "75px",
    cardVisible: false,
    switchable: false,
    formatter: function(value, row, index) {
      return [
        '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px;">',
          '<i class="fa fa-search-plus"></i>',
        '</a>',
        '<a class="identify" href="javascript:void(0)" title="Identify">',
          '<i class="fa fa-info-circle"></i>',
        '</a>'
      ].join("");
    },
    events: {
      "click .zoom": function (e, value, row, index) {
        map.fitBounds(featureLayer.getLayer(row.leaflet_stamp).getBounds());
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      },
      "click .identify": function (e, value, row, index) {
        identifyFeature(row.leaflet_stamp);
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      }
    }
  }];



  $.each(properties, function(index, value) {
    // Filter config
    if (value.filter) {
      var id;
      if (value.filter.type == "integer") {
        id = "cast(properties->"+ value.value +" as int)";
      }
      else if (value.filter.type == "double") {
        id = "cast(properties->"+ value.value +" as double)";
      }
      else {
        id = "properties->" + value.value;
      }
      filters.push({
        id: id,
        label: value.label
      });
      $.each(value.filter, function(key, val) {
        if (filters[index]) {
          // If values array is empty, fetch all distinct values
          if (key == "values" && val.length === 0) {
            alasql("SELECT DISTINCT(properties->"+value.value+") AS field FROM ? ORDER BY field ASC", [geojson.features], function(results){
              distinctValues = [];
              $.each(results, function(index, value) {
                distinctValues.push(value.field);
              });
            });
            filters[index].values = distinctValues;
          } else {
            filters[index][key] = val;
          }
        }
      });
    }
    // Table config
    if (value.table) {
      table.push({
        field: value.value,
        title: value.label
      });

      $.each(value.table, function(key, val) {
        if (table[index+1]) {
          table[index+1][key] = val;
        }
      });
    }
  });

  buildFilters();
  buildTable();
}

// Basemap Layers
var mapboxOSM = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
});

var mapboxSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var highlightLayer = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      color: "#FFF",
      weight: 2,
      opacity: 1,
      fillColor: "#00FFFF",
      fillOpacity: 1,
      clickable: false
    });
  },
  style: function (feature) {
    return {
      color: "#00FFFF",
      weight: 2,
      opacity: 1,
      fillColor: "#00FFFF",
      fillOpacity: 0.5,
      clickable: false
    };
  }
});




function polystyle(feature) {
  return {
      fillColor: 'blue',
      weight: 2,
      opacity: 1,
      color: 'blue',  //Outline color
      fillOpacity: 0
  };
}



var featureLayer = L.geoJson(null, {
  
  style: polystyle,


  // filter: function(feature, layer) {
  // return feature.geometry.coordinates[0] !== 0 && feature.geometry.coordinates[1] !== 0;
  // },
  /*style: function (feature) {
    return {
      color: feature.properties.color
    };
  },*/

  pointToLayer: function (feature, latlng) {

    if (feature.geometry.coordinates[0] ==  7.4386  && feature.geometry.coordinates[1] == 46.9510  ) {
      markerColor = "#ffffff";
      radius = 0,
      weight= 0,
      opacity = 0
      fillOpacity =  0
    }
    else {
      markerColor = "#ffffff";
      radius = 4,
      weight= 2,
      opacity = 1
      fillOpacity =  1
    }


    // if (feature.properties && feature.properties["marker-color"]) {
    //   markerColor = feature.properties["marker-color"];
    // } else {
    //   markerColor = "#FF0000";
    // }
    return L.circleMarker(latlng, {
      radius: radius,
      weight: weight,
      fillColor: markerColor,
      color: markerColor,
      opacity: opacity,
      fillOpacity: fillOpacity
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {			
          identifyFeature(L.stamp(layer));
          highlightLayer.clearLayers();
          highlightLayer.addData(featureLayer.getLayer(L.stamp(layer)).toGeoJSON());
        },
        mouseover: function (e) {
          if (config.hoverProperty) {
            $(".info-control").html(feature.properties[config.hoverProperty]);
            $(".info-control").show();
          }
        },
        mouseout: function (e) {
          $(".info-control").hide();
        }
      });
    }
  }
});





featureLayer.on('click', e => {
	
	
	var clickedLayers = leafletPip.pointInLayer(e.latlng, featureLayer);
	
	var  clickBounds = L.latLngBounds(e.latlng, e.latlng);
	
	featureLayer.eachLayer(function (layer) {
		
		if (layer.feature.geometry.type == 'Point'){
			var lng = layer.feature.geometry.coordinates[0] 
			var lat = layer.feature.geometry.coordinates[1] 
			
			var dist_x = Math.abs(lng-e.latlng.lng)
			var dist_y = Math.abs(lat-e.latlng.lat)
			if (dist_x < 0.01 && dist_y < 0.01){
				
				clickedLayers.push(layer)
				
				};
			
		}
	

		
	});
    

	
	
	var content = ''
	
	
	
	for(let i = 0; i < clickedLayers.length; i++){ 
	
	content += "<table class='table table-striped table-bordered table-condensed'>";
	
	incr = i+1
	content += "<tr><th><b> Feature " + incr + "</b></th></tr>";
  
	
		
		 var featureProperties = clickedLayers[i].feature.properties;
		
		 $.each(featureProperties, function(key, value) {
    if (!value) {
      value = "";
    }
    if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
      value = "<a href='" + value + "' target='_blank'>" + value + "</a>";
    }
    $.each(properties, function(index, property) {
      if (key == property.value) {
        if (property.info !== false) {
          content += "<tr><th>" + property.label + "</th><td>" + value + "</td></tr>";
        }
      }
    });
  });
	
	content += "<table>";
		}
	
	  
  $("#feature-info").html(content);
  $("#featureModal").modal("show");
		


		});


// Fetch the GeoJSON file
$.getJSON(config.geojson, function (data) {
  geojson = data;
  features = $.map(geojson.features, function(feature) {
    return feature.properties;
  });
  featureLayer.addData(data);
  buildConfig();
  $("#loading-mask").hide();
});




var map = L.map("map", {
  layers: [mapboxOSM, featureLayer, highlightLayer],
  maxZoom: 15

}).fitWorld();


// RL remove
// ESRI geocoder
// var searchControl = L.esri.Geocoding.Controls.geosearch({
//   useMapBounds: 17
// }).addTo(map);

// Info control
var info = L.control({
  position: "bottomleft"
});

// Custom info hover control
info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info-control");
  this.update();
  return this._div;
};
info.update = function (props) {
  this._div.innerHTML = "";
};
info.addTo(map);
$(".info-control").hide();

// Larger screens get expanded layer control
if (document.body.clientWidth <= 767) {
  isCollapsed = true;
} else {
  isCollapsed = false;
}
var baseLayers = {
  "Street Map": mapboxOSM,
  "Aerial Imagery": mapboxSat
};
var overlayLayers = {
  "<span id='layer-name'>GeoJSON Layer</span>": featureLayer
};
var layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: isCollapsed
}).addTo(map);

// Filter table to only show features in current map bounds
map.on("moveend", function (e) {
  //syncTable(); RL change
  syncTable_with_geo(); 
});

map.on("click", function(e) {
  highlightLayer.clearLayers();
});

// Table formatter to make links clickable
function urlFormatter (value, row, index) {
  if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
    return "<a href='"+value+"' target='_blank'>"+value+"</a>";
  }
}

function buildFilters() {
  $("#query-builder").queryBuilder({
    allow_empty: true,
    filters: filters
  });
}

function applyFilter() {
  var query = "SELECT * FROM ?";
  var sql = $("#query-builder").queryBuilder("getSQL", false, false).sql;
  if (sql.length > 0) {
    query += " WHERE " + sql;
  }
  alasql(query, [geojson.features], function(features){
		featureLayer.clearLayers();

		featureLayer.addData(features);
		// syncTable(); RL change
		syncTable_with_geo();
	});
}

function buildTable() {
  $("#table").bootstrapTable({
    cache: false,
    height: $("#table-container").height(),
    undefinedText: "",
    striped: false,
    pagination: false,
    minimumCountColumns: 1,
    sortName: config.sortProperty,
    sortOrder: config.sortOrder,
    toolbar: "#toolbar",
    search: true,
    trimOnSearch: false,
    showColumns: true,
    showToggle: true,
    columns: table,
    onClickRow: function (row) {
      // do something!
    },
    onDblClickRow: function (row) {
      // do something!
    }
  });


  map.fitBounds(featureLayer.getBounds());

  $(window).resize(function () {
    $("#table").bootstrapTable("resetView", {
      height: $("#table-container").height()
    });
  });
}

function syncTable() {
  tableFeatures = [];
  featureLayer.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    if (map.hasLayer(featureLayer)) {
		
      if (map.getBounds().intersects(layer.getBounds())) {
        tableFeatures.push(layer.feature.properties);
      }
    }
  });
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible features");
  }
}




// New function RL
function syncTable_with_geo() {

  var is_sync =  document.getElementById("sync").checked
  var is_no_geom =  document.getElementById("no_geom").checked


  // Features with geometry
  tableFeatures = [];
  featureLayer.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    
    if(is_sync == true){
          if (map.hasLayer(featureLayer)) {
          
            if (map.getBounds().intersects(layer.getBounds())) {
              tableFeatures.push(layer.feature.properties);
            }
          }}

        else {
          tableFeatures.push(layer.feature.properties);
        
        }  

        });
  
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible features");
  }   

  // Features without geometry
  if(is_no_geom == true){

      var all_feature_in_geojson = [];
      var all_feature_in_geojson_with_no_geom = [];

      $.getJSON(config.geojson, function (data) {
        all_feature_in_geojson = data.features;

        for (index = 0; index < all_feature_in_geojson.length; index++) {
          geometry =  all_feature_in_geojson[index].geometry

          if(geometry === null ){
            // console.log('oopo0',all_feature_in_geojson[index])
            var ok = all_feature_in_geojson[index].properties
            all_feature_in_geojson_with_no_geom.push(ok)
          }

        }

        $("#table").bootstrapTable("append", JSON.parse(JSON.stringify(all_feature_in_geojson_with_no_geom)));


      });

  
  
  
  }







}


// New function RL
function unsyncTableFromMap() {
  tableFeatures = [];
  featureLayer.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    tableFeatures.push(layer.feature.properties);
  });
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible features");
  }
}



function identifyFeature(id) {
	
	
	if (featureLayer.getLayer(id).feature.geometry.type == 'Point'){
	
  var featureProperties = featureLayer.getLayer(id).feature.properties;
  var content = "<table class='table table-striped table-bordered table-condensed'>";
  $.each(featureProperties, function(key, value) {
    if (!value) {
      value = "";
    }
    if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
      value = "<a href='" + value + "' target='_blank'>" + value + "</a>";
    }
    $.each(properties, function(index, property) {
      if (key == property.value) {
        if (property.info !== false) {
          content += "<tr><th>" + property.label + "</th><td>" + value + "</td></tr>";
        }
      }
    });
  });
  content += "<table>";
  $("#feature-info").html(content);
  $("#featureModal").modal("show");
};}

function switchView(view) {
  if (view == "split") {
    $("#view").html("Split View");
    location.hash = "#split";
    $("#table-container").show();
    $("#table-container").css("height", "55%");
    $("#map-container").show();
    $("#map-container").css("height", "45%");
    $(window).resize();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "map") {
    $("#view").html("Map View");
    location.hash = "#map";
    $("#map-container").show();
    $("#map-container").css("height", "100%");
    $("#table-container").hide();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "table") {
    $("#view").html("Table View");
    location.hash = "#table";
    $("#table-container").show();
    $("#table-container").css("height", "100%");
    $("#map-container").hide();
    $(window).resize();
  }
}

$("[name='view']").click(function() {
  $(".in,.open").removeClass("in open");
  if (this.id === "map-graph") {
    switchView("split");
    return false;
  } else if (this.id === "map-only") {
    switchView("map");
    return false;
  } else if (this.id === "graph-only") {
    switchView("table");
    return false;
  }
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#filter-btn").click(function() {
  $("#filterModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#chart-btn").click(function() {
  $("#chartModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#view-sql-btn").click(function() {
  alert($("#query-builder").queryBuilder("getSQL", false, false).sql);
});

$("#apply-filter-btn").click(function() {
  applyFilter();
});


// RL adding
var geofilter = 'off'

$('.bs-switch').click(function() { 
  
  $(this).find('.btn').toggleClass('active'); 

  if(geofilter == 'on'){geofilter = 'off'}else{geofilter = 'on'}
  
  syncTable_with_geo();

});

$('.bs-switch').click(function() { 
  
  syncTable_with_geo();

});

$('.bs-switch2').click(function() { 
  
  
  syncTable_with_geo();

});



// $('.btn-toggle').click(function() {
  
//   $(this).find('.btn').toggleClass('active'); 

//   if(geofilter == 'on'){geofilter = 'off'}else{geofilter = 'on'}

//   syncTable_with_geo();
  
  
//   if ($(this).find('.btn-primary').size()>0) {
//     $(this).find('.btn').toggleClass('btn-primary');
//   }
//   if ($(this).find('.btn-danger').size()>0) {
//     $(this).find('.btn').toggleClass('btn-danger');
//   }
//   if ($(this).find('.btn-success').size()>0) {
//     $(this).find('.btn').toggleClass('btn-success');
//   }
//   if ($(this).find('.btn-info').size()>0) {
//     $(this).find('.btn').toggleClass('btn-info');
//   }
  
//   $(this).find('.btn').toggleClass('btn-default');
     
// });




$("#apply-geofilter-btn").click(function() {
  unsyncTableFromMap();
});

$("#reset-filter-btn").click(function() {
  $("#query-builder").queryBuilder("reset");
  applyFilter();
});




$("#extent-btn").click(function() {
  map.fitBounds(featureLayer.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-csv-btn").click(function() {
  $("#table").tableExport({
    type: "csv",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-excel-btn").click(function() {
  $("#table").tableExport({
    type: "excel",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-pdf-btn").click(function() {
  $("#table").tableExport({
    type: "pdf",
    ignoreColumn: [0],
    fileName: "data",
    jspdf: {
      format: "bestfit",
      margins: {
        left: 20,
        right: 10,
        top: 20,
        bottom: 20
      },
      autotable: {
        extendWidth: false,
        overflow: "linebreak"
      }
    }
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});


