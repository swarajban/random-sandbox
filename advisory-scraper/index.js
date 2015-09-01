var fs = require('fs');

var request = require('request');
var async = require('async');

var markers = require('./markers.json');


var COUNTER = 0;

function main () {
  console.log('starting');
  var markerIDs = getMarkerIDs();

  //markerIDs = ['35709'];
  var tasks = makeFetchTasks(markerIDs);


  var PARALLEL_LIMIT = 5;
  async.parallelLimit(
    tasks,
    PARALLEL_LIMIT,
    function (err, results) {
      writeResults('./out.csv', results);
      process.exit(0);
    }

  );

}

function writeResults (fillName, results) {
  fs.appendFileSync(fillName, 'providerID,lat,lon,providerName,state,zip,percentReAdmissionsAdjustmentFactor,reAdmissionsAdjustmentFactor,baseOperatingPayment,reAdmissionsPenalty\n');
  results.forEach(
    function writeProviderInfo (providerInfo) {
      var provierRowData = [
        providerInfo.providerID,
        providerInfo.lat,
        providerInfo.lon,
        providerInfo.providerName,
        providerInfo.state,
        providerInfo.zip,
        providerInfo.percentReAdmissionsAdjustmentFactor,
        providerInfo.reAdmissionsAdjustmentFactor,
        providerInfo.baseOperatingPayment,
        providerInfo.reAdmissionsPenalty
      ];
      var providerRowString = provierRowData.join(',') + '\n';
      fs.appendFileSync(fillName, providerRowString);
    }
  );
  console.log('done writing output');
}

function makeFetchTasks (markerIDs) {
  var tasks = [];
  markerIDs.forEach(
    function makeTask (markerID) {
      tasks.push(
        function task (callback) {
          getProviderInfo(
            markerID,
            function onGetProviderInfo (info) {
              COUNTER++;
              console.log('Fetched info for provider ' + info.providerID + '. Current: ' + COUNTER);
              callback(null, info);
            }
          );
        }
      );
    }
  );
  return tasks;
}



function getMarkerIDs () {
  var markerIDs = [];
  markers.forEach(
    function getMarkerID (markerObject) {
      markerIDs.push(markerObject['marker_id']);
    }
  );
  return markerIDs;
}



function getProviderInfo (markerID, callback) {
  var requestOptions = {
    method: 'POST',
    form: {
      mapId: 214,
      clickedMarkerID: markerID
    }
  };

  var url = 'https://fac.advisory.com/2013_G_DAG_Gmap/Home/getInfoBoxConfig';

  request(
    url,
    requestOptions,
    function onResponse (error, response, body) {
      var rawResult = JSON.parse(body);
      var result = {
        lat: rawResult[0]['gmap_lat'],
        lon: rawResult[0]['gmap_lng'],
        providerID: rawResult[0]['attribute_display_value'],
        providerName: rawResult[1]['attribute_display_value'],
        state: rawResult[2]['attribute_display_value'],
        zip: rawResult[3]['attribute_display_value'],
        percentReAdmissionsAdjustmentFactor: rawResult[4]['attribute_display_value'],
        reAdmissionsAdjustmentFactor: rawResult[5]['attribute_display_value'],
        baseOperatingPayment: rawResult[6]['attribute_display_value'],
        reAdmissionsPenalty: rawResult[7]['attribute_display_value']

      };
      callback(result);
    }
  );


}


main();
